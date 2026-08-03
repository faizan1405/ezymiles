const fs = require('fs');
const demoContent = fs.readFileSync('scripts/seed-demo-packages.ts', 'utf8');
const startMarker = 'const packages = [';
const startIdx = demoContent.indexOf(startMarker);

let depth = 0;
let inStr = false;
let strChar = '';
let arrayStart = -1;
let arrayEnd = -1;

for (let i = startIdx + startMarker.length - 1; i < demoContent.length; i++) {
  const ch = demoContent[i];
  if (inStr) {
    if (ch === '\') { i++; continue; }
    if (ch === strChar) inStr = false;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    inStr = true;
    strChar = ch;
    continue;
  }
  if (ch === '[') {
    depth++;
    if (arrayStart === -1) arrayStart = i + 1;
  } else if (ch === ']') {
    depth--;
    if (depth === 0 && arrayStart !== -1) {
      arrayEnd = i;
      break;
    }
  }
}

const arrayContent = demoContent.substring(arrayStart, arrayEnd);
console.log('Array content length:', arrayContent.length);
console.log('First 200 chars:', arrayContent.substring(0, 200));
console.log('---');
// Count // N. markers
const markers = arrayContent.match(/\n\s*\/\/\s+\d+\.\s+/g);
console.log('Package markers:', markers ? markers.length : 0);
// Show first few
if (markers) {
  markers.slice(0, 5).forEach(m => console.log('  ', m.trim()));
}
