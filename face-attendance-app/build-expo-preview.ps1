# Build Expo Preview APK
# This script builds using EAS Build (Expo's cloud build service)

Write-Host "Building Expo Preview APK with EAS Build..." -ForegroundColor Green
Write-Host ""

# Clear proxy settings that might interfere
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:http_proxy = $null
$env:https_proxy = $null

# Set EAS to work without Git (if needed)
$env:EAS_NO_VCS = "1"

# Navigate to project directory
Set-Location -Path $PSScriptRoot

Write-Host "Starting EAS Build for Android Preview..." -ForegroundColor Cyan
Write-Host "This will build your app in the cloud and provide a download link." -ForegroundColor Yellow
Write-Host ""

# Run EAS build
eas build --platform android --profile preview --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Build started successfully!" -ForegroundColor Green
    Write-Host "Check your email or EAS dashboard for build progress and download link." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Build command encountered an issue." -ForegroundColor Yellow
    Write-Host "Try running manually: eas build --platform android --profile preview" -ForegroundColor Yellow
}
