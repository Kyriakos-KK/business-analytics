/**
 * migrate-joomla4.ts
 * Migrates Joomla 4.x articles (bgr_ prefix) into Payload CMS PostgreSQL.
 * Source: migration-data/ba_gr_2026-05-12_15-51-00.sql
 * Safe: uses ON CONFLICT (slug) DO NOTHING - existing articles are never touched.
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

const SQL_INPUT = path.join(__dirname, '..', 'migration-data', 'ba_gr_2026-05-12_15-51-00.sql')
const ENV_FILE  = path.join(__dirname, '..', '.env.local')

function loadEnv(file: string): Record<string, string> {
  const env: Record<string, string> = {}
  if (!fs.existsSync(file)) return env
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const CAT_MAP: Record<number, string> = {
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
  74: 'Security',
  75: 'Other',
  77: 'Industry',
  79: 'Industry',
  80: 'Other',
  81: 'Other',
  83: 'Other',
  86: 'Other',
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function extractImageFromJson(imagesJson: string): string {
  try {
    const decoded = imagesJson.replace(/\\"/g, '"').replace(/\\n/g, '')
    const obj = JSON.parse(decoded)
    const src = obj.image_intro || obj.image_fulltext || ''
    if (src) return src.startsWith('/') ? src : '/' + src
  } catch {}
  return ''
}

function extractFirstImage(html: string): string {
  const m = html.match(/src=(?:\\"|")([^"\\]+\.(jpg|jpeg|png|gif|webp))(?:\\"|")/i)
  if (!m) return ''
  const p = m[1].replace(/^\//, '')
  if (p.startsWith('images/')) return '/' + p
  return ''
}

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[αάΑΆ]/g,'a').replace(/[εέΕΈ]/g,'e').replace(/[ηήΗΉ]/g,'i')
    .replace(/[ιίϊΙΊΪ]/g,'i').replace(/[οόΟΌ]/g,'o').replace(/[υύϋΥΎΫ]/g,'y')
    .replace(/[ωώΩΏ]/g,'o').replace(/[θΘ]/g,'th').replace(/[ξΞ]/g,'x')
    .replace(/[ψΨ]/g,'ps').replace(/[φΦ]/g,'f').replace(/[χΧ]/g,'ch')
    .replace(/[γΓ]/g,'g').replace(/[δΔ]/g,'d').replace(/[κΚ]/g,'k')
    .replace(/[λΛ]/g,'l').replace(/[μΜ]/g,'m').replace(/[νΝ]/g,'n')
    .replace(/[πΠ]/g,'p').replace(/[ρΡ]/g,'r').replace(/[σΣς]/g,'s')
    .replace(/[τΤ]/g,'t').replace(/[βΒ]/g,'v').replace(/[ζΖ]/g,'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255)
}

function parseInsertRows(line: string): (string | null)[][] {
  const rows: (string | null)[][] = []
  const valStart = line.indexOf(' VALUES ')
  if (valStart === -1) return rows

  let pos = valStart + 8
  const len = line.length

  while (pos < len) {
    while (pos < len && (line[pos] === ',' || line[pos] === ' ')) pos++
    if (pos >= len || line[pos] !== '(') break
    pos++

    const fields: (string | null)[] = []
    let inQuote = false
    let buf = ''

    while (pos < len) {
      const ch = line[pos]

      if (inQuote) {
        if (ch === '\\' && pos + 1 < len) {
          const next = line[pos + 1]
          if (next === 'n') buf += '\n'
          else if (next === 'r') buf += '\r'
          else if (next === 't') buf += '\t'
          else if (next === "'") buf += "'"
          else buf += next
          pos += 2
          continue
        }
        if (ch === "'") {
          if (pos + 1 < len && line[pos + 1] === "'") { buf += "'"; pos += 2; continue }
          inQuote = false; pos++; continue
        }
        buf += ch; pos++; continue
      }

      if (ch === "'") { inQuote = true; pos++; continue }
      if (ch === ',') { fields.push(buf === 'NULL' ? null : buf); buf = ''; pos++; continue }
      if (ch === ')') { fields.push(buf === 'NULL' ? null : buf); pos++; break }
      buf += ch; pos++
    }

    rows.push(fields)
  }

  return rows
}

async function main() {
  const env = loadEnv(ENV_FILE)
  const dbUri = env['DATABASE_URI'] || process.env.DATABASE_URI
  if (!dbUri) throw new Error('DATABASE_URI not found')

  const sql = postgres(dbUri, { ssl: 'require', max: 3 })

  console.log('Reading Joomla 4 SQL dump...')
  const raw = fs.readFileSync(SQL_INPUT, 'utf-8')
  const lines = raw.split('\n')
  console.log('Total lines:', lines.length)

  // Collect ALL INSERT batches (MariaDB splits large tables across multiple INSERT statements)
  const contentLines = lines.filter(l => l.startsWith('INSERT INTO `bgr_content`'))
  if (contentLines.length === 0) throw new Error('Could not find INSERT INTO `bgr_content`')
  console.log('Found ' + contentLines.length + ' INSERT batches for bgr_content')

  console.log('Parsing all batches...')
  const allRows: (string | null)[][] = []
  for (const cl of contentLines) {
    const batch = parseInsertRows(cl)
    allRows.push(...batch)
  }
  console.log('Total rows parsed: ' + allRows.length)

  // Fetch existing slugs
  console.log('Fetching existing slugs from PostgreSQL...')
  const existingRows = await sql`SELECT slug FROM articles`
  const existingSlugs = new Set(existingRows.map((r: { slug: string }) => r.slug))
  console.log('Existing slugs in DB: ' + existingSlugs.size)

  const articles: {
    title: string; slug: string; description: string
    content: string; image: string; category: string
    author: string; popularity: number; created_at: string
  }[] = []

  const seenSlugs = new Set<string>(existingSlugs)
  let skippedUnpublished = 0, skippedBadData = 0, skippedDupSlug = 0

  // bgr_content columns (0-indexed):
  // 0=id, 1=asset_id, 2=title, 3=alias, 4=introtext, 5=fulltext,
  // 6=state, 7=catid, 8=created, 9=created_by, 10=created_by_alias,
  // 11=modified, 12=modified_by, 13=checked_out, 14=checked_out_time,
  // 15=publish_up, 16=publish_down, 17=images, 18=urls, 19=attribs,
  // 20=version, 21=ordering, 22=metakey, 23=metadesc, 24=access, 25=hits

  for (const row of allRows) {
    if (row.length < 24) { skippedBadData++; continue }

    const state    = parseInt(row[6] ?? '0')
    const title    = row[2]?.trim() ?? ''
    const alias    = row[3]?.trim() ?? ''
    const intro    = row[4] ?? ''
    const full     = row[5] ?? ''
    const catid    = parseInt(row[7] ?? '0')
    const created  = row[8] ?? ''
    const imagesJson = row[17] ?? ''
    const metadesc = row[23] ?? ''
    const hits     = parseInt(row[25] ?? '0')

    if (state !== 1) { skippedUnpublished++; continue }
    if (!title) { skippedBadData++; continue }

    let slug = alias || sanitizeSlug(title)
    slug = slug.replace(/^-+|-+$/g, '').substring(0, 255)
    if (!slug) slug = 'article-' + (row[0] ?? Date.now())

    if (seenSlugs.has(slug)) {
      const altSlug = slug.substring(0, 240) + '-' + (row[0] ?? '')
      if (seenSlugs.has(altSlug)) { skippedDupSlug++; continue }
      slug = altSlug
    }
    seenSlugs.add(slug)

    const rawContent = intro + (full && full.trim() ? '\n' + full : '')
    let image = extractImageFromJson(imagesJson)
    if (!image) image = extractFirstImage(rawContent)

    let description = metadesc.trim()
    if (!description) description = stripHtml(rawContent).substring(0, 250).trim()

    const category = CAT_MAP[catid] ?? 'Other'
    const popularity = Math.min(Math.round(hits / 10), 100)

    let createdAt = new Date().toISOString()
    const dateStr = (created && created !== '0000-00-00 00:00:00') ? created.trim() : ''
    if (dateStr) {
      try {
        const d = new Date(dateStr.replace(' ', 'T') + 'Z')
        if (!isNaN(d.getTime())) createdAt = d.toISOString()
      } catch {}
    }

    articles.push({ title, slug, description, content: rawContent, image, category, author: 'Business Analytics', popularity, created_at: createdAt })
  }

  console.log('\nParsing results:')
  console.log('  To import:           ' + articles.length)
  console.log('  Skipped unpublished: ' + skippedUnpublished)
  console.log('  Skipped bad data:    ' + skippedBadData)
  console.log('  Skipped dup slug:    ' + skippedDupSlug)

  if (articles.length === 0) {
    console.log('Nothing to import.')
    await sql.end()
    return
  }

  const yearMap: Record<string, number> = {}
  for (const a of articles) {
    const y = a.created_at.substring(0, 4)
    yearMap[y] = (yearMap[y] ?? 0) + 1
  }
  console.log('\nYear distribution of new articles:')
  Object.keys(yearMap).sort().forEach(y => console.log('  ' + y + ': ' + yearMap[y]))

  console.log('\nInserting ' + articles.length + ' articles into PostgreSQL...')
  let inserted = 0, skippedConflict = 0, failed = 0
  const BATCH = 50

  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH)
    for (const a of batch) {
      try {
        const result = await sql`
          INSERT INTO articles (title, slug, description, content, image, category, author, popularity, created_at, updated_at)
          VALUES (
            ${a.title}, ${a.slug}, ${a.description}, ${a.content},
            ${a.image}, ${a.category}, ${a.author}, ${a.popularity},
            ${a.created_at}, ${a.created_at}
          )
          ON CONFLICT (slug) DO NOTHING
          RETURNING id
        `
        if (result.length > 0) inserted++
        else skippedConflict++
      } catch (e: unknown) {
        failed++
        if (failed <= 5) console.error('\n  Insert failed [' + a.slug + ']: ' + (e as Error).message)
      }
    }
    const pct = Math.round(((i + batch.length) / articles.length) * 100)
    process.stdout.write('\r  Progress: ' + (i + batch.length) + '/' + articles.length + ' (' + pct + '%)   ')
  }

  console.log('\n\nDone!')
  console.log('  Inserted:         ' + inserted)
  console.log('  Skipped conflict: ' + skippedConflict)
  console.log('  Failed:           ' + failed)

  const [countRow] = await sql`SELECT COUNT(*) as total FROM articles`
  const [rangeRow] = await sql`SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM articles`
  console.log('\nFinal PostgreSQL state:')
  console.log('  Total articles: ' + countRow.total)
  console.log('  Oldest: ' + rangeRow.oldest)
  console.log('  Newest: ' + rangeRow.newest)

  const yearFinal = await sql`
    SELECT EXTRACT(YEAR FROM created_at)::int as year, COUNT(*) as cnt
    FROM articles GROUP BY year ORDER BY year
  `
  console.log('\nYear distribution after migration:')
  yearFinal.forEach((r: { year: number; cnt: string }) => console.log('  ' + r.year + ': ' + r.cnt))

  await sql.end()
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })