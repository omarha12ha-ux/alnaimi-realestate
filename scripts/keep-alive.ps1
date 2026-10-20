# Keeps the public preview alive.
#
# The tunnel and the server are two separate processes that both die from time
# to time: the Cloudflare edge drops a quick tunnel after a while, and the Node
# server can be killed by an unrelated crash. This loop notices either loss and
# brings it back, then republishes the current public URL.
#
# The public URL changes every time the tunnel is recreated, so the address on
# disk is refreshed here instead of being hardcoded anywhere.

param(
    [string]$ProjectRoot = "C:\Users\DELL\Desktop\alnaimi_realestate_source_code",
    [int]$Port = 3100,
    [string]$LinkFile = "C:\Users\DELL\Desktop\ALNAIMI-LIVE-LINK.txt"
)

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

$toolsDir = Join-Path $env:LOCALAPPDATA "alnaimi"
$cloudflared = Join-Path $toolsDir "cloudflared.exe"
$serverLog = Join-Path $env:TEMP "alnaimi-server.log"
$tunnelLog = Join-Path $env:TEMP "alnaimi-tunnel.log"

function Write-Status($message) {
    $stamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$stamp] $message"
}

function Get-ListeningPid([int]$port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($conn) { return $conn.OwningProcess }
    return $null
}

function Ensure-Cloudflared {
    if (Test-Path $cloudflared) { return $true }
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Write-Status "downloading cloudflared..."
    & curl.exe -sSL --retry 3 --max-time 600 -o $cloudflared $url
    if (Test-Path $cloudflared) {
        Write-Status "cloudflared ready"
        return $true
    }
    Write-Status "cloudflared download failed"
    return $false
}

function Start-Server {
    $existing = Get-ListeningPid $Port
    if ($existing) { return $false }
    Write-Status "starting the production server on port $Port"
    $env:NODE_ENV = "production"
    $env:PORT = "$Port"
    Start-Process -FilePath "node" `
        -ArgumentList "--env-file-if-exists=.env", "dist/server.cjs" `
        -WorkingDirectory $ProjectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $serverLog `
        -RedirectStandardError "$serverLog.err"
    Start-Sleep -Seconds 10
    return $true
}

function Start-Tunnel {
    if (Get-Process cloudflared -ErrorAction SilentlyContinue) { return $false }
    Write-Status "opening a public tunnel"
    if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }
    Start-Process -FilePath $cloudflared `
        -ArgumentList "tunnel", "--url", "http://127.0.0.1:$Port", "--no-autoupdate" `
        -RedirectStandardOutput $tunnelLog `
        -RedirectStandardError "$tunnelLog.err" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 20
    $text = (Get-Content $tunnelLog, "$tunnelLog.err" -ErrorAction SilentlyContinue) -join "`n"
    $match = [regex]::Matches($text, 'https://[a-z0-9\-]+\.trycloudflare\.com')
    if ($match.Count) {
        $url = $match[$match.Count - 1].Value
        Set-Content -Path $LinkFile -Value $url -Encoding ascii
        Write-Status "public URL: $url"
    } else {
        Write-Status "tunnel started, waiting for its URL"
    }
    return $true
}

Write-Host ""
Write-Host "  AlNaimi - LIVE PREVIEW (keep this window open)"
Write-Host "  The server and the public tunnel are restarted automatically"
Write-Host "  if either one stops. The current public address is written to:"
Write-Host "    $LinkFile"
Write-Host ""

if (-not (Ensure-Cloudflared)) {
    Write-Status "cannot continue without cloudflared"
    exit 1
}

Start-Server
Start-Tunnel

while ($true) {
    Start-Sleep -Seconds 20

    if (-not (Get-ListeningPid $Port)) {
        Write-Status "the server is down, restarting it"
        Start-Server
        Start-Tunnel
        continue
    }

    if (-not (Get-Process cloudflared -ErrorAction SilentlyContinue)) {
        Write-Status "the tunnel is down, reopening it"
        Start-Tunnel
    }
}
