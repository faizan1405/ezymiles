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

// Test what the regex actually matches
const regex = /\n\s*\/\/\s+\d+\.\s+/g;
const matches = arrayContent.match(regex);
console.log('Regex matches:', matches ? matches.length : 0);
console.log('First 5 matches:', matches ? matches.slice(0, 5) : []);

// Test a simpler split
const partsSimple = arrayContent.split('  // ');
console.log('\nSplit on "  // ":', partsSimple.length, 'parts');
for (let i = 0; i < Math.min(partsSimple.length, 5); i++) {
  console.log('  Part', i, ':', JSON.stringify(partsSimple[i].substring(0, 60)));
}

// Try splitting on newline followed by //
const partsNewline = arrayContent.split(/\n\s*\/\//);
console.log('\nSplit on newline+//:', partsNewline.length, 'parts');
for (let i = 0; i < Math.min(partsNewline.length, 5); i++) {
  console.log('  Part', i, ':', JSON.stringify(partsNewline[i].substring(0, 60)));
}

// Show what the first and second comment look like in the raw content
console.log('\n--- Raw comment positions ---');
const commentIdx1 = arrayContent.indexOf('// 1. ');
const commentIdx2 = arrayContent.indexOf('// 2. ');
const commentIdx3 = arrayContent.indexOf('// 3. ');
console.log('// 1. at:', commentIdx1, 'context:', JSON.stringify(arrayContent.substring(commentIdx1 - 2, commentIdx1 + 15)));
console.log('// 2. at:', commentIdx2, 'context:', JSON.stringify(arrayContent.substring(commentIdx2 - 2, commentIdx2 + 15)));
console.log('// 3. at:', commentIdx3, 'context:', JSON.stringify(arrayContent.substring(commentIdx3 - 2, commentIdx3 + 15)));
