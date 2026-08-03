const fs = require('fs');
const demoContent = fs.readFileSync('scripts/seed-demo-packages.ts', 'utf8');

function findCommentPositions(content) {
  const positions = [];
  const regex = /\/\/\s+\d+\.\s+/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    positions.push(m.index);
  }
  return positions;
}

function findArrayBounds(content, marker) {
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) return null;

  let depth = 0;
  let inStr = false;
  let strChar = '';
  let arrayStart = -1;
  let arrayEnd = -1;

  for (let i = startIdx + marker.length - 1; i < content.length; i++) {
    const ch = content[i];
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

  if (arrayStart === -1 || arrayEnd === -1) return null;
  return { start: startIdx, contentStart: arrayStart, contentEnd: arrayEnd, content: content.substring(arrayStart, arrayEnd) };
}

const bounds = findArrayBounds(demoContent, 'const packages = [');
console.log('Bounds:', bounds ? { start: bounds.start, contentStart: bounds.contentStart, contentEnd: bounds.contentEnd } : 'null');

const commentPositions = findCommentPositions(bounds.content);
console.log('Comments in array:', commentPositions.length);

// Test first 3
for (let i = 0; i < Math.min(3, commentPositions.length); i++) {
  const pos = commentPositions[i];
  console.log('\nComment', i, 'at relative pos', pos);
  console.log('  Text:', bounds.content.substring(pos, pos + 30));

  // Test globalPos calculation
  const globalPos = bounds.start + 18 + pos;
  console.log('  globalPos:', globalPos);
  const bracePos = demoContent.indexOf('{', globalPos);
  console.log('  bracePos:', bracePos);
  if (bracePos > -1) {
    console.log('  brace context:', demoContent.substring(bracePos, bracePos + 50));
  }
}
