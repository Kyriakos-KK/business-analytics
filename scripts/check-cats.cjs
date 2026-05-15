const fs = require('fs')
const path = require('path')
const SQL_INPUT = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL_INPUT, 'utf8')
const lines = raw.split('\n')

for (const line of lines) {
  if (!line.startsWith('INSERT INTO `bgr_categories`')) continue
  // Extract category id and title pairs - fields: id, asset_id, parent_id, lft, rgt, level, path, extension, title, alias, ...
  const matches = [...line.matchAll(/\((\d+),\d+,\d+,\d+,\d+,\d+,'[^']*','[^']*','([^']+)'/g)]
  matches.forEach(m => {
    if (m[2] && m[2] !== 'ROOT' && !m[2].startsWith('PLG')) {
      console.log(`catid=${m[1]}: ${m[2]}`)
    }
  })
}
