const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  // Find the images field - it is field index 17 (0-based), look for image_intro pattern
  const idx = line.indexOf('image_intro')
  if (idx !== -1) {
    console.log('Found image_intro at pos', idx)
    console.log('Context:', line.substring(idx - 5, idx + 150))
    break
  }
}
