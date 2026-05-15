const fs = require('fs')
const path = require('path')
const SQL = path.resolve(__dirname, '../migration-data/ba_gr_2026-05-12_15-51-00.sql')
const raw = fs.readFileSync(SQL, 'utf8')
const lines = raw.split('\n')

const targets = ['nasa-donald-trump', 'smartphones-2', 'ai-agentic-ai']

for (const line of lines) {
  if (!line.startsWith("INSERT INTO `bgr_content`")) continue
  for (const t of targets) {
    const idx = line.indexOf("'" + t + "'")
    if (idx === -1) continue
    // Find start of this record
    let depth = 0, start = idx
    for (let i = idx - 1; i >= 0; i--) {
      const c = line[i]
      if (c === '(') { if (depth === 0) { start = i; break } depth-- }
      else if (c === ')') depth++
    }
    // Parse 18 fields
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
    console.log('Slug:', t)
    console.log('images field (f[17]):', fields[17] ? fields[17].substring(0, 200) : 'MISSING')
    console.log()
  }
}
