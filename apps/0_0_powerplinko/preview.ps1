# preview.ps1 - Build & serve the Power Plinko Storybook reliably on Windows.
#
#   Run it DIRECTLY (do NOT use `pnpm run` - corepack pins pnpm 10.5.0 and aborts):
#       cd web-sdk\apps\0_0_powerplinko
#       .\preview.ps1
#   Then open  http://localhost:6010   (Ctrl+C to stop)
#
# Why this script exists (the things that used to make Storybook "stick on loading"):
#   1. Workspace packages export ./dist and must be built first (else: "Failed to
#      resolve entry for package pixi-svelte"). Built once with turbo - see check below.
#   2. The app's npm `storybook` script uses Unix inline-env syntax that cmd/PowerShell
#      can't parse, so we call the local binary directly and set the env var here.
#   3. `storybook dev` compiles on-demand and TIMES OUT on first load on Windows. So we
#      build a STATIC Storybook (everything pre-compiled) and serve it with python -
#      static files never "time out loading".
#   4. `storybook build` does not exit after finishing (a known hang). We watch its log
#      for completion, then kill it + any orphaned storybook node procs (which otherwise
#      pile up and eat RAM/CPU).
#   NOTE: do NOT accept Storybook's "upgrade to v10" prompt - this workspace is pinned to
#   v9.0.15; upgrading just this app re-breaks the preview.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$port = 6010
$env:PUBLIC_CHROMATIC = "true"

# 0) precondition: workspace packages must be built (they export ./dist)
if (-not (Test-Path "..\..\packages\pixi-svelte\dist")) {
  Write-Host "Workspace packages aren't built yet. Run this ONCE from web-sdk, then re-run preview.ps1:" -ForegroundColor Yellow
  Write-Host '  pnpm --pm-on-fail=ignore exec turbo run build --filter="./packages/*"' -ForegroundColor Yellow
  exit 1
}

# 1) build the static Storybook in a job so we can watch for completion
Write-Host "Building static Storybook (~2-3 min)..." -ForegroundColor Cyan
$job = Start-Job -ScriptBlock {
  Set-Location $using:PSScriptRoot
  $env:PUBLIC_CHROMATIC = "true"
  & ".\node_modules\.bin\storybook.CMD" build -o storybook-static 2>&1
}
$failed = $false
for ($i = 0; $i -lt 150; $i++) {
  Start-Sleep -Seconds 2
  $o = Receive-Job $job -Keep | Out-String
  if ($o -match "built in") { break }
  if ($o -match "Build failed|error during build") { $failed = $true; break }
  if ($job.State -ne "Running") { break }
}
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue

# 2) kill the hung storybook build process + any orphaned storybook node children
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*storybook*' } |
  ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }

if ($failed -or -not (Test-Path "storybook-static\index.html")) {
  Write-Error "Storybook build did not complete (no storybook-static\index.html). Aborting."
  exit 1
}

# 3) serve the pre-built static site (no on-demand compile -> never times out)
Write-Host "Build complete. Serving http://localhost:$port  -  Ctrl+C to stop." -ForegroundColor Green
python -m http.server $port --directory storybook-static
