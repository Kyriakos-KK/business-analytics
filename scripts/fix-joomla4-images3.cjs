'use strict'
const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const SQL_INPUT    = path.join(PROJECT_ROOT, 'migration-data', 'ba_gr_2026-05-12_15-51-00.sql')
const PUBLIC_IMG   = path.join(PROJECT_ROOT, 'public', 'images')
const BASE         = 'https://www.business-analytics.gr'
const DELAY = 200, TIMEOUT = 20000

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function extractImagePath(raw) {
  if (!raw) return ''
  // raw contains MySQL-escaped chars: \\ means one backslash, \" means quote, \/ means slash
  // Our parser kept these as-is (2-char sequences)
  // Unescape step by step using placeholder to avoid double-processing
  let s = raw
  s = s.split('\\\\').join('\x00')   // \\ -> placeholder (split/join avoids regex confusion)
  s = s.split('\\"').join('"')        // \" -> "
  s = s.split('\\/').join('/')        // \/ -> /
  s = s.split('\x00/').join('/')      // placeholder+/ -> / (was \\/ = actual /)
  s = s.split('\x00').join('\\')      // remaining placeholder -> backslash

  // Now s should be valid JSON-like: {"image_intro":"images/filename.jpg",...}
  const m = s.match(/"image_intro"\s*:\s*"([^"]+)"/)
  if (!m) return ''
  const p = m[1].trim()
  if (!p || p === 'false' || p === '0' || p === 'null') return ''
  return p  // e.g. "images/filename.jpg" or "images/stories/foo.jpg" or "images/articles/foo.jpg"
}

function parseInsertLine(line) {
  const vs = line.indexOf('VALUES ')
  if (vs === -1) return []
  let pos = vs + 7
  const records = []
  while (pos < line.length) {
    while (pos < line.length && (line[pos] === ' ' || line[pos] === ',')) pos++
    if (pos >= line.length) break
    if (line[pos] !== '(') { pos++; continue }
    pos++
    const fields = []
    let inStr = false, cur = ''
    while (pos < line.length) {
      const ch = line[pos]
      if (inStr) {
        if (ch === '\\' && pos+1 < line.length) { cur += ch + line[pos+1]; pos+=2; continue }
        if (ch === "'") { if (line[pos+1] === "'") { cur += "''"; pos+=2; continue } inStr=false; pos++; continue }
        cur += ch; pos++
      } else {
        if (ch === "'") { inStr=true; pos++; continue }
        if (ch === ',') { fields.push(cur); cur=''; pos++; continue }
        if (ch === ')') { fields.push(cur); pos++; break }
        cur += ch; pos++
      }
    }
    records.push(fields)
  }
  return records
}

async function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
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
  console.log('Parsing SQL dump...')
  const raw = fs.readFileSync(SQL_INPUT, 'utf8')
  const lines = raw.split('\n')

  const slugToImg = new Map()
  for (const line of lines) {
    if (!line.startsWith("INSERT INTO `bgr_content`")) continue
    for (const f of parseInsertLine(line)) {
      if (f.length < 18) continue
      const slug = f[3], imgField = f[17]
      const p = extractImagePath(imgField)
      if (p && slug) slugToImg.set(slug, p)
    }
  }

  // Verify a few samples
  let n = 0
  for (const [slug, p] of slugToImg) {
    console.log(`  ${slug} -> ${p}`)
    if (++n >= 5) break
  }

  const dbRaw = execSync(
    `sqlite3 -json "${DB_PATH}" "SELECT id, slug FROM articles WHERE image='' OR image IS NULL OR image='/images/images';"`,
    { encoding: 'utf8', maxBuffer: 50*1024*1024 })
  const noImg = JSON.parse(dbRaw)
  console.log(`\nArticles needing images: ${noImg.length}`)

  const updates = []
  let dlOk = 0, dlFail = 0, noData = 0

  for (const row of noImg) {
    const imgPath = slugToImg.get(row.slug)
    if (!imgPath) { noData++; continue }

    // Determine local filename and download URL
    let subdir = '', filename = path.basename(imgPath)
    let downloadUrl

    if (imgPath.startsWith('images/stories/')) {
      downloadUrl = `${BASE}/${imgPath}`
    } else if (imgPath.startsWith('images/articles/')) {
      subdir = 'articles/'
      downloadUrl = `${BASE}/${imgPath}`
    } else if (imgPath.startsWith('images/')) {
      downloadUrl = `${BASE}/${imgPath}`
    } else {
      downloadUrl = `${BASE}/images/${filename}`
    }

    filename = filename.replace(/\s+/g, '-')
    const localRel = subdir + filename
    const dest = path.join(PUBLIC_IMG, localRel)
    const localPath = '/images/' + localRel

    if (!fs.existsSync(dest)) {
      process.stdout.write(`  ${localRel.substring(0,60)}... `)
      const ok = await download(downloadUrl, dest)
      if (ok) { console.log('OK'); dlOk++ } else { console.log('FAIL ' + downloadUrl); dlFail++ }
      await sleep(DELAY)
    }

    updates.push({ id: row.id, image: localPath })
  }

  console.log(`\nDone: ${dlOk} downloaded, ${dlFail} failed, ${noData} articles have no image in dump`)
  console.log(`DB updates: ${updates.length}`)

  if (updates.length > 0) {
    const esc = s => "'" + String(s).replace(/'/g, "''") + "'"
    const sql = ['BEGIN TRANSACTION;', ...updates.map(u => `UPDATE articles SET image=${esc(u.image)} WHERE id=${u.id};`), 'COMMIT;']
    const sqlPath = path.join(PROJECT_ROOT, 'migration-data', 'fix-joomla4-images3.sql')
    fs.writeFileSync(sqlPath, sql.join('\n'), 'utf8')
    console.log('SQL file written: migration-data/fix-joomla4-images3.sql')
  }
})()
