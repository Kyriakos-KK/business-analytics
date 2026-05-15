/**
 * migrate.cjs — Joomla → Payload CMS article migration
 *
 * Reads the old MySQL SQL dump, extracts published articles from jos_content,
 * maps Joomla categories to Payload categories, and writes a ready-to-run
 * SQLite INSERT file at migration-data/payload-articles-import.sql
 *
 * Run with:
 *   node scripts/migrate.cjs
 *
 * Then apply:
 *   sqlite3 payload.db < migration-data/payload-articles-import.sql
 *
 * CommonJS (no ESM/Payload imports) — works on Node.js 24 without tsx issues.
 */

'use strict'

const fs   = require('fs')
const path = require('path')

// ── Paths ────────────────────────────────────────────────────────────────────
const SQL_INPUT  = path.resolve(__dirname, '../migration-data/banalytics_2026-05-11_12-46-53.sql')
const SQL_OUTPUT = path.resolve(__dirname, '../migration-data/payload-articles-import.sql')

// ── Category mapping: Joomla catid → Payload category value ─────────────────
// Section 1 "Ειδήσεις" (News)
const CAT_MAP = {
  49: 'Industry',    // Marketing
  50: 'Finance',     // Finance
  51: 'Industry',    // Human Resources Management
  52: 'Industry',    // Supply Chain Management
  53: 'Industry',    // Production and Operations
  54: 'Industry',    // Internet
  55: 'Industry',    // Internet (section 4 variant)
  56: 'Other',       // Γενικές ειδήσεις (General News)
  57: 'Other',       // Δελτία τύπου (Press Releases)
  58: 'Industry',    // Social Media
  // Section 4 "Οφέλη BA"
  25: 'Industry',    // Marketing
  34: 'Finance',     // Finance
  43: 'Industry',    // Human Resources
  44: 'Industry',    // Supply Chain
  47: 'Industry',    // Production and Operations
  73: 'Other',       // Όλα
  // Section 7 "Case Studies"
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
  74: 'Other',       // Privacy
  // Section 8 "Interviews"
  69: 'Other',
  // Section 10 "Έρευνες"
  71: 'Other',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Escape a string value for SQLite single-quoted literals */
function sqlEscape(str) {
  if (str === null || str === undefined) return "NULL"
  return "'" + String(str).replace(/'/g, "''") + "'"
}

/** Strip HTML tags and return plain text */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract first image src from HTML content */
function extractFirstImage(html) {
  const m = html.match(/src=\\"(images\/stories\/[^"\\]+)\\"|src="(images\/stories\/[^"]+)"/i)
  if (!m) return null
  const imgPath = (m[1] || m[2]).trim()
  // Convert to public-folder path
  return '/images/' + imgPath.replace('images/stories/', '').replace(/\s+/g, '-')
}

/** Generate a slug from title as fallback */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[αάΑΆ]/g, 'a').replace(/[εέΕΈ]/g, 'e').replace(/[ηήΗΉ]/g, 'i')
    .replace(/[ιίϊΙΊΪ]/g, 'i').replace(/[οόΟΌ]/g, 'o').replace(/[υύϋΥΎΫ]/g, 'y')
    .replace(/[ωώΩΏ]/g, 'o').replace(/[θΘ]/g, 'th').replace(/[ξΞ]/g, 'x')
    .replace(/[ψΨ]/g, 'ps').replace(/[φΦ]/g, 'f').replace(/[χΧ]/g, 'ch')
    .replace(/[γΓ]/g, 'g').replace(/[δΔ]/g, 'd').replace(/[κΚ]/g, 'k')
    .replace(/[λΛ]/g, 'l').replace(/[μΜ]/g, 'm').replace(/[νΝ]/g, 'n')
    .replace(/[πΠ]/g, 'p').replace(/[ρΡ]/g, 'r').replace(/[σΣς]/g, 's')
    .replace(/[τΤ]/g, 't').replace(/[βΒ]/g, 'v').replace(/[ζΖ]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200)
}

