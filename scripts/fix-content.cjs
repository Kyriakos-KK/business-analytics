'use strict'

const fs       = require('fs')
const path     = require('path')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DB_PATH      = path.join(PROJECT_ROOT, 'payload.db')
const OUT_SQL      = path.join(PROJECT_ROOT, 'migration-data', 'fix-content.sql')

// Read all articles as JSON via sqlite3 CLI
console.log('Reading articles from database...')
const raw = execSync(
  `sqlite3 -json "${DB_PATH}" "SELECT id, content FROM articles WHERE content IS NOT NULL;"`,
  { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 }
)

const articles = JSON.parse(raw)
console.log(`Loaded ${articles.length} articles`)

function sqlEscape(str) {
  return "'" + String(str).replace(/'/g, "''") + "'"
}

let changed = 0
const lines = ['BEGIN TRANSACTION;']

for (const row of articles) {
  let c = row.content

  // 1. Strip MySQL backslash-escaped double quotes
  c = c.split('\\"').join('"')

  // 2. Rewrite Joomla image paths: images/stories/foo.jpg -> /images/foo.jpg
  c = c.replace(/src="images\/stories\/([^"]+)"/gi, function(_, file) {
    return 'src="/images/' + file.trim().replace(/\s+/g, '-') + '"'
  })
  c = c.replace(/src='images\/stories\/([^']+)'/gi, function(_, file) {
    return "src='/images/" + file.trim().replace(/\s+/g, '-') + "'"
  })

  if (c !== row.content) {
    lines.push('UPDATE articles SET content = ' + sqlEscape(c) + ' WHERE id = ' + row.id + ';')
    changed++
  }
}

lines.push('COMMIT;')

fs.writeFileSync(OUT_SQL, lines.join('\n'), 'utf8')
console.log('Written ' + changed + ' UPDATE statements to ' + OUT_SQL)

// Apply the SQL file
console.log('Applying fixes to database...')
execSync(`sqlite3 "${DB_PATH}" ".read ${OUT_SQL}"`, { stdio: 'inherit' })
console.log('Done.')
