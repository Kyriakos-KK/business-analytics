const fs = require('fs')
const path = require('path')

const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

// Find bgr_content lines and check for recent dates within them
let recentCount = 0
let oldCount = 0
let sampleTitles = []

for (const line of lines) {
  if (!line.startsWith('INSERT INTO `bgr_content`')) continue
  
  // Check for dates after 2016 in this line
  const recentDates = [...line.matchAll(/'(202\d-\d{2}-\d{2})/g)]
  if (recentDates.length > 0) {
    recentCount += recentDates.length
    // Try to extract a title
    const titleMatch = line.match(/,\d+,'([^']{10,80})',/)
    if (titleMatch) sampleTitles.push(titleMatch[1])
  }
  
  const oldDates = [...line.matchAll(/'(201[0-6]-\d{2}-\d{2})/g)]
  oldCount += oldDates.length
}

console.log('Recent dates (2020+) in bgr_content:', recentCount)
console.log('Old dates (2010-2016) in bgr_content:', oldCount)
console.log('Sample article titles with recent dates:', sampleTitles.slice(0, 5))
