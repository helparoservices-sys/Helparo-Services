# Self-Hosted Fonts

This directory contains self-hosted font files to avoid external font loading failures.

## Fonts Included

### Inter
- Variable font supporting weights 100-900
- Latin subset
- Format: WOFF2

### JetBrains Mono
- Variable font supporting weights 100-800
- Latin subset  
- Format: WOFF2

## Download Instructions

If font files are missing, download them from:

**Inter:**
https://github.com/rsms/inter/releases/latest
- Download `Inter-roman.var.woff2` from the release assets

**JetBrains Mono:**
https://github.com/JetBrains/JetBrainsMono/releases/latest
- Download `JetBrainsMono[wght].woff2` from the release assets

Place the downloaded files in this directory:
- `inter-var.woff2`
- `jetbrains-mono-var.woff2`

The fonts are referenced in `src/app/globals.css` using @font-face declarations.
