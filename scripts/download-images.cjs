/**
 * scripts/download-images.cjs — rewritten with native fetch (Node 18+)
 * Downloads all article images from business-analytics.gr
 * Run: node scripts/download-images.cjs
 */

'use strict'

const fs      = require('fs')
const path    = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const PUBLIC_DIR   = path.join(PROJECT_ROOT, 'public', 'images')
const BASE_URL     = 'https://www.business-analytics.gr/images/stories'
const DELAY_MS     = 150
const TIMEOUT_MS   = 20000

function getImagePaths() {
  const raw = execSync(
    `sqlite3 "${DB_PATH}" "SELECT DISTINCT image FROM articles WHERE image != '' ORDER BY image;"`,
    { encoding: 'utf8' }
  )
  return raw.trim().split('\n').filter(Boolean).map(p => p.trim())
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function downloadOne(filename, destPath) {
  // The old server kept original filenames with spaces; our DB has dashes.
  // Try the dash version first, then the space version as fallback.
  const urls = [
    `${BASE_URL}/${encodeURIComponent(filename)}`,
    `${BASE_URL}/${filename}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('text/html')) continue  // got an error page

      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length < 200) continue  // too small, probably an error page

      fs.writeFileSync(destPath, buffer)
      return { ok: true, size: buffer.length, url }
    } catch {
      // timeout or network error — try next URL variant
    }
  }

  return { ok: false }
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  console.log(`Saving images to: ${PUBLIC_DIR}\n`)

  const paths = getImagePaths()
  console.log(`Found ${paths.length} distinct image paths in DB\n`)

  let downloaded = 0
  let skipped    = 0
  let failed     = 0
  const failures = []

  for (let i = 0; i < paths.length; i++) {
    const dbPath   = paths[i]
    const filename = path.basename(dbPath)
    const destPath = path.join(PUBLIC_DIR, filename)

    const pct = String(Math.round(((i + 1) / paths.length) * 100)).padStart(3)
    const idx = String(i + 1).padStart(4)
    const label = filename.substring(0, 48).padEnd(48)

    // Skip if already downloaded
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 200) {
      skipped++
      process.stdout.write(`\r[${pct}%] ${idx}/${paths.length}  SKIP  ${label}`)
      continue
    }

    const result = await downloadOne(filename, destPath)

    if (result.ok) {
      downloaded++
      const kb = (result.size / 1024).toFixed(1).padStart(7)
      process.stdout.write(`\r[${pct}%] ${idx}/${paths.length}  OK    ${label} ${kb} KB`)
    } else {
      failed++
      failures.push(filename)
      process.stdout.write(`\r[${pct}%] ${idx}/${paths.length}  FAIL  ${label}`)
    }

    await sleep(DELAY_MS)
  }

  console.log('\n')
  console.log('══════════════════════════════════════════')
  console.log(`  Downloaded : ${downloaded}`)
  console.log(`  Skipped    : ${skipped}  (already existed)`)
  console.log(`  Failed     : ${failed}`)
  console.log('══════════════════════════════════════════')

  if (failures.length > 0) {
    const logPath = path.join(PROJECT_ROOT, 'migration-data', 'image-failures.txt')
    fs.writeFileSync(logPath, failures.join('\n') + '\n', 'utf8')
    console.log(`\nFailed filenames → migration-data/image-failures.txt`)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('\nFatal:', err.message)
  process.exit(1)
})