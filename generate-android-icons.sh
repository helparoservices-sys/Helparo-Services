#!/bin/bash
# 
# ANDROID ICON GENERATION SCRIPT
# This script should be run AFTER you have a high-quality source icon
#
# REQUIREMENTS:
# - Source icon: 1024×1024px PNG (your app logo on transparent background)
# - ImageMagick installed: https://imagemagick.org/
# - OR use online tool: https://icon.kitchen/
#
# OPTION 1: Use Icon Kitchen (RECOMMENDED)
# ==========================================
# 1. Go to https://icon.kitchen/
# 2. Upload your 1024x1024px logo (transparent background)
# 3. Configure:
#    - Foreground: Your logo (leave padding = 0.2 for safe zone)
#    - Background: #10B981 (emerald green) or solid color
#    - Shape: Circle, Square, Rounded Square (all variants)
# 4. Download the generated package
# 5. Extract to android/app/src/main/res/
#
# OPTION 2: Manual Generation (Using ImageMagick)
# ================================================
# If you have a 1024x1024 source logo, use these commands:

# Navigate to your project
cd "c:/Codes/Helparo services"

# Create a working directory
mkdir -p icon-source

# STEP 1: Place your 1024x1024 source logo here:
# icon-source/logo.png (transparent background)

# STEP 2: Generate foreground layers (with proper sizing)
# The icon should occupy the center 72% (safe zone)

magick icon-source/logo.png -resize 432x432 -gravity center -background none -extent 432x432 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
magick icon-source/logo.png -resize 324x324 -gravity center -background none -extent 324x324 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
magick icon-source/logo.png -resize 216x216 -gravity center -background none -extent 216x216 android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
magick icon-source/logo.png -resize 162x162 -gravity center -background none -extent 162x162 android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
magick icon-source/logo.png -resize 108x108 -gravity center -background none -extent 108x108 android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png

# STEP 3: Generate legacy square icons (with padding)
magick icon-source/logo.png -resize 138x138 -gravity center -background white -extent 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
magick icon-source/logo.png -resize 104x104 -gravity center -background white -extent 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick icon-source/logo.png -resize 69x69 -gravity center -background white -extent 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick icon-source/logo.png -resize 52x52 -gravity center -background white -extent 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick icon-source/logo.png -resize 35x35 -gravity center -background white -extent 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png

# STEP 4: Generate round icons (for launchers that use them)
magick icon-source/logo.png -resize 138x138 -gravity center -background white -extent 192x192 \( +clone -threshold -1 -negate -fill white -draw "circle 96,96 96,0" \) -alpha off -compose copy_opacity -composite android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
magick icon-source/logo.png -resize 104x104 -gravity center -background white -extent 144x144 \( +clone -threshold -1 -negate -fill white -draw "circle 72,72 72,0" \) -alpha off -compose copy_opacity -composite android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
magick icon-source/logo.png -resize 69x69 -gravity center -background white -extent 96x96 \( +clone -threshold -1 -negate -fill white -draw "circle 48,48 48,0" \) -alpha off -compose copy_opacity -composite android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
magick icon-source/logo.png -resize 52x52 -gravity center -background white -extent 72x72 \( +clone -threshold -1 -negate -fill white -draw "circle 36,36 36,0" \) -alpha off -compose copy_opacity -composite android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
magick icon-source/logo.png -resize 35x35 -gravity center -background white -extent 48x48 \( +clone -threshold -1 -negate -fill white -draw "circle 24,24 24,0" \) -alpha off -compose copy_opacity -composite android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

echo "✅ Icons generated successfully!"
echo ""
echo "NEXT STEPS:"
echo "1. Review the generated icons in android/app/src/main/res/mipmap-*"
echo "2. Update ic_launcher_background.xml with your brand color"
echo "3. Build and test on a device"
echo ""
echo "To test: npx cap sync android && npx cap open android"
