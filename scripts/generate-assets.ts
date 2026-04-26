/**
 * Generates favicon.ico, PNG favicons, apple-touch-icon, and social-preview.png
 * Run: npx tsx scripts/generate-assets.ts
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC = resolve(import.meta.dirname!, '../public');

async function generateFavicon() {
  // Create a 32x32 PNG from the SVG favicon
  const svgPath = resolve(PUBLIC, 'favicon.svg');
  const svgBuffer = readFileSync(svgPath);

  // Generate multi-size PNGs
  await sharp(svgBuffer).resize(16, 16).png().toFile(resolve(PUBLIC, 'favicon-16x16.png'));
  console.log('[assets] Generated favicon-16x16.png');

  await sharp(svgBuffer).resize(32, 32).png().toFile(resolve(PUBLIC, 'favicon-32x32.png'));
  console.log('[assets] Generated favicon-32x32.png');

  // Generate .ico (multi-resolution)
  const toIco = (await import('to-ico')).default;
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const icoBuffer = await toIco([png16, png32]);
  writeFileSync(resolve(PUBLIC, 'favicon.ico'), icoBuffer);
  console.log('[assets] Generated favicon.ico (16+32)');

  // Apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(resolve(PUBLIC, 'apple-touch-icon.png'));
  console.log('[assets] Generated apple-touch-icon.png');
}

async function generateOgImage() {
  const svgPath = resolve(PUBLIC, 'social-preview.svg');
  const svgBuffer = readFileSync(svgPath);
  await sharp(svgBuffer).resize(1200, 630).png().toFile(resolve(PUBLIC, 'social-preview.png'));
  console.log('[assets] Generated social-preview.png');
}

async function main() {
  try {
    await generateFavicon();
    await generateOgImage();
    console.log('[assets] All assets generated successfully.');
  } catch (err: any) {
    console.error('[assets] Generation failed:', err.message);
    process.exit(1);
  }
}

main();
