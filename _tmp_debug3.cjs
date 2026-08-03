const fs = require('fs');
const demoContent = fs.readFileSync('scripts/seed-demo-packages.ts', 'utf8');
const startMarker = 'const packages = [';
const startIdx = demoContent.indexOf(startMarker);
console.log('startIdx:', startIdx, 'startMarker.length:', startMarker.length);
console.log('Character at startIdx + startMarker.length - 1:', demoContent[startIdx + startMarker.length - 1]);

let depth = 0;
let inStr = false;
let strChar = '';
let arrayStart = -1;
let arrayEnd = -1;
let bracketLog = [];

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
    if (arrayStart === -1) {
      arrayStart = i + 1;
      console.log('Array starts at position:', arrayStart, 'char:', demoContent[i]);
    }
    bracketLog.push({ pos: i, ch: '[', depth });
  } else if (ch === ']') {
    bracketLog.push({ pos: i, ch: ']', depth });
    depth--;
    if (depth === 0 && arrayStart !== -1) {
      arrayEnd = i;
      console.log('Array ends at position:', arrayEnd, 'char:', demoContent[i]);
      break;
    }
  }
}

console.log('Total bracket changes:', bracketLog.length);
console.log('First 5:', JSON.stringify(bracketLog.slice(0, 5)));
console.log('Last 5:', JSON.stringify(bracketLog.slice(-5)));

const arrayContent = demoContent.substring(arrayStart, arrayEnd);
console.log('\nArray content length:', arrayContent.length);
console.log('First 300:', arrayContent.substring(0, 300));
console.log('---');

const parts = arrayContent.split(/\n\s*\/\/\s+\d+\.\s+/);
console.log('Parts:', parts.length);
for (let i = 1; i < Math.min(parts.length, 6); i++) {
  console.log('Part', i, ':', parts[i].substring(0, 60).replace(/\n/g, '\\n'));
}
