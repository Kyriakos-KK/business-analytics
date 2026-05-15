'use strict'

/**
 * migrate2.cjs — Joomla 4.x (bgr_ prefix) → Payload CMS article migration
 * Run: node scripts/migrate2.cjs
 * Then: sqlite3 payload.db ".read migration-data/payload-articles-import2.sql"
 */

const fs   = require('fs')
const path = require('path')

const SQL_INPUT  = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const SQL_OUTPUT = path.resolve(__dirname, '../migration-data/payload-articles-import2.sql')

// bgr_content column positions (0-indexed):
// 0=id, 1=asset_id, 2=title, 3=alias, 4=introtext, 5=fulltext,
// 6=state, 7=catid, 8=created, 9=created_by, 10=created_by_alias,
// 11=modified, 12=modified_by, 13=checked_out, 14=checked_out_time,
// 15=publish_up, 16=publish_down, 17=images, 18=urls, 19=attribs,
// 20=version, 21=ordering, 22=metakey, 23=metadesc, ...

const CAT_MAP = {
  60: 'Finance',
  61: 'Industry',
  62: 'Industry',
  63: 'Industry',
  64: 'Industry',
  65: 'Industry',
  66: 'Industry',
  67: 'Industry',
  68: 'Finance',
  72: 'Other',
  74: 'Other',
  75: 'Other',
  77: 'Industry',
  79: 'Industry',
  80: 'Other',
  81: 'Other',
  83: 'Other',
  86: 'Other',
  // Legacy catids from old jos_ migration that may appear
  49: 'Industry', 50: 'Finance', 51: 'Industry', 52: 'Industry',
  53: 'Industry', 54: 'Industry', 55: 'Industry', 56: 'Other',
  57: 'Other',    58: 'Industry', 25: 'Industry', 34: 'Finance',
  43: 'Industry', 44: 'Industry', 47: 'Industry', 73: 'Other',
  69: 'Other',    71: 'Other',
}

function sqlEscape(str) {
  if (str === null || str === undefined) return 'NULL'
  return "'" + String(str).replace(/'/g, "''") + "'"
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}

function extractFirstImage(html) {
  // Match escaped or unescaped src for images/stories paths
  const m = html.match(/src=\\"(images\/stories\/[^"\\]+)\\"|src="(images\/stories\/[^"]+)"/i)
  if (!m) return ''
  const p = (m[1] || m[2]).trim()
  const filename = p.replace('images/stories/', '').replace(/\s+/g, '-')
  // Handle ba_images subfolder
  if (filename.startsWith('ba_images/')) return '/images/' + filename
  return '/images/' + filename
}

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[αάΑΆ]/g,'a').replace(/[εέΕΈ]/g,'e').replace(/[ηήΗΉ]/g,'i')
    .replace(/[ιίϊΙΊΪ]/g,'i').replace(/[οόΟΌ]/g,'o').replace(/[υύϋΥΎΫ]/g,'y')
    .replace(/[ωώΩΏ]/g,'o').replace(/[θΘ]/g,'th').replace(/[ξΞ]/g,'x')
    .replace(/[ψΨ]/g,'ps').replace(/[φΦ]/g,'f').replace(/[χΧ]/g,'ch')
    .replace(/[γΓ]/g,'g').replace(/[δΔ]/g,'d').replace(/[κΚ]/g,'k')
    .replace(/[λΛ]/g,'l').replace(/[μΜ]/g,'m').replace(/[νΝ]/g,'n')
    .replace(/[πΠ]/g,'p').replace(/[ρΡ]/g,'r').replace(/[σΣς]/g,'s')
    .replace(/[τΤ]/g,'t').replace(/[βΒ]/g,'v').replace(/[ζΖ]/g,'z')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,200)
}

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
    let inString = false
    let currentField = ''

    while (pos < line.length) {
      const ch = line[pos]
      if (inString) {
        if (ch === '\\' && pos + 1 < line.length) {
          currentField += ch + line[pos + 1]
          pos += 2; continue
        }
        if (ch === "'") {
          if (line[pos + 1] === "'") { currentField += "''"; pos += 2; continue }
          inString = false; pos++; continue
        }
        currentField += ch; pos++; continue
      }
      if (ch === "'") { inString = true; pos++; continue }
      if (ch === ',') { fields.push(currentField); currentField = ''; pos++; continue }
      if (ch === ')') { fields.push(currentField); pos++; break }
      currentField += ch; pos++
    }
    records.push(fields)
  }
  return records
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Reading SQL file...')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')
console.log('Total lines:', lines.length.toLocaleString())

