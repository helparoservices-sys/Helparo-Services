# ============================================================================
# Database Seed Script
# Run comprehensive seed data for all tables
# ============================================================================

Write-Host "🌱 Seeding Database with Comprehensive Test Data..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (!(Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (!$SUPABASE_URL -or !$SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Error: Supabase credentials not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host "📍 Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# Read the seed SQL file
$seedFile = "supabase\migrations\999_comprehensive_seed_data.sql"
if (!(Test-Path $seedFile)) {
    Write-Host "❌ Error: Seed file not found at $seedFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading seed file..." -ForegroundColor Cyan
$sqlContent = Get-Content $seedFile -Raw

Write-Host "🚀 Executing seed data..." -ForegroundColor Cyan
Write-Host ""

# Execute via Supabase REST API
$headers = @{
    "apikey" = $SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

# Note: This uses psql if available, otherwise provides instructions
try {
    # Check if psql is available
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psqlPath) {
        Write-Host "✅ PostgreSQL client found, executing seed..." -ForegroundColor Green
        
        # Extract database connection string from Supabase URL
        $dbUrl = $SUPABASE_URL -replace "https://([^.]+)\.supabase\.co", "postgresql://postgres:[password]@db.$1.supabase.co:5432/postgres"
        
        Write-Host "⚠️  Please run the following command manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "psql ""$dbUrl"" -f $seedFile" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Replace [password] with your database password from Supabase Dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  PostgreSQL client (psql) not found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Manual Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to Supabase Dashboard > SQL Editor" -ForegroundColor White
        Write-Host "2. Copy the contents of: $seedFile" -ForegroundColor White
        Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
        Write-Host ""
        Write-Host "OR install PostgreSQL client and run:" -ForegroundColor Cyan
        Write-Host "psql ""your-database-url"" -f $seedFile" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Data Summary (to be created):" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✓ 8 Helper Profiles (5 complete, 3 incomplete)" -ForegroundColor White
Write-Host "  ✓ 5 Bank Accounts" -ForegroundColor White
Write-Host "  ✓ 8 Verification Documents" -ForegroundColor White
Write-Host "  ✓ 15 Wallets (10 customers + 5 helpers)" -ForegroundColor White
Write-Host "  ✓ 7 Service Requests (various statuses)" -ForegroundColor White
Write-Host "  ✓ 5 Assignments" -ForegroundColor White
Write-Host "  ✓ 4 Payment Orders" -ForegroundColor White
Write-Host "  ✓ 3 Reviews" -ForegroundColor White
Write-Host "  ✓ 5 Messages" -ForegroundColor White
Write-Host "  ✓ 6 Wallet Transactions" -ForegroundColor White
Write-Host "  ✓ 5 Notifications" -ForegroundColor White
Write-Host "  ✓ 5 Helper Stats" -ForegroundColor White
Write-Host "  ✓ 3 Promo Codes" -ForegroundColor White
Write-Host "  ✓ 1 Active Time Tracking" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "  1. Run the seed data using one of the methods above" -ForegroundColor White
Write-Host "  2. Refresh your app to see all the test data" -ForegroundColor White
Write-Host "  3. Test all features with realistic scenarios" -ForegroundColor White
Write-Host ""
