# Icon Generation Script for Helparo Android App
# Run this after creating your 1024x1024 source icon

# You need ImageMagick installed: https://imagemagick.org/
# Or use Android Studio's Image Asset Studio (recommended)

# Icon sizes needed for Android
$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$sourceIcon = "icon-1024.png"  # Your source icon (1024x1024)
$outputDir = "android\app\src\main\res"

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $outPath = Join-Path $outputDir $folder
    
    if (!(Test-Path $outPath)) {
        New-Item -ItemType Directory -Path $outPath -Force
    }
    
    Write-Host "Generating $size x $size icon for $folder"
    
    # Using ImageMagick
    # magick convert $sourceIcon -resize ${size}x${size} "$outPath\ic_launcher.png"
    # magick convert $sourceIcon -resize ${size}x${size} "$outPath\ic_launcher_round.png"
    # magick convert $sourceIcon -resize ${size}x${size} "$outPath\ic_launcher_foreground.png"
}

# Splash screen icon (centered on splash screen)
$splashSizes = @{
    "mipmap-mdpi" = 128
    "mipmap-hdpi" = 192
    "mipmap-xhdpi" = 256
    "mipmap-xxhdpi" = 384
    "mipmap-xxxhdpi" = 512
}

Write-Host ""
Write-Host "RECOMMENDED: Use Android Studio's Image Asset Studio instead!"
Write-Host "1. Open Android Studio"
Write-Host "2. Right-click on 'res' folder"
Write-Host "3. Select 'New > Image Asset'"
Write-Host "4. Choose your 1024x1024 icon"
Write-Host "5. It will generate all sizes automatically"
