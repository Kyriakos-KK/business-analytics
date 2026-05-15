const { execSync } = require('child_process')
const raw = execSync('sqlite3 "payload.db" "SELECT content FROM articles WHERE content LIKE \'%<img%\';"', 
  { encoding: 'utf8', maxBuffer: 200*1024*1024, cwd: process.cwd() })

const patterns = new Set()
const matches = [...raw.matchAll(/src="([^"]{1,80})"/gi)]
for (const m of matches) {
  const src = m[1]
  if (src.startsWith('data:')) { patterns.add('data:base64'); continue }
  if (src.startsWith('http')) { patterns.add('http: ' + src.substring(0,50)); continue }
  if (src.startsWith('/images/')) { patterns.add('/images/ (ok)'); continue }
  patterns.add('OTHER: ' + src.substring(0,60))
}
console.log([...patterns].sort().join('\n'))
