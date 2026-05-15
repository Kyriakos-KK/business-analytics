'use strict'
/**
 * fix-images.cjs
 * Re-extracts image src from article content for articles missing an image field.
 * Handles: relative paths, full URLs, newsletter/ paths.
 * Downloads newly found images and updates the DB image field.
 */

const fs       = require('fs')
const path     = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const PUBLIC_DIR   = path.join(PROJECT_ROOT, 'public', 'images')
const BASE        = 'https://www.business-analytics.gr'
const DELAY_MS    = 150
const TIMEOUT_MS  = 15000

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true })

// Extract all image src values from HTML content (first match wins)
function extractSrc(html) {
  const m = html.match(/src=["']([^"']+)["']/i)
  return m ? m[1].trim() : null
}

// Given a src, return { downloadUrl, localFile } or null if not downloadable
function resolveImage(src) {
  // Skip base64 / data URIs
  if (src.startsWith('data:')) return null

  let downloadUrl = null
  let filename = null

  if (src.startsWith('http')) {
    // Full URL - use as-is
    downloadUrl = src
    filename = path.basename(src.split('?')[0]).replace(/\s+/g, '-')
  } else if (src.startsWith('/images/')) {
    // Already rewritten - file should exist locally
    filename = path.basename(src).replace(/\s+/g, '-')
    downloadUrl = BASE + '/images/stories/' + filename
  } else if (src.startsWith('images/stories/')) {
    filename = src.replace('images/stories/', '').replace(/\s+/g, '-')
    downloadUrl = BASE + '/images/stories/' + filename
  } else if (src.startsWith('newsletter/')) {
    filename = path.basename(src).replace(/\s+/g, '-')
    downloadUrl = BASE + '/' + src
  } else {
    filename = path.basename(src).replace(/\s+/g, '-')
    downloadUrl = BASE + '/images/stories/' + filename
  }

  if (!filename) return null
  return { downloadUrl, localFile: path.join(PUBLIC_DIR, filename), imagePath: '/images/' + filename }
}

async function download(url, dest) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return false
    const buf = await res.arrayBuffer()
    fs.writeFileSync(dest, Buffer.from(buf))
    return true
  } catch {
    clearTimeout(timer)
    return false
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

;(async () => {
  // Read articles with empty image but containing <img> in content
  const raw = execSync(
    `sqlite3 -json "${DB_PATH}" "SELECT id, content FROM articles WHERE (image = '' OR image IS NULL) AND content LIKE '%<img%';"`,
    { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 }
  )
  const articles = JSON.parse(raw)
  console.log(`Found ${articles.length} articles with <img> but no image field`)

  let downloaded = 0
  let failed = 0
  let skipped = 0
  const updates = []

  for (const row of articles) {
    const src = extractSrc(row.content)
    if (!src) { skipped++; continue }

    const resolved = resolveImage(src)
    if (!resolved) { skipped++; continue }

    const { downloadUrl, localFile, imagePath } = resolved

    // Already downloaded?
    if (fs.existsSync(localFile)) {
      updates.push({ id: row.id, imagePath })
      skipped++
      continue
    }

    process.stdout.write(`  Downloading ${path.basename(localFile)}... `)
    const ok = await download(downloadUrl, localFile)
    if (ok) {
      console.log('OK')
      updates.push({ id: row.id, imagePath })
      downloaded++
    } else {
      console.log('FAILED - ' + downloadUrl)
      failed++
    }
    await sleep(DELAY_MS)
  }

  if (updates.length > 0) {
    // Write and apply SQL updates
    const lines = ['BEGIN TRANSACTION;']
    for (const u of updates) {
      lines.push("UPDATE articles SET image = '" + u.imagePath + "' WHERE id = " + u.id + ";")
    }
    lines.push('COMMIT;')
    const sqlPath = path.join(PROJECT_ROOT, 'migration-data', 'fix-images.sql')
    fs.writeFileSync(sqlPath, lines.join('\n'), 'utf8')
    execSync(`sqlite3 "${DB_PATH}" ".read migration-data/fix-images.sql"`, { cwd: PROJECT_ROOT })
    console.log(`Updated ${updates.length} image fields in DB`)
  }

  console.log(`\nDone — ${downloaded} downloaded, ${updates.length} DB records updated, ${failed} failed, ${skipped} skipped`)
})()
