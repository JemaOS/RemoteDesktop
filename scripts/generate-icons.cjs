// Script to generate PWA icons from SVG
// Run with: node scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const svgPath = path.join(iconsDir, 'icon.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 167, name: 'icon-167x167.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512.png' },
];

// Maskable icon (with padding for safe zone)
const maskableSizes = [
  { size: 512, name: 'icon-maskable-512.png', padding: 0.1 },
];

async function generateIcons() {
  console.log('Generating PWA icons...');
  console.log('SVG source:', svgPath);
  console.log('');

  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate regular icons
  for (const { size, name } of sizes) {
    const outputPath = path.join(iconsDir, name);
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate maskable icons (with padding)
  for (const { size, name, padding } of maskableSizes) {
    const outputPath = path.join(iconsDir, name);
    const innerSize = Math.floor(size * (1 - padding * 2));
    const paddingPx = Math.floor(size * padding);
    
    try {
      // Create icon with padding for maskable
      const resizedIcon = await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .png()
        .toBuffer();
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 91, g: 100, b: 233, alpha: 1 } // #5b64e9
        }
      })
        .composite([{
          input: resizedIcon,
          top: paddingPx,
          left: paddingPx
        }])
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size}, maskable)`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('');
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);