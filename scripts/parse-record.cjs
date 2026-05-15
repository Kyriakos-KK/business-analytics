const fs = require('fs')
const path = require('path')
const SQL = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL, 'utf8')
const lines = raw.split('\n')

// Parse the specific article to get its images field (col 17)
for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  const idx = line.indexOf("'data-centers-ai'")
  if (idx === -1) continue
  
  // Find the start of this record
  let depth = 0, start = idx
  for (let i = idx - 1; i >= 0; i--) {
    const c = line[i]
    if (c === '(') {
      if (depth === 0) { start = i; break }
      depth--
    } else if (c === ')') depth++
  }
  
  // Parse fields character by character
  let pos = start + 1
  const fields = []
  let inStr = false, cur = ''
  while (pos < line.length && fields.length < 20) {
    const ch = line[pos]
    if (inStr) {
      if (ch === '\\' && pos+1 < line.length) { cur += ch + line[pos+1]; pos+=2; continue }
      if (ch === "'") { if (line[pos+1] === "'") { cur += "''"; pos+=2; continue } inStr=false; pos++; continue }
      cur += ch; pos++
    } else {
      if (ch === "'") { inStr=true; pos++; continue }
      if (ch === ',') { fields.push(cur); cur=''; pos++; continue }
      if (ch === ')') { fields.push(cur); break }
      cur += ch; pos++
    }
  }
  
  console.log('Total fields:', fields.length)
  console.log('Field 2 (title):', fields[2])
  console.log('Field 17 (images JSON):', fields[17] ? fields[17].substring(0, 200) : 'EMPTY')
  console.log('Field 4 (introtext preview):', fields[4] ? fields[4].substring(0,150) : 'EMPTY')
  break
}
