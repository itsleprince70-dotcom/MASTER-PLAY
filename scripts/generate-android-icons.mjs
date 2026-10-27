import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync('public/icon.svg');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateAndroidIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join('android/app/src/main/res', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Standard square icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round icon (circular cutout)
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff" /></svg>`
    );
    const resizedIcon = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    await sharp(resizedIcon)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`Generated ${folder} icons (${size}x${size})`);
  }
}

generateAndroidIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
