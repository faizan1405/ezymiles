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

function extractFromPackagesArray(content) {
  const packages = [];
  const startMarker = 'const packages = [';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return packages;

  // Extract the entire packages array content with proper bracket matching
  let depth = 0;
  let inStr = false;
  let strChar = '';
  let arrayStart = -1;
  let arrayEnd = -1;

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
      if (arrayStart === -1) arrayStart = i + 1;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && arrayStart !== -1) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayStart === -1 || arrayEnd === -1) return packages;
  const arrayContent = content.substring(arrayStart, arrayEnd);

  // Split by package comment markers
  const pkgBlocks = arrayContent.split(/\n\s*\/\/\s+\d+\.\s+/);
  for (let i = 1; i < pkgBlocks.length; i++) {
    const block = pkgBlocks[i];
    const slugMatch = block.match(/^\s*slug:\s*"([^"]+)"/m);
    if (!slugMatch) continue;
    const titleMatch = block.match(/^\s*title:\s*"([^"]+)"/m);
    const title = titleMatch ? titleMatch[1] : '';

    // Extract the object using brace matching
    const objStart = block.indexOf('{');
    if (objStart === -1) continue;

    let d = 0;
    let objStr = '';
    let inS = false;
    let sc = '';
    let objEnd = -1;
    for (let j = objStart; j < block.length; j++) {
      const c = block[j];
      if (inS) {
        objStr += c;
        if (c === '\\') { j++; if (j < block.length) objStr += block[j]; }
        else if (c === sc) inS = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { inS = true; sc = c; objStr += c; continue; }
      if (c === '{') { d++; objStr += c; }
      else if (c === '}') {
        d--;
        objStr += c;
        if (d === 0) { objEnd = j; break; }
      } else {
        objStr += c;
      }
    }

    if (objEnd === -1) continue;

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

function extractExtra(content) {
  const packages = [];
  const blocks = content.split(/\n\s*\/\/\s+\d+\.\s+/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const start = block.indexOf('{');
    if (start === -1) continue;

    let d = 0;
    let objStr = '';
    let inS = false;
    let sc = '';
    let objEnd = -1;
    for (let j = start; j < block.length; j++) {
      const c = block[j];
      if (inS) {
        objStr += c;
        if (c === '\\') { j++; if (j < block.length) objStr += block[j]; }
        else if (c === sc) inS = false;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { inS = true; sc = c; objStr += c; continue; }
      if (c === '{') { d++; objStr += c; }
      else if (c === '}') {
        d--;
        objStr += c;
        if (d === 0) { objEnd = j; break; }
      } else {
        objStr += c;
      }
    }

    if (objEnd === -1) continue;

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

const demoPkgs = extractFromPackagesArray(demoContent);
const extraPkgs = extractExtra(extraContent);

const seen = new Map();
for (const p of [...demoPkgs, ...extraPkgs]) {
  if (!seen.has(p.slug)) seen.set(p.slug, p);
}
console.log('Demo packages: ' + demoPkgs.length);
console.log('Extra packages: ' + extraPkgs.length);
console.log('Unique packages: ' + seen.size);

const header = '/**\n * Package seed data.\n * ' + seen.size + ' packages extracted from scripts/seed-demo-packages.ts and scripts/_extra-packages.ts.\n */\n\nconst img = (id: string, alt: string) => ({\n  url: `https://images.unsplash.com/${id}?w=1600&q=80`,\n  alt,\n});\n\nexport const img_ = img;\n\nconst day = (n: number, city: string, title: string, description: string, hotel = "", activities: string[] = []) => ({\n  day: n,\n  city,\n  title,\n  description,\n  meals: ["breakfast"] as ("breakfast" | "lunch" | "dinner")[],\n  hotel,\n  transfers: hotel ? "Private transfer" : "",\n  activities,\n  optionalExperiences: [],\n});\n\nexport const day_ = day;\n\nconst variant = (\n  key: string,\n  label: string,\n  hotelCategory: 3 | 4 | 5,\n  pricePerAdultINR: number,\n  originalPricePerAdultINR: number | undefined,\n  isDefault: boolean,\n  roomAmenities: string[],\n  pricePerNightINR: number,\n) => ({\n  key,\n  label,\n  hotelCategory,\n  durationDays: 6,\n  durationNights: 5,\n  pricePerAdultINR,\n  pricePerChildINR: Math.round(pricePerAdultINR * 0.7),\n  originalPricePerAdultINR,\n  isDefault,\n  description: label,\n  rooms: [\n    {\n      key: `${key}-room`,\n      name: label,\n      description: `Standard room with ${label.toLowerCase()}.`,\n      images: [img("photo-1537996194471-e657df975ab4", label)],\n      maxAdults: 2,\n      maxChildren: 1,\n      maxOccupancy: 3,\n      bedType: "King",\n      sizeSqft: 400,\n      amenities: roomAmenities,\n      mealPlan: "breakfast" as const,\n      pricePerNightINR,\n      taxPercent: 12,\n      refundable: true,\n      cancellationRule: "Free cancellation up to 14 days before check-in.",\n      roomsAvailable: 8,\n    },\n  ],\n});\n\nexport const variant_ = variant;\n\nexport type PackageSeed = Record<string, unknown> & {\n  title: string;\n  slug: string;\n  destinationSlug: string;\n};\n\nexport const packageSeeds: PackageSeed[] = [\n';

const footer = '];\n';

let body = '';
for (const [slug, pkg] of seen) {
  body += '  // ' + pkg.title + '\n  ' + pkg.object + ',\n\n';
}

const output = header + body + footer;
fs.writeFileSync('src/scripts/seed-packages-data.ts', output);
console.log('Wrote ' + seen.size + ' packages (' + output.length + ' bytes)');

const content = fs.readFileSync('src/scripts/seed-packages-data.ts', 'utf8');
const lines = content.split('\n');
const comments = (content.match(/^  \/\/ [A-Z]/gm) || []).length;
const isDemo = (content.match(/isDemoData: true/g) || []).length;
console.log('Package comments: ' + comments);
console.log('isDemoData lines: ' + isDemo);
console.log('Total lines: ' + lines.length);
console.log('Last 5 lines: ' + lines.slice(-5).join(' | '));
