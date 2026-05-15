const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
// Find most recent dates
const allDates = [...raw.matchAll(/'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'/g)]
  .map(m => m[1])
  .filter(d => d > '2016-11-01')
  .sort()
  .reverse()
console.log('Dates after 2016 found in file:', allDates.length)
console.log('Most recent:', allDates.slice(0, 20))
