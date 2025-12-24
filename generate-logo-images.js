/**
 * Generate high-quality H logo images for social media and app icons
 * Run: node generate-logo-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// High-quality H logo SVG with larger dimensions for clarity
const createLogoSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with gradient -->
  <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="url(#bg)"/>
  
  <!-- Stylish H using paths -->
  <path d="M${size * 0.292} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.708} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.292} ${size * 0.5}H${size * 0.708}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
</svg>
`;

// Square logo for social media (no rounded corners option)
const createSquareLogoSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with gradient - smaller radius for social media -->
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="url(#bg)"/>
  
  <!-- Stylish H using paths -->
  <path d="M${size * 0.292} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.708} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.292} ${size * 0.5}H${size * 0.708}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
</svg>
`;

// Circular logo for profile pictures
const createCircularLogoSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Circular background with gradient -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#bg)"/>
  
  <!-- Stylish H using paths -->
  <path d="M${size * 0.292} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.708} ${size * 0.25}V${size * 0.75}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  <path d="M${size * 0.292} ${size * 0.5}H${size * 0.708}" stroke="white" stroke-width="${size * 0.104}" stroke-linecap="round"/>
  
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
</svg>
`;

const outputDir = path.join(__dirname, 'public', 'brand');

async function generateLogos() {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sizes = [
    // Social Media Profile Pictures
    { name: 'logo-linkedin-400', size: 400, type: 'circular', desc: 'LinkedIn Profile (400x400)' },
    { name: 'logo-instagram-1080', size: 1080, type: 'circular', desc: 'Instagram Profile HD (1080x1080)' },
    { name: 'logo-twitter-400', size: 400, type: 'circular', desc: 'Twitter/X Profile (400x400)' },
    { name: 'logo-facebook-1080', size: 1080, type: 'circular', desc: 'Facebook Profile HD (1080x1080)' },
    
    // Square versions (for posts, thumbnails)
    { name: 'logo-square-512', size: 512, type: 'square', desc: 'Square Logo (512x512)' },
    { name: 'logo-square-1024', size: 1024, type: 'square', desc: 'Square Logo HD (1024x1024)' },
    { name: 'logo-square-2048', size: 2048, type: 'square', desc: 'Square Logo Ultra HD (2048x2048)' },
    
    // App icons (rounded corners)
    { name: 'logo-app-192', size: 192, type: 'rounded', desc: 'PWA Icon (192x192)' },
    { name: 'logo-app-512', size: 512, type: 'rounded', desc: 'PWA Icon HD (512x512)' },
    { name: 'logo-app-1024', size: 1024, type: 'rounded', desc: 'App Store Icon (1024x1024)' },
    
    // Favicons
    { name: 'favicon-32', size: 32, type: 'rounded', desc: 'Favicon (32x32)' },
    { name: 'favicon-64', size: 64, type: 'rounded', desc: 'Favicon (64x64)' },
    { name: 'favicon-128', size: 128, type: 'rounded', desc: 'Favicon HD (128x128)' },
    { name: 'favicon-256', size: 256, type: 'rounded', desc: 'Favicon HD (256x256)' },
  ];

  console.log('🎨 Generating Helparo H Logo Images...\n');

  for (const { name, size, type, desc } of sizes) {
    let svg;
    switch (type) {
      case 'circular':
        svg = createCircularLogoSVG(size);
        break;
      case 'square':
        svg = createSquareLogoSVG(size);
        break;
      default:
        svg = createLogoSVG(size);
    }

    const outputPath = path.join(outputDir, `${name}.png`);
    
    await sharp(Buffer.from(svg))
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`✅ ${desc}`);
    console.log(`   📁 ${outputPath}`);
    console.log(`   📐 ${size}x${size}px | ${(stats.size / 1024).toFixed(1)} KB\n`);
  }

  // Also update the main logo.jpg in public folder
  const mainLogoSvg = createLogoSVG(512);
  await sharp(Buffer.from(mainLogoSvg))
    .jpeg({ quality: 95 })
    .toFile(path.join(__dirname, 'public', 'logo.jpg'));
  console.log('✅ Updated public/logo.jpg (512x512)\n');

  // Update root logo.jpg
  await sharp(Buffer.from(createLogoSVG(1024)))
    .jpeg({ quality: 95 })
    .toFile(path.join(__dirname, 'logo.jpg'));
  console.log('✅ Updated root logo.jpg (1024x1024)\n');

  // Generate OG image (1200x630 for social sharing)
  const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Full background gradient -->
  <rect width="1200" height="630" fill="url(#ogbg)"/>
  
  <!-- Centered H Logo -->
  <g transform="translate(450, 115)">
    <rect width="300" height="300" rx="60" fill="white" fill-opacity="0.15"/>
    <path d="M87.6 75V225" stroke="white" stroke-width="31.2" stroke-linecap="round"/>
    <path d="M212.4 75V225" stroke="white" stroke-width="31.2" stroke-linecap="round"/>
    <path d="M87.6 150H212.4" stroke="white" stroke-width="31.2" stroke-linecap="round"/>
  </g>
  
  <!-- Helparo text -->
  <text x="600" y="500" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">HELPARO</text>
  <text x="600" y="560" font-family="Arial, sans-serif" font-size="28" fill="white" fill-opacity="0.8" text-anchor="middle">Professional Home Services</text>
  
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1200" y2="630">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
</svg>
`;

  await sharp(Buffer.from(ogSvg))
    .png({ quality: 100 })
    .toFile(path.join(__dirname, 'public', 'og-image.png'));
  console.log('✅ Updated public/og-image.png (1200x630 - Social Share Image)\n');

  console.log('═'.repeat(60));
  console.log('🎉 All logos generated successfully!');
  console.log('═'.repeat(60));
  console.log('\n📂 Social Media Profile Pictures (circular):');
  console.log('   • LinkedIn:  public/brand/logo-linkedin-400.png');
  console.log('   • Instagram: public/brand/logo-instagram-1080.png');
  console.log('   • Twitter/X: public/brand/logo-twitter-400.png');
  console.log('   • Facebook:  public/brand/logo-facebook-1080.png');
  console.log('\n📂 High-Quality Square Logos:');
  console.log('   • public/brand/logo-square-512.png');
  console.log('   • public/brand/logo-square-1024.png');
  console.log('   • public/brand/logo-square-2048.png (Ultra HD)');
  console.log('\n📂 App Icons:');
  console.log('   • public/brand/logo-app-1024.png (App Store ready)');
}

generateLogos().catch(console.error);
