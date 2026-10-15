# ==============================================================================
# SUPER EAGLES AMMS - NATIONWIDE MOBILE REMOTE ACCESS TUNNEL LAUNCHER
# Free, zero-cost, zero-configuration Cloudflare tunnel for remote athletes.
# Runs on any Windows PC without modifying router settings or paying cloud fees.
# ==============================================================================

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CloudflaredPath = Join-Path $ScriptDir "cloudflared.exe"

Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "   SUPER EAGLES ATHLETICS MANAGEMENT SYSTEM (AMMS)" -ForegroundColor Yellow
Write-Host "   NATIONWIDE MOBILE ACCESS LAUNCHER (Cloudflare Secure Tunnel)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Green

# 1. Check if cloudflared exists, download if needed
if (-not (Test-Path $CloudflaredPath)) {
    # Check if in PATH
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) {
        $CloudflaredPath = $cmd.Source
    } else {
        Write-Host "[1/3] Downloading free portable Cloudflare Tunnel utility (one-time setup)..." -ForegroundColor Yellow
        $DownloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $CloudflaredPath -UseBasicParsing
            Write-Host "[✓] Download complete: $CloudflaredPath" -ForegroundColor Green
        } catch {
            Write-Host "[!] Automatic download failed: $_" -ForegroundColor Red
            Write-Host "    You can manually place cloudflared.exe inside the scripts/ folder." -ForegroundColor Yellow
        }
    }
}

if (-not (Test-Path $CloudflaredPath)) {
    Write-Host "[X] Could not locate cloudflared.exe. Please ensure you have internet access." -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] Verifying AMMS application is running on http://localhost:3000..." -ForegroundColor Cyan
try {
    $testReq = Invoke-WebRequest -Uri "http://localhost:3000/api/network-info" -UseBasicParsing -TimeoutSec 3
    Write-Host "[✓] Local AMMS application detected online." -ForegroundColor Green
} catch {
    Write-Host "[!] Notice: Local server on port 3000 not answering yet." -ForegroundColor Yellow
    Write-Host "    Ensure you have started the application with 'npm run dev' or 'npm start'." -ForegroundColor Yellow
}

Write-Host "[3/3] Establishing encrypted nationwide tunnel to Cloudflare Edge..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "Starting tunnel on port 3000... Look for the 'trycloudflare.com' link below:" -ForegroundColor White
Write-Host "---------------------------------------------------------------------" -ForegroundColor Gray

# Run cloudflared and stream output
& "$CloudflaredPath" tunnel --url http://localhost:3000
