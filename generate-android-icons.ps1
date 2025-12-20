# ANDROID ICON GENERATION SCRIPT (PowerShell)
# 
# REQUIREMENTS:
# - Source icon: 1024×1024px PNG (your app logo on transparent background)
# - ImageMagick installed: winget install ImageMagick.ImageMagick
# - OR use online tool: https://icon.kitchen/ (RECOMMENDED)
#
# USAGE:
# 1. Place your 1024x1024px logo at: icon-source/logo.png
# 2. Run: .\generate-android-icons.ps1
#

$ErrorActionPreference = "Stop"

Write-Host "🎨 Android Icon Generator for Helparo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if ImageMagick is installed
$magickPath = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magickPath) {
    Write-Host "❌ ImageMagick not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPTION 1: Install ImageMagick (Windows)" -ForegroundColor Yellow
    Write-Host "  winget install ImageMagick.ImageMagick" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 2: Use Icon Kitchen (RECOMMENDED - No install needed)" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://icon.kitchen/" -ForegroundColor White
    Write-Host "  2. Upload your 1024x1024px logo" -ForegroundColor White
    Write-Host "  3. Set background to #10B981 (emerald green)" -ForegroundColor White
    Write-Host "  4. Download and extract to: android/app/src/main/res/" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if source logo exists
$sourceLogo = "icon-source\logo.png"
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Source logo not found: $sourceLogo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a 1024x1024px PNG logo with transparent background" -ForegroundColor Yellow
    Write-Host "and save it at: $sourceLogo" -ForegroundColor White
    Write-Host ""
    Write-Host "OR use Icon Kitchen online tool (faster): https://icon.kitchen/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Source logo found: $sourceLogo" -ForegroundColor Green

# Verify source logo dimensions
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $sourceLogo).Path)
$width = $img.Width
$height = $img.Height
$img.Dispose()

Write-Host "📐 Source logo dimensions: ${width}x${height}" -ForegroundColor White

if ($width -lt 1024 -or $height -lt 1024) {
    Write-Host "⚠️  WARNING: Logo should be at least 1024x1024px for best quality" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Generating Android icons..." -ForegroundColor Cyan
Write-Host ""

# Define sizes
$sizes = @(
    @{name="mdpi"; foreground=108; legacy=48},
    @{name="hdpi"; foreground=162; legacy=72},
    @{name="xhdpi"; foreground=216; legacy=96},
    @{name="xxhdpi"; foreground=324; legacy=144},
    @{name="xxxhdpi"; foreground=432; legacy=192}
)

$basePath = "android\app\src\main\res"

foreach ($size in $sizes) {
    $density = $size.name
    $fgSize = $size.foreground
    $legacySize = $size.legacy
    $safeZone = [math]::Round($fgSize * 0.666) # 66% of foreground
    
    Write-Host "  Generating $density..." -ForegroundColor White
    
    $mipmapPath = "$basePath\mipmap-$density"
    
    # Generate foreground layer (full size with transparency)
    $fgPath = "$mipmapPath\ic_launcher_foreground.png"
    & magick $sourceLogo -resize "${fgSize}x${fgSize}" -gravity center -background none -extent "${fgSize}x${fgSize}" $fgPath
    
    # Generate legacy square icon (with padding)
    $legacyPath = "$mipmapPath\ic_launcher.png"
    $logoPadded = [math]::Round($legacySize * 0.72) # 72% of legacy size
    & magick $sourceLogo -resize "${logoPadded}x${logoPadded}" -gravity center -background "#10B981" -extent "${legacySize}x${legacySize}" $legacyPath
    
    # Generate round icon (with padding and circular mask)
    $roundPath = "$mipmapPath\ic_launcher_round.png"
    $radius = [math]::Round($legacySize / 2)
    & magick $sourceLogo -resize "${logoPadded}x${logoPadded}" -gravity center -background "#10B981" -extent "${legacySize}x${legacySize}" `
        "(" +clone -threshold -1 -negate -fill white -draw "circle $radius,$radius $radius,0" ")" `
        -alpha off -compose copy_opacity -composite $roundPath
}

Write-Host ""
Write-Host "✅ Icons generated successfully!" -ForegroundColor Green
Write-Host ""

# Verify generated files
Write-Host "📊 Generated Files:" -ForegroundColor Cyan
foreach ($size in $sizes) {
    $density = $size.name
    $mipmapPath = "$basePath\mipmap-$density"
    
    $fgFile = Get-Item "$mipmapPath\ic_launcher_foreground.png"
    $legacyFile = Get-Item "$mipmapPath\ic_launcher.png"
    $roundFile = Get-Item "$mipmapPath\ic_launcher_round.png"
    
    Write-Host "  $density:" -ForegroundColor White
    Write-Host "    Foreground: $($fgFile.Length) bytes" -ForegroundColor Gray
    Write-Host "    Legacy:     $($legacyFile.Length) bytes" -ForegroundColor Gray
    Write-Host "    Round:      $($roundFile.Length) bytes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Review icons in: $basePath\mipmap-*\" -ForegroundColor White
Write-Host "  2. Sync to Android: npx cap sync android" -ForegroundColor White
Write-Host "  3. Open Android Studio: npx cap open android" -ForegroundColor White
Write-Host "  4. Build and test on device" -ForegroundColor White
Write-Host ""
Write-Host "✅ Background color already updated to #10B981 (emerald green)" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Full documentation: ANDROID-ICON-FIX-GUIDE.md" -ForegroundColor White
Write-Host ""
