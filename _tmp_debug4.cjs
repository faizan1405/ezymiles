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

// Test the split with different regexes
console.log('=== Testing regex patterns ===');
console.log('Content starts with:', JSON.stringify(arrayContent.substring(0, 100)));

// Pattern 1: \n\s*\/\/\s+\d+\.\s+
let parts1 = arrayContent.split(/\n\s*\/\/\s+\d+\.\s+/);
console.log('\nPattern 1 (\\n\\s*\\/\\/\\s+\\d+\\.\\s+):', parts1.length, 'parts');
for (let i = 0; i < Math.min(parts1.length, 4); i++) {
  console.log('  Part', i, ':', JSON.stringify(parts1[i].substring(0, 80)));
}

// Pattern 2: \n\/\/\s+\d+\.\s+
let parts2 = arrayContent.split(/\n\/\/\s+\d+\.\s+/);
console.log('\nPattern 2 (\\n\\/\\/\\s+\\d+\\.\\s+):', parts2.length, 'parts');
for (let i = 0; i < Math.min(parts2.length, 4); i++) {
  console.log('  Part', i, ':', JSON.stringify(parts2[i].substring(0, 80)));
}

// Pattern 3: just match // N.
let parts3 = arrayContent.split(/\n\/\/\s+\d+\./);
console.log('\nPattern 3 (\\n\\/\\/\\s+\\d+\\.):', parts3.length, 'parts');
for (let i = 0; i < Math.min(parts3.length, 4); i++) {
  console.log('  Part', i, ':', JSON.stringify(parts3[i].substring(0, 80)));
}
