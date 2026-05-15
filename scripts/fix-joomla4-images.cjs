'use strict'
/**
 * fix-joomla4-images.cjs
 * Reads the images JSON field (col 17) from bgr_content in the Joomla 4 dump,
 * extracts image_intro paths, downloads them, and updates the articles table.
 */
const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const SQL_INPUT    = path.join(PROJECT_ROOT, 'migration-data', 'ba_gr_2026-05-12_15-51-00.sql')
const PUBLIC_IMG   = path.join(PROJECT_ROOT, 'public', 'images')
const BASE         = 'https://www.business-analytics.gr'
const DELAY = 200, TIMEOUT = 15000

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseInsertLine(line) {
  const valuesStart = line.indexOf('VALUES ')
  if (valuesStart === -1) return []
  let pos = valuesStart + 7
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
        if (ch === "'") {
          if (line[pos+1] === "'") { cur += "''"; pos+=2; continue }
          inStr=false; pos++; continue
        }
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

function extractImagePath(imagesJson) {
  if (!imagesJson) return ''
  // imagesJson is the raw stored value with \/ and \" escapes
  // {"image_intro":"images\/filename.jpg", ...}
  // After our parser, \" becomes " but \/ stays as \/
  const m = imagesJson.match(/\\"?image_intro\\"?:\\"?([^",}\\]+(?:\\\/[^",}\\]+)*)\\"?/)
  if (!m) return ''
  let p = m[1].replace(/\\\//g, '/').replace(/\\/g, '').trim()
  if (!p || p === 'false' || p === 'null' || p === '0') return ''
  return p // e.g. "images/a-futuristic...jpeg"
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
  
  // Build map: alias -> { imageIntroPath }
  const slugToImage = new Map()
  
  for (const line of lines) {
    if (!line.startsWith("INSERT INTO `bgr_content`")) continue
    const records = parseInsertLine(line)
    for (const f of records) {
      if (f.length < 18) continue
      const slug = f[3]
      const imagesJson = f[17]
      const imgPath = extractImagePath(imagesJson)
      if (imgPath && slug) slugToImage.set(slug, imgPath)
    }
  }
  console.log(`Found ${slugToImage.size} articles with image_intro set`)
  
  // Get articles from DB that still have no image
  const dbRaw = execSync(`sqlite3 -json "${DB_PATH}" "SELECT id, slug FROM articles WHERE image='' OR image IS NULL;"`,
    { encoding: 'utf8', maxBuffer: 50*1024*1024 })
  const noImage = JSON.parse(dbRaw)
  console.log(`Articles in DB with no image: ${noImage.length}`)
  
  const updates = []
  let dlOk = 0, dlFail = 0
  
  for (const row of noImage) {
    const imgPath = slugToImage.get(row.slug)
    if (!imgPath) continue
    
    // imgPath is like "images/filename.jpg"
    // Download from BASE/imgPath, save to public/images/filename.jpg
    const filename = imgPath.replace(/^images\//, '')
    const localRel = filename
    const dest = path.join(PUBLIC_IMG, localRel)
    const url = `${BASE}/${imgPath}`
    const localPath = '/images/' + filename
    
    if (!fs.existsSync(dest)) {
      process.stdout.write(`  ${filename.substring(0,50)}... `)
      const ok = await download(url, dest)
      if (ok) { console.log('OK'); dlOk++ } else { console.log('FAIL'); dlFail++ }
      await sleep(DELAY)
    }
    
    if (fs.existsSync(dest)) {
      updates.push({ id: row.id, image: localPath })
    }
  }
  
  console.log(`\nDownloads: ${dlOk} ok, ${dlFail} failed`)
  console.log(`DB updates: ${updates.length}`)
  
  if (updates.length > 0) {
    const sqlEsc = s => "'" + String(s).replace(/'/g, "''") + "'"
    const lines2 = ['BEGIN TRANSACTION;']
    for (const u of updates) {
      lines2.push(`UPDATE articles SET image=${sqlEsc(u.image)} WHERE id=${u.id};`)
    }
    lines2.push('COMMIT;')
    const sqlPath = path.join(PROJECT_ROOT, 'migration-data', 'fix-joomla4-images.sql')
    fs.writeFileSync(sqlPath, lines2.join('\n'), 'utf8')
    console.log('Applying SQL...')
    execSync(`sqlite3 "${DB_PATH}" ".read migration-data/fix-joomla4-images.sql"`, { cwd: PROJECT_ROOT })
    console.log('Done.')
  }
})()
