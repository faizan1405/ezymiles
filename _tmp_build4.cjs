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

function extractObjectWithBraces(text, startPos) {
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

function extractDemoPackages(content) {
  const packages = [];
  const startMarker = 'const packages = [';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return packages;

  // Find array boundaries with proper bracket counting
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

  // Split by package comment markers: "  // N. Title"
  const pkgBlocks = arrayContent.split(/\n\s*\/\/\s+\d+\.\s+/);

  for (let i = 1; i < pkgBlocks.length; i++) {
    const block = pkgBlocks[i];

    // Extract slug and title
    const slugMatch = block.match(/^\s*slug:\s*"([^"]+)"/m);
    if (!slugMatch) continue;
    const titleMatch = block.match(/^\s*title:\s*"([^"]+)"/m);
    const title = titleMatch ? titleMatch[1] : '';

    // Extract the full object
    const objStart = block.indexOf('{');
    if (objStart === -1) continue;
    const objStr = extractObjectWithBraces(block, objStart);
    if (!objStr) continue;

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
  const blocks = content.split(/\n\s*\/\/\s+\d+\.\s+/);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const start = block.indexOf('{');
    if (start === -1) continue;

    const objStr = extractObjectWithBraces(block, start);
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

const demoPkgs = extractDemoPackages(demoContent);
const extraPkgs = extractExtraPackages(extraContent);

console.log('Demo packages:', demoPkgs.length);
console.log('Extra packages:', extraPkgs.length);

const seen = new Map();
for (const p of [...demoPkgs, ...extraPkgs]) {
  if (!seen.has(p.slug)) seen.set(p.slug, p);
}
console.log('Unique packages:', seen.size);

// Build the TypeScript file
const lines = [];
lines.push('/**');
lines.push(' * Package seed data.');
lines.push(' * ' + seen.size + ' packages from scripts/seed-demo-packages.ts and scripts/_extra-packages.ts.');
lines.push(' */');
lines.push('');
lines.push('const img = (id: string, alt: string) => ({');
lines.push('  url: `https://images.unsplash.com/${id}?w=1600&q=80`,');
lines.push('  alt,');
lines.push('});');
lines.push('');
lines.push('export const img_ = img;');
lines.push('');
lines.push('const day = (n: number, city: string, title: string, description: string, hotel = "", activities: string[] = []) => ({');
lines.push('  day: n,');
lines.push('  city,');
lines.push('  title,');
lines.push('  description,');
lines.push('  meals: ["breakfast"] as ("breakfast" | "lunch" | "dinner")[],');
lines.push('  hotel,');
lines.push('  transfers: hotel ? "Private transfer" : "",');
lines.push('  activities,');
lines.push('  optionalExperiences: [],');
lines.push('});');
lines.push('');
lines.push('export const day_ = day;');
lines.push('');
lines.push('const variant = (');
lines.push('  key: string,');
lines.push('  label: string,');
lines.push('  hotelCategory: 3 | 4 | 5,');
lines.push('  pricePerAdultINR: number,');
lines.push('  originalPricePerAdultINR: number | undefined,');
lines.push('  isDefault: boolean,');
lines.push('  roomAmenities: string[],');
lines.push('  pricePerNightINR: number,');
lines.push(') => ({');
lines.push('  key,');
lines.push('  label,');
lines.push('  hotelCategory,');
lines.push('  durationDays: 6,');
lines.push('  durationNights: 5,');
lines.push('  pricePerAdultINR,');
lines.push('  pricePerChildINR: Math.round(pricePerAdultINR * 0.7),');
lines.push('  originalPricePerAdultINR,');
lines.push('  isDefault,');
lines.push('  description: label,');
lines.push('  rooms: [');
lines.push('    {');
lines.push('      key: `${key}-room`,');
lines.push('      name: label,');
lines.push('      description: `Standard room with ${label.toLowerCase()}.`,');
lines.push('      images: [img("photo-1537996194471-e657df975ab4", label)],');
lines.push('      maxAdults: 2,');
lines.push('      maxChildren: 1,');
lines.push('      maxOccupancy: 3,');
lines.push('      bedType: "King",');
lines.push('      sizeSqft: 400,');
lines.push('      amenities: roomAmenities,');
lines.push('      mealPlan: "breakfast" as const,');
lines.push('      pricePerNightINR,');
lines.push('      taxPercent: 12,');
lines.push('      refundable: true,');
lines.push('      cancellationRule: "Free cancellation up to 14 days before check-in.",');
lines.push('      roomsAvailable: 8,');
lines.push('    },');
lines.push('  ],');
lines.push('});');
lines.push('');
lines.push('export const variant_ = variant;');
lines.push('');
lines.push('export type PackageSeed = Record<string, unknown> & {');
lines.push('  title: string;');
lines.push('  slug: string;');
lines.push('  destinationSlug: string;');
lines.push('};');
lines.push('');
lines.push('export const packageSeeds: PackageSeed[] = [');
lines.push('');

for (const [slug, pkg] of seen) {
  lines.push('  // ' + pkg.title);
  lines.push('  ' + pkg.object + ',');
  lines.push('');
}

lines.push('];');

const output = lines.join('\n');
fs.writeFileSync('src/scripts/seed-packages-data.ts', output);

const content = fs.readFileSync('src/scripts/seed-packages-data.ts', 'utf8');
const fileLines = content.split('\n');
const comments = (content.match(/^  \/\/ [A-Z]/gm) || []).length;
const isDemo = (content.match(/isDemoData: true/g) || []).length;
console.log('Wrote ' + seen.size + ' packages');
console.log('Package comments:', comments);
console.log('isDemoData lines:', isDemo);
console.log('Total lines:', fileLines.length);
console.log('Last 5:', fileLines.slice(-5).join(' | '));
