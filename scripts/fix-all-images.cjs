'use strict'
/**
 * fix-all-images.cjs
 * Rewrites every remaining relative/absolute image src in article content to /images/...
 * then downloads any files not already on disk.
 * Also updates the image field for articles that still have it empty.
 */

const fs       = require('fs')
const path     = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const PUBLIC_IMG   = path.join(PROJECT_ROOT, 'public', 'images')
const BASE         = 'https://www.business-analytics.gr'
const DELAY        = 200
const TIMEOUT      = 15000

// Ensure subdirectories exist
for (const sub of ['articles', 'newsletter', 'ba_images']) {
  fs.mkdirSync(path.join(PUBLIC_IMG, sub), { recursive: true })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Map a src value to { localRel, downloadUrl } or null
function resolve(src) {
  src = src.trim()
  if (!src || src.startsWith('data:')) return null

  // Already correct
  if (src.startsWith('/images/')) {
    const rel = src.replace('/images/', '')
    return { localRel: rel, localPath: '/images/' + rel, downloadUrl: BASE + '/images/stories/' + path.basename(rel) }
  }

  // Full URL from business-analytics.gr
  if (src.startsWith('http://business-analytics.gr/') || src.startsWith('https://business-analytics.gr/') ||
      src.startsWith('http://www.business-analytics.gr/') || src.startsWith('https://www.business-analytics.gr/')) {
    const urlPath = src.replace(/^https?:\/\/(?:www\.)?business-analytics\.gr\//, '')
    if (urlPath.startsWith('images/stories/')) {
      const file = urlPath.replace('images/stories/', '').replace(/\s+/g, '-')
      return { localRel: file, localPath: '/images/' + file, downloadUrl: BASE + '/' + urlPath }
    }
    if (urlPath.startsWith('newsletter/')) {
      const file = path.basename(urlPath).replace(/\s+/g, '-')
      return { localRel: 'newsletter/' + file, localPath: '/images/newsletter/' + file, downloadUrl: BASE + '/' + urlPath }
    }
    if (urlPath.startsWith('images/articles/')) {
      const file = path.basename(urlPath).replace(/\s+/g, '-')
      return { localRel: 'articles/' + file, localPath: '/images/articles/' + file, downloadUrl: BASE + '/' + urlPath }
    }
    return null
  }

  // External third-party URL — skip
  if (src.startsWith('http://') || src.startsWith('https://')) return null

  // Relative paths
  if (src.startsWith('images/articles/')) {
    const file = src.replace('images/articles/', '').replace(/\s+/g, '-')
    return { localRel: 'articles/' + file, localPath: '/images/articles/' + file, downloadUrl: BASE + '/images/articles/' + file }
  }
  if (src.startsWith('images/stories/')) {
    const file = src.replace('images/stories/', '').replace(/\s+/g, '-')
    return { localRel: file, localPath: '/images/' + file, downloadUrl: BASE + '/images/stories/' + file }
  }
  if (src.startsWith('newsletter/')) {
    const file = path.basename(src).replace(/\s+/g, '-')
    return { localRel: 'newsletter/' + file, localPath: '/images/newsletter/' + file, downloadUrl: BASE + '/' + src }
  }
  if (src.startsWith('images/')) {
    const file = src.replace('images/', '').replace(/\s+/g, '-')
    return { localRel: file, localPath: '/images/' + file, downloadUrl: BASE + '/images/' + file }
  }

  return null
}

async function download(url, dest) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return false
    const buf = await res.arrayBuffer()
    fs.writeFileSync(dest, Buffer.from(buf))
    return true
  } catch { clearTimeout(timer); return false }
}

;(async () => {
  console.log('Loading articles...')
  const raw = execSync(`sqlite3 -json "${DB_PATH}" "SELECT id, image, content FROM articles WHERE content IS NOT NULL;"`,
    { encoding: 'utf8', maxBuffer: 400*1024*1024 })
  const articles = JSON.parse(raw)
  console.log(`Loaded ${articles.length} articles`)

  // Collect all download tasks first
  const toDownload = new Map() // localRel -> downloadUrl
  const contentUpdates = []
  const imageUpdates = []

  for (const row of articles) {
    let c = row.content
    let changed = false
    let firstLocalPath = row.image || ''

    // Replace all src= values
    c = c.replace(/src="([^"]+)"/gi, (match, src) => {
      const r = resolve(src)
      if (!r) return match
      if (r.localPath !== src) changed = true
      if (!toDownload.has(r.localRel)) toDownload.set(r.localRel, r.downloadUrl)
      if (!firstLocalPath) firstLocalPath = r.localPath
      return `src="${r.localPath}"`
    })

    if (changed) contentUpdates.push({ id: row.id, content: c })
    if (firstLocalPath && firstLocalPath !== row.image) imageUpdates.push({ id: row.id, image: firstLocalPath })
  }

  console.log(`Content updates needed: ${contentUpdates.length}`)
  console.log(`Image field updates needed: ${imageUpdates.length}`)
  console.log(`Unique files to download: ${toDownload.size}`)

  // Download missing files
  let dlOk = 0, dlFail = 0
  for (const [rel, url] of toDownload) {
    const dest = path.join(PUBLIC_IMG, rel)
    if (fs.existsSync(dest)) continue
    process.stdout.write(`  ${rel}... `)
    const ok = await download(url, dest)
    if (ok) { console.log('OK'); dlOk++ } else { console.log('FAIL'); dlFail++ }
    await sleep(DELAY)
  }
  console.log(`Downloads: ${dlOk} ok, ${dlFail} failed`)

  // Write SQL
  function sqlEscape(s) { return "'" + String(s).replace(/'/g, "''") + "'" }

  const lines = ['BEGIN TRANSACTION;']
  for (const u of contentUpdates) {
    lines.push(`UPDATE articles SET content=${sqlEscape(u.content)} WHERE id=${u.id};`)
  }
  for (const u of imageUpdates) {
    lines.push(`UPDATE articles SET image=${sqlEscape(u.image)} WHERE id=${u.id};`)
  }
  lines.push('COMMIT;')

  const sqlPath = path.join(PROJECT_ROOT, 'migration-data', 'fix-all-images.sql')
  fs.writeFileSync(sqlPath, lines.join('\n'), 'utf8')
  const mb = (fs.statSync(sqlPath).size / 1024 / 1024).toFixed(1)
  console.log(`SQL written: ${mb} MB`)
})()
