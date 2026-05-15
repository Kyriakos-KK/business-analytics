const fs = require('fs')
const path = require('path')
const SQL = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL, 'utf8')
const lines = raw.split('\n')

for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  const idx = line.indexOf("'data-centers-ai'")
  if (idx === -1) continue
  // Show context 200 chars before and after
  console.log('Found at:', idx)
  console.log('Context 500 chars around:', line.substring(Math.max(0, idx - 50), idx + 500))
}
