Place your logo image here so the app can show it on the login page.

Recommended filename: logo.jpg

PowerShell copy command (run from your machine):

Copy-Item "C:\Users\dharm\OneDrive\Pictures\logo.jpg" "d:\Helparo Services\public\logo.jpg"

Notes:
- After copying, restart the dev server if it was running (Next.js sometimes needs a restart to pick up files in `public`).
- The login page will automatically show the logo at `/logo.jpg`. If the image is missing or fails to load, a Sparkles icon fallback will be shown instead.
