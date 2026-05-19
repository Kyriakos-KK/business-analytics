/**
 * scripts/migrate-joomla.ts
 * Migrates published Joomla 1.5 articles into Payload CMS PostgreSQL.
 * Run: npx tsx scripts/migrate-joomla.ts
 * Safe to re-run: ON CONFLICT (slug) DO NOTHING
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadEnv(): void {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

type PayloadCategory =
  | 'AI & Law' | 'Industry' | 'Models' | 'Security' | 'Agents'
  | 'Finance' | 'Cybersecurity' | 'Health & AI' | 'Defense' | 'Other'

function parseInsertRows(sql: string, tableName: string): (string | null)[][] {
  const results: (string | null)[][] = []
  const marker = 'INSERT INTO `' + tableName + '` VALUES '
  let searchFrom = 0
  while (true) {
    const start = sql.indexOf(marker, searchFrom)
    if (start < 0) break
    searchFrom = start + marker.length
    let pos = start + marker.length
    while (pos < sql.length) {
      while (pos < sql.length && (sql[pos] === ',' || sql[pos] === ' ' || sql[pos] === '\r' || sql[pos] === '\n')) pos++
      if (pos >= sql.length || sql[pos] === ';') break
      if (sql[pos] !== '(') break
      pos++
      const row: (string | null)[] = []
      while (pos < sql.length) {
        while (pos < sql.length && (sql[pos] === ' ' || sql[pos] === '\t')) pos++
        if (sql[pos] === ')') { pos++; break }
        if (sql[pos] === ',') { pos++; continue }
        if (sql[pos] === "'") {
          let str = ''
          pos++
          while (pos < sql.length) {
            const ch = sql[pos]
            if (ch === '\\') {
              pos++
              const esc = sql[pos] ?? ''
              if (esc === 'n') str += '\n'
              else if (esc === 'r') str += '\r'
              else if (esc === 't') str += '\t'
              else if (esc === "'") str += "'"
              else if (esc === '"') str += '"'
              else if (esc === '\\') str += '\\'
              else str += esc
              pos++
            } else if (ch === "'") {
              if (sql[pos + 1] === "'") { str += "'"; pos += 2 }
              else { pos++; break }
            } else { str += ch; pos++ }
          }
          row.push(str)
        } else if (sql.slice(pos, pos + 4) === 'NULL') {
          row.push(null); pos += 4
        } else {
          let num = ''
          while (pos < sql.length && sql[pos] !== ',' && sql[pos] !== ')') num += sql[pos++]
          row.push(num.trim())
        }
      }
      if (row.length > 0) results.push(row)
    }
  }
  return results
}

function cleanHtml(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<a[^>]*>\s*(Περισσότερα|Read more|Διαβάστε περισσότερα)\.{0,3}\s*<\/a>/gi, '')
    .replace(/href="index\.php\?option=com_content[^"]*"/gi, 'href="#"')
    .replace(/<p[^>]*>\s*(&nbsp;)?\s*<\/p>/gi, '')
    .replace(/\r\n/g, '\n').trim()
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim()
}

function sanitizeSlug(raw: string): string {
  return (raw || '').toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 200)
}

function mapCategory(sectionTitle: string, catTitle: string): PayloadCategory {
  const c = (sectionTitle + ' ' + catTitle).toLowerCase()
  if (/financ|χρηματ|investment|fund|capital|portfolio/.test(c)) return 'Finance'
  if (/security|ασφάλ|cybersec/.test(c)) return 'Cybersecurity'
  if (/health|υγε|medic|pharmac|βιολ/.test(c)) return 'Health & AI'
  if (/defense|αμυν|military|στρατ/.test(c)) return 'Defense'
  if (/\bai\b|artificial|machine learn|deep learn|neural/.test(c)) return 'AI & Law'
  if (/law|legal|νομ|gdpr|privacy/.test(c)) return 'AI & Law'
  return 'Industry'
}

async function main() {
  loadEnv()

  const DB_URI = process.env.DATABASE_URI
  if (!DB_URI || !DB_URI.startsWith('postgresql')) {
    console.error('ERROR: DATABASE_URI must be a postgresql:// string.')
    process.exit(1)
  }

  const SQL_FILE = path.join(ROOT, 'migration-data', 'joomla-extract', 'banalytics_2026-05-11_12-46-53.sql')
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`ERROR: SQL file not found at ${SQL_FILE}`)
    process.exit(1)
  }

  console.log('Reading SQL dump...')
  const rawSql = fs.readFileSync(SQL_FILE, 'utf8')
  console.log(`Loaded: ${(rawSql.length / 1024 / 1024).toFixed(1)} MB\n`)

  console.log('Parsing jos_sections...')
  const sectionMap: Record<string, string> = {}
  for (const row of parseInsertRows(rawSql, 'jos_sections')) sectionMap[row[0] ?? ''] = row[1] ?? ''
  console.log(`  ${Object.keys(sectionMap).length} sections`)
  for (const [id, title] of Object.entries(sectionMap)) console.log(`  [${id}] ${title}`)

  console.log('\nParsing jos_categories...')
  const catMap: Record<string, { title: string; sectionId: string }> = {}
  for (const row of parseInsertRows(rawSql, 'jos_categories')) catMap[row[0] ?? ''] = { title: row[2] ?? '', sectionId: row[6] ?? '' }
  console.log(`  ${Object.keys(catMap).length} categories`)

  console.log('\nParsing jos_users...')
  const userMap: Record<string, string> = {}
  for (const row of parseInsertRows(rawSql, 'jos_users')) userMap[row[0] ?? ''] = row[1] ?? ''
  console.log(`  ${Object.keys(userMap).length} users`)

  console.log('\nParsing jos_content...')
  const contentRows = parseInsertRows(rawSql, 'jos_content')
  console.log(`  Total rows: ${contentRows.length}`)

  interface MappedArticle {
    title: string; slug: string; description: string; content: string
    image: string; category: PayloadCategory; author: string
    popularity: number; createdAt: string
  }

  const toInsert: MappedArticle[] = []
  let cntUnpublished = 0, cntNoTitle = 0, cntNoSlug = 0

  for (const row of contentRows) {
    const state = parseInt(row[6] ?? '0', 10)
    if (state !== 1) { cntUnpublished++; continue }
    const title = (row[1] ?? '').trim()
    if (!title) { cntNoTitle++; continue }
    const slug = sanitizeSlug(row[2] ?? '') || sanitizeSlug(title)
    if (!slug) { cntNoSlug++; continue }

    const introtext = row[4] ?? ''
    const fulltext  = row[5] ?? ''
    const sectionid = row[7] ?? ''
    const catid     = row[9] ?? ''
    const created   = row[10] ?? ''
    const createdBy = row[11] ?? ''
    const createdByAlias = (row[12] ?? '').trim()
    const publishUp = row[17] ?? ''
    const metadesc  = (row[26] ?? '').trim()
    const hits      = parseInt(row[28] ?? '0', 10)

    const content = cleanHtml(introtext + (fulltext ? '\n' + fulltext : ''))
    let description = metadesc || (introtext ? htmlToPlainText(introtext).slice(0, 400) : '')

    const cat      = catMap[catid] ?? { title: '', sectionId: sectionid }
    const section  = sectionMap[cat.sectionId || sectionid] ?? ''
    const category = mapCategory(section, cat.title)
    const author   = (createdByAlias || userMap[createdBy] || 'Business Analytics').slice(0, 255)
    const popularity = Math.min(100, Math.round((hits / 5000) * 100))

    let raw = (publishUp && publishUp !== '0000-00-00 00:00:00') ? publishUp : created
    let createdAt: string
    try { createdAt = (!raw || raw === '0000-00-00 00:00:00') ? new Date().toISOString() : new Date(raw.replace(' ', 'T') + 'Z').toISOString() }
    catch { createdAt = new Date().toISOString() }

    toInsert.push({ title, slug, description: description.slice(0, 1000), content, image: '', category, author, popularity, createdAt })
  }

  console.log(`\n  To migrate (published):   ${toInsert.length}`)
  console.log(`  Skipped (unpublished):    ${cntUnpublished}`)
  console.log(`  Skipped (no title):       ${cntNoTitle}`)
  console.log(`  Skipped (no slug):        ${cntNoSlug}`)

  if (toInsert.length === 0) { console.log('\nNothing to migrate.'); process.exit(0) }

  const catDist: Record<string, number> = {}
  for (const a of toInsert) catDist[a.category] = (catDist[a.category] ?? 0) + 1
  console.log('\nCategory distribution:')
  for (const [cat, count] of Object.entries(catDist)) console.log(`  ${cat}: ${count}`)

  console.log('\nConnecting to PostgreSQL...')
  const sql = postgres(DB_URI)

  const tableCheck = await sql`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'articles'`
  if (Number(tableCheck[0].count) === 0) {
    console.error('ERROR: articles table not found. Run npm run dev once to create schema.')
    await sql.end(); process.exit(1)
  }

  console.log(`\nInserting ${toInsert.length} articles...\n`)
  let inserted = 0, skippedDup = 0, failed = 0

  for (const article of toInsert) {
    try {
      const result = await sql`
        INSERT INTO articles (title, slug, description, content, image, category, author, popularity, created_at, updated_at)
        VALUES (
          ${article.title}, ${article.slug}, ${article.description || null},
          ${article.content || null}, ${article.image || null}, ${article.category},
          ${article.author}, ${article.popularity},
          ${article.createdAt}::timestamptz, ${article.createdAt}::timestamptz
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `
      if (result.length > 0) { inserted++; console.log(`  + [${String(inserted).padStart(3)}] ${article.title.slice(0, 72)}`) }
      else { skippedDup++; console.log(`  ~ SKIP: ${article.slug}`) }
    } catch (err) {
      failed++
      console.error(`  ! FAIL: ${article.title.slice(0, 60)} -- ${(err as Error).message}`)
    }
  }

  await sql.end()

  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION COMPLETE')
  console.log('='.repeat(60))
  console.log(`  Joomla rows parsed:    ${contentRows.length}`)
  console.log(`  Published articles:    ${toInsert.length}`)
  console.log(`  Inserted:              ${inserted}`)
  console.log(`  Skipped (duplicate):   ${skippedDup}`)
  console.log(`  Failed:                ${failed}`)
  console.log(`  Skipped (unpublished): ${cntUnpublished}`)
  console.log('='.repeat(60))
  console.log('\nNEXT STEPS:')
  console.log('  1. Visit /admin -> Articles to review imported content')
  console.log('  2. Add featured images (Joomla media files were not migrated)')
  console.log('  3. Adjust categories for articles labelled Industry as needed')
  console.log('  4. Verify Greek text renders correctly on the frontend')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })