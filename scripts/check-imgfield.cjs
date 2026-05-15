const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

// Sample the images field (col 17) for records that have content
let samples = []
for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  // Quick scan: find records with non-empty images JSON
  const imgMatches = [...line.matchAll(/'(\{"image_intro":"[^"]+)/g)]
  imgMatches.forEach(m => samples.push(m[1].substring(0, 120)))
  if (samples.length >= 10) break
}
console.log('Sample images JSON fields:')
samples.forEach(s => console.log(' ', s))
