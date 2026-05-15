const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

let found = 0
for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  // Find image_intro with an actual path (not empty)
  const matches = [...line.matchAll(/\\"image_intro\\":\\"([^"\\]+)\\"/g)]
  for (const m of matches) {
    if (m[1] && m[1].length > 2) {
      console.log('image_intro:', m[1])
      found++
      if (found >= 10) break
    }
  }
  if (found >= 10) break
}
console.log('Found', found, 'non-empty image_intro values')
