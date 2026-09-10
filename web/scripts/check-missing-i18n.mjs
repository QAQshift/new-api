import fs from 'node:fs'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node check-missing-i18n.mjs <files...>')
  process.exit(1)
}
const used = new Set()
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
    used.add(match[1].replace(/\\'/g, "'"))
  }
}
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'))
const table = en.translation || en
const missing = [...used].filter((key) => !(key in table)).sort()
console.log(JSON.stringify(missing, null, 1))
console.log('missing:', missing.length, 'used:', used.size)