/**
 * Parse MySQL VALUES from a Joomla INSERT INTO jos_content line.
 *
 * Joomla dumps each batch as a single very long line:
 *   INSERT INTO `jos_content` VALUES (...),(...),...
 *
 * The fields we need (0-indexed):
 *   0  id
 *   1  title
 *   2  alias
 *   3  title_alias
 *   4  introtext
 *   5  fulltext
 *   6  state
 *   7  sectionid
 *   8  mask
 *   9  catid
 *  10  created
 *  26  metakey
 *  27  metadesc
 *
 * We walk character-by-character to correctly handle:
 *   - Single-quoted strings with \' and '' escapes
 *   - Nested parentheses inside strings
 *   - NULL values
 *   - Numeric values
 */
function parseInsertLine(line) {
  // Strip the INSERT INTO ... VALUES prefix
  const valuesStart = line.indexOf('VALUES ')
  if (valuesStart === -1) return []
  let pos = valuesStart + 7  // skip "VALUES "

  const records = []

  while (pos < line.length) {
    // Expect '(' to start a record
    while (pos < line.length && (line[pos] === ' ' || line[pos] === ',')) pos++
    if (pos >= line.length) break
    if (line[pos] !== '(') { pos++; continue }
    pos++ // skip '('

    const fields = []
    let inString = false
    let currentField = ''

    while (pos < line.length) {
      const ch = line[pos]

      if (inString) {
        if (ch === '\\' && pos + 1 < line.length) {
          // Escaped character — keep both chars in the raw field value
          currentField += ch + line[pos + 1]
          pos += 2
          continue
        }
        if (ch === "'") {
          // Check for '' (escaped single quote in SQL)
          if (line[pos + 1] === "'") {
            currentField += "''"
            pos += 2
            continue
          }
          // End of string
          inString = false
          pos++
          continue
        }
        currentField += ch
        pos++
        continue
      }

      // Not in string
      if (ch === "'") {
        inString = true
        pos++
        continue
      }
      if (ch === ',' ) {
        fields.push(currentField)
        currentField = ''
        pos++
        continue
      }
      if (ch === ')') {
        fields.push(currentField)
        pos++ // skip ')'
        break
      }
      currentField += ch
      pos++
    }

    records.push(fields)
  }

  return records
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Reading SQL file...')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

console.log(`Total lines: ${lines.length.toLocaleString()}`)

// Find all jos_content INSERT lines
const contentLines = []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('INSERT INTO `jos_content`')) {
    contentLines.push(lines[i])
  }
}
console.log(`Found ${contentLines.length} INSERT batches for jos_content`)

// Parse all records
console.log('Parsing article records...')
const allRecords = []
for (const line of contentLines) {
  const records = parseInsertLine(line)
  allRecords.push(...records)
}
console.log(`Parsed ${allRecords.length} total records`)

// ── Transform & filter ───────────────────────────────────────────────────────
console.log('Transforming records...')

const articles = []
const slugsSeen = new Set()
let skippedUnpublished = 0
let skippedBadData = 0
let skippedDupSlug = 0

