import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('pwa-192x192.png generated');

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('pwa-512x512.png generated');

  // 512x512 maskable icon with safe zone padding (10% border)
  const innerSize = Math.floor(512 * 0.8);
  const innerIcon = await sharp(svgBuffer).resize(innerSize, innerSize).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 8, g: 12, b: 22, alpha: 1 }
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('pwa-maskable-512x512.png generated');

  // 180x180 apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('apple-touch-icon.png generated');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
