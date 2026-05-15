const fs = require('fs')
const path = require('path')
const SQL = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL, 'utf8')
const lines = raw.split('\n')

for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  // Find the exact article "Data centers sti thalassa"
  const idx = line.indexOf('data-centers-sti-thalassa')
  if (idx === -1) continue
  // Get the full record
  let depth = 0, start = -1
  for (let i = idx; i >= 0; i--) {
    if (line[i] === ')') depth++
    if (line[i] === '(') {
      if (depth === 0) { start = i; break }
      depth--
    }
  }
  if (start !== -1) {
    const record = line.substring(start, Math.min(start + 1000, line.length))
    console.log(record)
  }
}