const contentLines = lines.filter(l => l.startsWith('INSERT INTO `bgr_content`'))
console.log('bgr_content INSERT batches:', contentLines.length)

console.log('Parsing records...')
const allRecords = []
for (const line of contentLines) {
  allRecords.push(...parseInsertLine(line))
}
console.log('Total records parsed:', allRecords.length)

const articles = []
const slugsSeen = new Set()
let skippedUnpublished = 0, skippedBadData = 0, skippedDupSlug = 0

for (const fields of allRecords) {
  if (fields.length < 24) { skippedBadData++; continue }

  const state    = parseInt(fields[6], 10)
  const title    = fields[2]
  const alias    = fields[3]
  const intro    = fields[4]
  const full     = fields[5]
  const catid    = parseInt(fields[7], 10)
  const created  = fields[8]
  const metadesc = fields[23] || ''

  if (state !== 1) { skippedUnpublished++; continue }
  if (!title || title.trim() === '') { skippedBadData++; continue }

  let slug = (alias && alias.trim()) ? alias.trim() : titleToSlug(title)
  slug = slug.replace(/^-+|-+$/g, '').substring(0, 255)
  if (!slug) slug = 'article-' + fields[0]

  if (slugsSeen.has(slug)) slug = slug.substring(0, 240) + '-' + fields[0]
  if (slugsSeen.has(slug)) { skippedDupSlug++; continue }
  slugsSeen.add(slug)

  let content = intro
  if (full && full.trim()) content = content + '\n' + full

  const image = extractFirstImage(content)

  let description = metadesc.trim()
  if (!description) description = stripHtml(content).substring(0, 250).trim()

  const category = CAT_MAP[catid] || 'Other'

  let createdAt = new Date().toISOString()
  if (created && created !== '0000-00-00 00:00:00' && created.trim()) {
    try {
      const d = new Date(created.trim().replace(' ', 'T') + 'Z')
      if (!isNaN(d.getTime())) createdAt = d.toISOString()
    } catch {}
  }

  articles.push({ title, slug, description, content, image, category, createdAt })
}

console.log('\nResults:')
console.log('  Articles to import  :', articles.length)
console.log('  Skipped unpublished :', skippedUnpublished)
console.log('  Skipped bad data    :', skippedBadData)
console.log('  Skipped dup slug    :', skippedDupSlug)

console.log('\nGenerating SQL...')
const out = [
  '-- Payload CMS Articles Migration (Joomla 4.x bgr_ prefix)',
  '-- Generated: ' + new Date().toISOString(),
  '-- Articles: ' + articles.length,
  'BEGIN TRANSACTION;', ''
]

for (const a of articles) {
  const row = [
    sqlEscape(a.title), sqlEscape(a.slug), sqlEscape(a.description),
    sqlEscape(a.content), sqlEscape(a.image), sqlEscape(a.category),
    "'Business Analytics'", '0', sqlEscape(a.createdAt), sqlEscape(a.createdAt),
  ]
  out.push('INSERT OR IGNORE INTO articles (title,slug,description,content,image,category,author,popularity,created_at,updated_at) VALUES (' + row.join(',') + ');')
}

out.push('', 'COMMIT;', '')
fs.writeFileSync(SQL_OUTPUT, out.join('\n'), 'utf8')
const mb = (fs.statSync(SQL_OUTPUT).size / 1024 / 1024).toFixed(1)
console.log('Done:', SQL_OUTPUT, '(' + mb + ' MB)')
