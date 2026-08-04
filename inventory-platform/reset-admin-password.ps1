$ErrorActionPreference = "Stop"

$inventoryRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$environmentPath = Join-Path $inventoryRoot "apps\inventory-management\.env.local"
$adminEmail = "personal.buildanta@gmail.com"

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

if (-not (Test-Path -LiteralPath $environmentPath)) {
  throw "The local inventory environment is not configured."
}

$environment = @{}
Get-Content -LiteralPath $environmentPath | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') {
    $environment[$matches[1].Trim()] = $matches[2].Trim().Trim('"')
  }
}

$supabaseUrl = $environment["SUPABASE_URL"]
$supabaseSecretKey = $environment["SUPABASE_SECRET_KEY"]
if (-not $supabaseUrl -or -not $supabaseSecretKey) {
  throw "The server-only Supabase configuration is missing."
}

$newPassword = Read-PrivateValue "Enter a NEW password (at least 8 characters)"
$confirmedPassword = Read-PrivateValue "Enter the NEW password again"

try {
  if ($newPassword.Length -lt 8) {
    throw "The new password must contain at least 8 characters."
  }
  if ($newPassword -ne $confirmedPassword) {
    throw "The two passwords do not match."
  }

  $headers = @{
    apikey = $supabaseSecretKey
    Authorization = "Bearer $supabaseSecretKey"
    "User-Agent" = "BuildantaInventoryServer/1.0"
  }

  $usersResponse = Invoke-RestMethod `
    -Method Get `
    -Uri "$supabaseUrl/auth/v1/admin/users?page=1&per_page=100" `
    -Headers $headers

  $account = @($usersResponse.users | Where-Object { $_.email -eq $adminEmail }) | Select-Object -First 1
  if (-not $account) {
    throw "No Buildanta admin account was found for $adminEmail."
  }

  $body = @{
    password = $newPassword
    email_confirm = $true
  } | ConvertTo-Json -Compress

  Invoke-RestMethod `
    -Method Put `
    -Uri "$supabaseUrl/auth/v1/admin/users/$($account.id)" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body | Out-Null

  Write-Host ""
  Write-Host "Password updated successfully." -ForegroundColor Green
  Write-Host "You can now sign in at http://localhost:3002/login"
}
finally {
  $newPassword = $null
  $confirmedPassword = $null
  $supabaseSecretKey = $null
  $headers = $null
  $body = $null
}
