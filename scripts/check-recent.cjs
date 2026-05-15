const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SQL = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL, 'utf8')
const lines = raw.split('\n')

// Find the specific articles we know should have images
// "Data centers" - slug might be "data-centers-sti-thalassa..."
const targets = ['data-centers', 'anthropic', 'wall-street', 'chatgpt']

for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  for (const t of targets) {
    const idx = line.indexOf(t)
    if (idx !== -1) {
      // Get context around it - show fields 2 (title), images field (17), introtext (4)
      // Find the record containing this slug
      const recordStart = line.lastIndexOf('(', idx)
      const recordEnd = line.indexOf(')', idx)
      if (recordStart !== -1 && recordEnd !== -1) {
        const record = line.substring(recordStart, Math.min(recordEnd + 1, recordStart + 600))
        console.log('--- Match for:', t, '---')
        console.log(record.substring(0, 500))
        console.log()
      }
      break
    }
  }
}
