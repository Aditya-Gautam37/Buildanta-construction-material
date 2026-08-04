$ErrorActionPreference = "Stop"

$projectRef = "yodbawxefjwkxlclgcnr"
$projectUrl = "https://yodbawxefjwkxlclgcnr.supabase.co"
$poolerHost = "aws-1-ap-south-1.pooler.supabase.com"
$publishableKey = "sb_publishable_beK-oGFJvlks1PA43a4vjg_VwJ1bWrH"
$inventoryRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupStamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Read-PrivateValue {
  param([Parameter(Mandatory = $true)][string]$Prompt)

  $secureValue = Read-Host $Prompt -AsSecureString
  $valuePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($valuePointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($valuePointer)
  }
}

function Save-EnvironmentFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  if (Test-Path -LiteralPath $Path) {
    Copy-Item -LiteralPath $Path -Destination "$Path.backup-$backupStamp"
  }

  $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($Path, $Content.TrimStart(), $utf8WithoutBom)
}

$databasePassword = Read-PrivateValue "Enter the Supabase database password"
if ([string]::IsNullOrWhiteSpace($databasePassword)) {
  throw "Database password cannot be empty."
}

$supabaseSecretKey = Read-PrivateValue "Enter the NEW Supabase secret key"
if ([string]::IsNullOrWhiteSpace($supabaseSecretKey)) {
  throw "Supabase secret key cannot be empty."
}

try {
  $encodedDatabasePassword = [Uri]::EscapeDataString($databasePassword)
  $databaseUrl = "postgresql://postgres.${projectRef}:${encodedDatabasePassword}@${poolerHost}:6543/postgres?pgbouncer=true"
  $directUrl = "postgresql://postgres.${projectRef}:${encodedDatabasePassword}@${poolerHost}:5432/postgres"

  $webEnvironment = @"
DATABASE_URL="$databaseUrl"
DIRECT_URL="$directUrl"

NEXT_PUBLIC_API_URL=http://localhost:5173
NEXT_PUBLIC_SUPABASE_URL=$projectUrl
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$publishableKey
NEXT_PUBLIC_ASSET_HOSTS=

SUPABASE_URL=$projectUrl
SUPABASE_PUBLISHABLE_KEY=$publishableKey
SUPABASE_SECRET_KEY="$supabaseSecretKey"

ADMIN_EMAIL_ALLOWLIST=personal.buildanta@gmail.com
DATA_ENTRY_EMAIL_ALLOWLIST=
SUPABASE_PRODUCT_IMAGES_BUCKET=ProductPhotos
SUPABASE_BRAND_LOGOS_BUCKET=BrandLogos
MAX_UPLOAD_BYTES=5242880
"@

  $apiEnvironment = @"
DATABASE_URL="$databaseUrl"
DIRECT_URL="$directUrl"

SUPABASE_URL=$projectUrl
SUPABASE_PUBLISHABLE_KEY=$publishableKey

PORT=5173
CORS_ORIGINS=http://localhost:3002
"@

  $databaseEnvironment = @"
DATABASE_URL="$databaseUrl"
DIRECT_URL="$directUrl"
"@

  Save-EnvironmentFile -Path (Join-Path $inventoryRoot "apps\inventory-management\.env.local") -Content $webEnvironment
  Save-EnvironmentFile -Path (Join-Path $inventoryRoot "apps\nest-api\.env") -Content $apiEnvironment
  Save-EnvironmentFile -Path (Join-Path $inventoryRoot "packages\database\.env") -Content $databaseEnvironment

  Write-Host ""
  Write-Host "Local Buildanta configuration is ready." -ForegroundColor Green
  Write-Host "Old environment files were backed up with suffix: .backup-$backupStamp"
  Write-Host "Next run: pnpm.cmd db:generate, then pnpm.cmd db:deploy"
}
finally {
  $databasePassword = $null
  $supabaseSecretKey = $null
  $encodedDatabasePassword = $null
}
