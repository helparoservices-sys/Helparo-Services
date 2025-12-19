const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content for the Helparo logo (green H)
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)"/>
  <path d="M149 128V384" stroke="white" stroke-width="53" stroke-linecap="round"/>
  <path d="M363 128V384" stroke="white" stroke-width="53" stroke-linecap="round"/>
  <path d="M149 256H363" stroke="white" stroke-width="53" stroke-linecap="round"/>
</svg>`;

// Icon sizes for Android
const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

async function generateIcons() {
  const svgBuffer = Buffer.from(svgContent);
  
  for (const { name, size } of sizes) {
    const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', name);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher.png'));
    
    // Generate round icon (same for now)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher_round.png'));
    
    // Generate foreground icon (for adaptive icons)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher_foreground.png'));
    
    console.log(`✅ Generated ${size}x${size} icons in ${name}`);
  }
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
