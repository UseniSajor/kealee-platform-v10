const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(WORKSPACE_ROOT, '_logo-kit');

// SVG Concepts (Concept 1: The Lifecycle Ribbon)
const SVG_FULL_COLORED = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80">
  <defs>
    <linearGradient id="concept1-blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="concept1-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EA580C" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <linearGradient id="concept1-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
  </defs>
  <g transform="translate(12, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="url(#concept1-blue)" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="url(#concept1-orange)" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="url(#concept1-violet)" stroke-width="12" stroke-linecap="round" />
  </g>
  <text x="88" y="52" font-family="'Plus Jakarta Sans', 'Outfit', sans-serif" font-weight="700" font-size="38" fill="#0F172A" letter-spacing="-0.03em">kealee</text>
</svg>
`;

const SVG_FULL_SOLID_DARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80">
  <g transform="translate(12, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="#0F172A" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="#0F172A" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="#0F172A" stroke-width="12" stroke-linecap="round" />
  </g>
  <text x="88" y="52" font-family="'Plus Jakarta Sans', 'Outfit', sans-serif" font-weight="700" font-size="38" fill="#0F172A" letter-spacing="-0.03em">kealee</text>
</svg>
`;

const SVG_FULL_SOLID_LIGHT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80">
  <g transform="translate(12, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="#FFFFFF" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
  </g>
  <text x="88" y="52" font-family="'Plus Jakarta Sans', 'Outfit', sans-serif" font-weight="700" font-size="38" fill="#FFFFFF" letter-spacing="-0.03em">kealee</text>
</svg>
`;

const SVG_ICON_COLORED = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    <linearGradient id="concept1-blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="concept1-orange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EA580C" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <linearGradient id="concept1-violet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
  </defs>
  <g transform="translate(2.5, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="url(#concept1-blue)" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="url(#concept1-orange)" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="url(#concept1-violet)" stroke-width="12" stroke-linecap="round" />
  </g>
</svg>
`;

const SVG_ICON_SOLID_DARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <g transform="translate(2.5, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="#0F172A" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="#0F172A" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="#0F172A" stroke-width="12" stroke-linecap="round" />
  </g>
</svg>
`;

const SVG_ICON_SOLID_LIGHT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <g transform="translate(2.5, 10)">
    <rect x="15" y="5" width="14" height="50" rx="7" fill="#FFFFFF" />
    <path d="M 22 28 C 36 28, 42 5, 54 5" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
    <path d="M 22 32 C 36 32, 42 55, 54 55" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
  </g>
</svg>
`;

async function generateSet(dir, svgFull, svgIcon, isWhiteText = false) {
  fs.mkdirSync(dir, { recursive: true });

  // Save the master SVG files
  fs.writeFileSync(path.join(dir, 'kealee-logo.svg'), svgFull.trim());
  fs.writeFileSync(path.join(dir, 'kealee-icon.svg'), svgIcon.trim());

  // 1. Render and Trim the Full Logo PNG
  const fullPngBuffer = await sharp(Buffer.from(svgFull))
    .png()
    .toBuffer();

  const trimmed = await sharp(fullPngBuffer)
    .trim()
    .toBuffer({ resolveWithObject: true });

  const { width: trimW, height: trimH } = trimmed.info;
  console.log(`[Trimmed] W: ${trimW}, H: ${trimH} (aspect ratio ${(trimW / trimH).toFixed(2)})`);

  // Save full cropped master
  fs.writeFileSync(path.join(dir, 'kealee-logo-full.png'), trimmed.data);
  fs.writeFileSync(path.join(dir, 'kealee-logo.png'), trimmed.data);
  fs.writeFileSync(path.join(dir, 'kealee-logo-transparent.png'), trimmed.data);

  // Width-based resized versions
  const widths = [800, 600, 400, 300, 200];
  for (const w of widths) {
    const h = Math.round(w * (trimH / trimW));
    await sharp(trimmed.data)
      .resize(w, h, { fit: 'fill' })
      .png()
      .toFile(path.join(dir, `kealee-logo-${w}w.png`));
  }

  // 2. Render App Icons (from the square SVG icon)
  const iconSizes = [
    { size: 16, name: 'kealee-icon-16x16.png' },
    { size: 32, name: 'kealee-icon-32x32.png' },
    { size: 192, name: 'kealee-icon-192x192.png' },
    { size: 512, name: 'kealee-icon-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ];

  for (const { size, name } of iconSizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, name));
  }

  // Generate transparent variant filenames for compatibility
  for (const { size, name } of iconSizes) {
    const transparentName = name.replace('.png', '-transparent.png');
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, transparentName));
  }

  // 3. Multi-size favicon.ico
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of icoSizes) {
    const buf = await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }

  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  let dataOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  const dirEntries = Buffer.alloc(dirSize);
  const dataChunks = [];

  for (let i = 0; i < numImages; i++) {
    const { size, buf } = pngBuffers[i];
    const offset = i * dirEntrySize;
    dirEntries.writeUInt8(size < 256 ? size : 0, offset + 0);
    dirEntries.writeUInt8(size < 256 ? size : 0, offset + 1);
    dirEntries.writeUInt8(0, offset + 2);
    dirEntries.writeUInt8(0, offset + 3);
    dirEntries.writeUInt16LE(1, offset + 4);
    dirEntries.writeUInt16LE(32, offset + 6);
    dirEntries.writeUInt32LE(buf.length, offset + 8);
    dirEntries.writeUInt32LE(dataOffset, offset + 12);
    dataChunks.push(buf);
    dataOffset += buf.length;
  }

  const ico = Buffer.concat([header, dirEntries, ...dataChunks]);
  fs.writeFileSync(path.join(dir, 'favicon.ico'), ico);

  // 4. OG Image (1200x630)
  const ogBgColor = isWhiteText ? { r: 15, g: 23, b: 42 } : { r: 255, g: 255, b: 255 }; // slate-900 or white
  const ogLogoH = Math.round(630 * 0.4);
  const ogLogoW = Math.round(ogLogoH * (trimW / trimH));

  const resizedLogo = await sharp(trimmed.data)
    .resize(ogLogoW, ogLogoH, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: ogBgColor
    }
  })
    .composite([{ input: resizedLogo, left: Math.round((1200 - ogLogoW) / 2), top: Math.round((630 - ogLogoH) / 2) }])
    .jpeg({ quality: 90 })
    .toFile(path.join(dir, 'kealee-og-image.jpg'));
}

