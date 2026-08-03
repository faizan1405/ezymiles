const fs = require('fs');
const demoContent = fs.readFileSync('scripts/seed-demo-packages.ts', 'utf8');
const extraContent = fs.readFileSync('scripts/_extra-packages.ts', 'utf8');

const DEST_MAP = {
  'bali-bliss': 'bali',
  'bali-luxury-escape': 'bali',
  'bali-cultural-immersion': 'bali',
  'dubai-dreams': 'dubai',
  'dubai-abu-dhabi-grand-tour': 'dubai',
  'dubai-adventure-shopping': 'dubai',
  'dubai-marina-abu-dhabi': 'dubai',
  'himalayan-escape': 'himachal-pradesh',
  'himachal-pradesh-adventure': 'himachal-pradesh',
  'himachal-pradesh-hill-tour': 'himachal-pradesh',
  'kerala-gods-own-country': 'kerala-backwaters',
  'kerala-backwater-cruise': 'kerala-backwaters',
  'kerala-backwaters-hill-stations': 'kerala-backwaters',
  'leh-ladakh-expedition': 'ladakh',
  'ladakh-bike-expedition': 'ladakh',
  'leh-ladakh-motorcycle-expedition': 'ladakh',
  'sri-lanka-serenity': 'sri-lanka',
  'sri-lanka-highlights': 'sri-lanka',
  'goa-beach-retreat': 'goa',
  'golden-triangle': 'rajasthan',
  'rajasthan-royal-circuit': 'rajasthan',
  'jaisalmer-jodhpur-desert-safari': 'rajasthan',
  'andaman-islands-escape': 'andaman',
  'kashmir-paradise': 'kashmir',
  'thailand-beach-culture': 'thailand',
  'thailand-beach-bangkok': 'thailand',
  'singapore-city-break': 'singapore',
  'singapore-family-fun': 'singapore',
  'singapore-sentosa-island': 'singapore',
  'maldives-honeymoon': 'maldives',
  'maldives-overwater-villa': 'maldives',
  'mauritius-romance': 'mauritius',
  'vietnam-explorer': 'vietnam',
  'japan-cherry-blossom': 'japan',
  'europe-golden-triangle': 'europe',
  'seychelles-honeymoon': 'mauritius',
  'turkey-delights': 'turkey',
  'greek-islands-odyssey': 'santorini',
  'bhutan-happiness-tour': 'kyoto',
  'bhutan-kingdom-of-happiness': 'kyoto',
  'nepal-himalayan-trek': 'ladakh',
  'sikkim-darjeeling-delight': 'manali',
  'malaysia-twin-city': 'malaysia',
};

function extractObject(text, startPos) {
  let d = 0;
  let inS = false;
  let sc = '';
  let objStr = '';
  let objEnd = -1;

  for (let j = startPos; j < text.length; j++) {
    const c = text[j];
    if (inS) {
      objStr += c;
      if (c === '\\') {
        j++;
        if (j < text.length) objStr += text[j];
      } else if (c === sc) {
        inS = false;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inS = true;
      sc = c;
      objStr += c;
      continue;
    }
    if (c === '{') {
      d++;
      objStr += c;
    } else if (c === '}') {
      d--;
      objStr += c;
      if (d === 0) {
        objEnd = j;
        break;
      }
    } else {
      objStr += c;
    }
  }
  return objEnd === -1 ? null : objStr;
}

// For demo: find all "// N. Title" comment positions in the whole file
// and extract from each comment's position
function findCommentPositions(content) {
  const positions = [];
  const regex = /\/\/\s+\d+\.\s+/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    positions.push(m.index);
  }
  return positions;
}

