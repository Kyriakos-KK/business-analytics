const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')
let total = 0
let dates = []
for (const line of lines) {
  if (!line.startsWith('INSERT INTO `bgr_content`')) continue
  // Count opening parentheses that start records - rough count
  const matches = line.match(/\(\d+,\d+,'/g)
  if (matches) total += matches.length
  // Extract created dates - look for datetime pattern after catid
  const dateMatches = line.match(/,'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'/g)
  if (dateMatches) dates.push(...dateMatches.slice(0,5))
}
console.log('Approximate article count:', total)
console.log('Sample dates:', dates.slice(0,10))