for (const fields of allRecords) {
  // Field positions (0-indexed):
  // 0=id, 1=title, 2=alias, 3=title_alias, 4=introtext, 5=fulltext,
  // 6=state, 7=sectionid, 8=mask, 9=catid, 10=created,
  // 11=created_by, 12=created_by_alias, 13=modified, 14=modified_by,
  // 15=checked_out, 16=checked_out_time, 17=publish_up, 18=publish_down,
  // 19=images, 20=urls, 21=attribs, 22=version, 23=parentid, 24=ordering,
  // 25=metakey, 26=metadesc, 27=access, 28=hits, 29=metadata

  if (fields.length < 20) {
    skippedBadData++
    continue
  }

  const state     = parseInt(fields[6], 10)
  const title     = fields[1]
  const alias     = fields[2]
  const introtext = fields[4]
  const fulltext  = fields[5]
  const catid     = parseInt(fields[9], 10)
  const created   = fields[10]
  const metadesc  = fields.length > 26 ? fields[26] : ''

  // Only import published articles
  if (state !== 1) {
    skippedUnpublished++
    continue
  }

  // Skip records with no usable title
  if (!title || title.trim() === '') {
    skippedBadData++
    continue
  }

  // Build slug: prefer alias, fallback to title-derived slug
  let slug = (alias && alias.trim() !== '') ? alias.trim() : titleToSlug(title)
  // Enforce max 255 chars and remove leading/trailing dashes
  slug = slug.replace(/^-+|-+$/g, '').substring(0, 255)
  if (!slug) slug = `article-${fields[0]}`

  // Deduplicate slugs in this migration run
  if (slugsSeen.has(slug)) {
    slug = slug.substring(0, 240) + '-' + fields[0]
  }
  if (slugsSeen.has(slug)) {
    skippedDupSlug++
    continue
  }
  slugsSeen.add(slug)

  // Combine intro + full text
  let content = introtext
  if (fulltext && fulltext.trim() !== '') {
    content = content + '\n' + fulltext
  }

  // Extract image from content
  const image = extractFirstImage(content) || ''

  // Description: prefer metadesc, fallback to first 250 chars of plain text
  let description = metadesc && metadesc.trim() !== '' ? metadesc.trim() : ''
  if (!description) {
    description = stripHtml(content).substring(0, 250).trim()
  }

  // Category mapping
  const category = CAT_MAP[catid] || 'Other'

  // Parse created date — Joomla uses '2014-03-15 10:22:00'
  // Convert to ISO 8601 for SQLite
  let createdAt = ''
  if (created && created !== '0000-00-00 00:00:00' && created.trim() !== '') {
    try {
      const d = new Date(created.trim().replace(' ', 'T') + 'Z')
      createdAt = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    } catch {
      createdAt = new Date().toISOString()
    }
  } else {
    createdAt = new Date().toISOString()
  }

  articles.push({ title, slug, description, content, image, category, createdAt })
}

console.log(`\nResults:`)
console.log(`  Articles to import : ${articles.length}`)
console.log(`  Skipped (unpublished): ${skippedUnpublished}`)
console.log(`  Skipped (bad data)   : ${skippedBadData}`)
console.log(`  Skipped (dup slug)   : ${skippedDupSlug}`)

// ── Generate SQL output ──────────────────────────────────────────────────────
console.log(`\nGenerating SQL output → ${SQL_OUTPUT}`)

const lines_out = [
  '-- Payload CMS Articles Migration',
  `-- Generated: ${new Date().toISOString()}`,
  `-- Source: banalytics_2026-05-11_12-46-53.sql (Joomla 1.5)`,
  `-- Articles: ${articles.length}`,
  '--',
  '-- Apply with:',
  '--   sqlite3 payload.db < migration-data/payload-articles-import.sql',
  '--',
  'BEGIN TRANSACTION;',
  '',
]

for (const a of articles) {
  const row = [
    sqlEscape(a.title),
    sqlEscape(a.slug),
    sqlEscape(a.description),
    sqlEscape(a.content),
    sqlEscape(a.image),
    sqlEscape(a.category),
    "'Business Analytics'",
    '0',            // popularity
    sqlEscape(a.createdAt),
    sqlEscape(a.createdAt),
  ]
  lines_out.push(
    `INSERT OR IGNORE INTO articles (title, slug, description, content, image, category, author, popularity, created_at, updated_at) VALUES (${row.join(', ')});`
  )
}

lines_out.push('')
lines_out.push('COMMIT;')
lines_out.push('')
lines_out.push(`-- Verify: SELECT COUNT(*) FROM articles;`)

fs.writeFileSync(SQL_OUTPUT, lines_out.join('\n'), 'utf8')

const outputSize = (fs.statSync(SQL_OUTPUT).size / 1024 / 1024).toFixed(1)
console.log(`Done. Output: ${SQL_OUTPUT} (${outputSize} MB)`)
console.log(`\nNext step — review the output file, then run:`)
console.log(`  sqlite3 payload.db < migration-data/payload-articles-import.sql`)