function extractDemoPackages(content) {
  const packages = [];
  const startMarker = 'const packages = [';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return packages;

  // Find all comment positions AFTER the packages array starts
  const commentPositions = findCommentPositions(content.substring(startIdx));

  for (const pos of commentPositions) {
    const absolutePos = startIdx + pos;
    const commentText = content.substring(absolutePos, absolutePos + 50);
    console.log('Comment at', absolutePos, ':', commentText.substring(0, 40));
  }

  // Find the end of the packages array
  let depth = 0;
  let inStr = false;
  let strChar = '';
  let arrayEnd = -1;
  let arrayStartContent = -1;

  for (let i = startIdx + startMarker.length - 1; i < content.length; i++) {
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
      if (arrayStartContent === -1) arrayStartContent = i + 1;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && arrayStartContent !== -1) {
        arrayEnd = i;
        break;
      }
    }
  }

  console.log('Array: startContent', arrayStartContent, 'end', arrayEnd);

  // Only consider comments within the array
  const arrayContent = content.substring(startIdx, arrayEnd);
  const inArrayComments = findCommentPositions(arrayContent);

  console.log('Comments in array:', inArrayComments.length);

  for (const pos of inArrayComments) {
    // pos is relative to startIdx
    const globalPos = startIdx + pos;
    // Find the { after this comment
    const bracePos = content.indexOf('{', globalPos);
    if (bracePos === -1) continue;

    const objStr = extractObject(content, bracePos);
    if (!objStr) continue;

    const slugMatch = objStr.match(/^\s*slug:\s*"([^"]+)"/m);
    if (!slugMatch) continue;
    const titleMatch = objStr.match(/^\s*title:\s*"([^"]+)"/m);
    const title = titleMatch ? titleMatch[1] : '';

    const destSlug = DEST_MAP[slugMatch[1]] || 'bali';

    let transformed = objStr.replace(
      /^\s+destination:\s*""\s+as\s+never,/m,
      '    destinationSlug: "' + destSlug + '",'
    );

    if (!transformed.includes('isDemoData:')) {
      const lastClose = transformed.lastIndexOf('}');
      if (lastClose > -1) {
        const before = transformed.substring(0, lastClose).trimEnd();
        const cleaned = before.replace(/,\s*$/, '');
        transformed = cleaned + ',\n    isDemoData: true\n  }';
      }
    }

    packages.push({ slug: slugMatch[1], title, object: transformed });
  }

  return packages;
}

function extractExtraPackages(content) {
  const packages = [];
  const commentPositions = findCommentPositions(content);

  for (const pos of commentPositions) {
    const bracePos = content.indexOf('{', pos);
    if (bracePos === -1) continue;

    const objStr = extractObject(content, bracePos);
    if (!objStr) continue;

    const slugMatch = objStr.match(/^\s*slug:\s*"([^"]+)"/m);
    if (!slugMatch) continue;
    const titleMatch = objStr.match(/^\s*title:\s*"([^"]+)"/m);
    const title = titleMatch ? titleMatch[1] : '';

    const destSlug = DEST_MAP[slugMatch[1]] || 'bali';

    let transformed = objStr.replace(
      /^\s+destination:\s*""\s+as\s+never,/m,
      '    destinationSlug: "' + destSlug + '",'
    );

    if (!transformed.includes('isDemoData:')) {
      const lastClose = transformed.lastIndexOf('}');
      if (lastClose > -1) {
        const before = transformed.substring(0, lastClose).trimEnd();
        const cleaned = before.replace(/,\s*$/, '');
        transformed = cleaned + ',\n    isDemoData: true\n  }';
      }
    }

    packages.push({ slug: slugMatch[1], title, object: transformed });
  }
  return packages;
}

console.log('=== Extracting demo packages ===');
const demoPkgs = extractDemoPackages(demoContent);
console.log('\nDemo packages found:', demoPkgs.length);

console.log('\n=== Extracting extra packages ===');
const extraPkgs = extractExtraPackages(extraContent);
console.log('Extra packages found:', extraPkgs.length);

const seen = new Map();
for (const p of [...demoPkgs, ...extraPkgs]) {
  if (!seen.has(p.slug)) seen.set(p.slug, p);
}
console.log('\nUnique packages:', seen.size);
