const fs = require('fs');
const demoContent = fs.readFileSync('scripts/seed-demo-packages.ts', 'utf8');

const startMarker = 'const packages = [';
const startIdx = demoContent.indexOf(startMarker);
console.log('Start index:', startIdx);

let depth = 0;
let inStr = false;
let strChar = '';
let arrayStart = -1;
let arrayEnd = -1;
let indices = [];

for (let i = startIdx + startMarker.length - 1; i < demoContent.length; i++) {
  const ch = demoContent[i];
  if (inStr) {
    if (ch === '\\') { i++; continue; }
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
    indices.push({ pos: i, ch, depth });
    if (arrayStart === -1) arrayStart = i + 1;
  } else if (ch === ']') {
    depth--;
    indices.push({ pos: i, ch, depth });
    if (depth === 0 && arrayStart !== -1) {
      arrayEnd = i;
      break;
    }
  }
}

console.log('Array start:', arrayStart, 'end:', arrayEnd);
console.log('Array length:', arrayEnd - arrayStart);
console.log('Brackets tracked:', indices.length);

// Show first few bracket positions
indices.slice(0, 20).forEach(b => {
  console.log('  pos', b.pos, b.ch, 'depth', b.depth);
});