async function main() {
  console.log('Starting logo generator in:', OUT_DIR);

  // Generate Colored (Default) Version
  console.log('Generating Colored Logo kit...');
  await generateSet(OUT_DIR, SVG_FULL_COLORED, SVG_ICON_COLORED, false);

  // Generate Solid Dark Version
  console.log('Generating Solid Dark Logo kit...');
  await generateSet(path.join(OUT_DIR, 'solid-dark'), SVG_FULL_SOLID_DARK, SVG_ICON_SOLID_DARK, false);

  // Generate Solid Light Version
  console.log('Generating Solid Light Logo kit...');
  await generateSet(path.join(OUT_DIR, 'solid-light'), SVG_FULL_SOLID_LIGHT, SVG_ICON_SOLID_LIGHT, true);

  console.log('\nCopying generated main files to apps...');
  
  // Find all public/ directories inside apps/
  const appsDir = path.resolve(WORKSPACE_ROOT, 'apps');
  const items = fs.readdirSync(appsDir);
  
  const filesToCopy = [
    'kealee-logo-full.png',
    'kealee-logo.png',
    'kealee-logo-transparent.png',
    'kealee-logo-800w.png',
    'kealee-logo-600w.png',
    'kealee-logo-400w.png',
    'kealee-logo-300w.png',
    'kealee-logo-200w.png',
    'kealee-icon-16x16.png',
    'kealee-icon-32x32.png',
    'kealee-icon-192x192.png',
    'kealee-icon-512x512.png',
    'apple-touch-icon.png',
    'favicon.ico',
    'kealee-og-image.jpg',
    'kealee-logo.svg',
    'kealee-icon.svg',
    'kealee-icon-16x16-transparent.png',
    'kealee-icon-32x32-transparent.png',
    'kealee-icon-192x192-transparent.png',
    'kealee-icon-512x512-transparent.png',
    'apple-touch-icon-transparent.png'
  ];

  for (const item of items) {
    const itemPath = path.join(appsDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const publicPath = path.join(itemPath, 'public');
      if (fs.existsSync(publicPath)) {
        console.log(`Copying logo assets to: ${publicPath}`);
        for (const file of filesToCopy) {
          const srcFile = path.join(OUT_DIR, file);
          const destFile = path.join(publicPath, file);
          if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
          }
        }
      }
    }
  }

  console.log('\n✅ Logo generation and distribution completed successfully!');
}

main().catch(err => {
  console.error('Fatal error generating logos:', err);
  process.exit(1);
});
