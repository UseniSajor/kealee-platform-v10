const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Kealee-Platform v10/_logo-kit';
const LOGO_SRC = 'C:/Kealee-Platform v10/apps/m-marketplace/public/kealee-logo-transparent.png';

async function main() {
  // ─── Step 1: Auto-crop logo to content (remove transparent padding) ───
  const trimmed = await sharp(LOGO_SRC)
    .trim()
    .toBuffer({ resolveWithObject: true });

  const { width: trimW, height: trimH } = trimmed.info;
  console.log(`Trimmed source logo: ${trimW}x${trimH} (aspect ratio ${(trimW / trimH).toFixed(2)})`);

  // Save the master (full resolution, content-cropped)
  fs.writeFileSync(path.join(OUT, 'kealee-logo-full.png'), trimmed.data);
  console.log(`Created kealee-logo-full.png (${trimW}x${trimH})`);

  // ─── Step 2: Generate width-based logo sizes (preserving natural aspect ratio) ───
  const logoWidths = [800, 600, 400, 300, 200];
  for (const w of logoWidths) {
    const h = Math.round(w * (trimH / trimW));
    await sharp(trimmed.data)
      .resize(w, h, { fit: 'fill' })
      .png()
      .toFile(path.join(OUT, `kealee-logo-${w}w.png`));
    console.log(`Created kealee-logo-${w}w.png (${w}x${h})`);
  }

  // ─── Step 3: App Icons — ALL TRANSPARENT, no white box ───
  // Use the trimmed logo content, fit into a square with padding, transparent bg
  const iconSizes = [
    { size: 16, name: 'kealee-icon-16x16.png' },
    { size: 32, name: 'kealee-icon-32x32.png' },
    { size: 192, name: 'kealee-icon-192x192.png' },
    { size: 512, name: 'kealee-icon-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ];

  for (const { size, name } of iconSizes) {
    // Transparent background — logo centered, occupying ~80% of the square
    const logoSize = Math.round(size * 0.80);
    await sharp(trimmed.data)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round((size - logoSize) / 2),
        bottom: size - logoSize - Math.round((size - logoSize) / 2),
        left: Math.round((size - logoSize) / 2),
        right: size - logoSize - Math.round((size - logoSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(OUT, name));
    console.log(`Created ${name} (${size}x${size}, transparent)`);
  }

  // ─── Step 4: favicon.ico (multi-size, transparent) ───
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of icoSizes) {
    const buf = await sharp(trimmed.data)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);
  console.log(`Created favicon.ico (multi-size: ${icoSizes.join(', ')}px, transparent)`);

  // ─── Step 5: OG Image (1200x630, white background, logo centered) ───
  // OG images NEED a solid background (social cards render on white)
  const ogLogoHeight = Math.round(630 * 0.55);
  const ogLogoWidth = Math.round(ogLogoHeight * (trimW / trimH));

  const resizedLogo = await sharp(trimmed.data)
    .resize(ogLogoWidth, ogLogoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round((1200 - ogLogoWidth) / 2);
  const top = Math.round((630 - ogLogoHeight) / 2);

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([{ input: resizedLogo, left, top }])
    .jpeg({ quality: 90 })
    .toFile(path.join(OUT, 'kealee-og-image.jpg'));
  console.log('Created kealee-og-image.jpg (1200x630, white bg, centered logo)');

  console.log('\n✅ All files generated in:', OUT);
}

main().catch(err => { console.error(err); process.exit(1); });
