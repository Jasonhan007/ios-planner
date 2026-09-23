# 一键发布：把本文件夹内容推到 GitHub 并触发 Pages
# 用法：在「计划表」目录打开 PowerShell，执行  .\publish.ps1
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  $credFile = Join-Path $dir '.github-token'
  if (Test-Path $credFile) { $token = (Get-Content $credFile -Raw).Trim() }
}
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host '未找到 Token。请设置环境变量 GITHUB_TOKEN，或在本目录创建 .github-token 文件（仅本机，已 gitignore）。' -ForegroundColor Yellow
  exit 1
}

$owner = 'Jasonhan007'
$repo = 'ios-planner'
$headers = @{
  Authorization  = "Bearer $token"
  Accept         = 'application/vnd.github+json'
  'User-Agent'   = 'ios-planner-publish'
}
$base = "https://api.github.com/repos/$owner/$repo/contents"

$files = @('index.html', 'styles.css', 'app.js', '.gitignore')
$msg = 'update: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

foreach ($f in $files) {
  $full = Join-Path $dir $f
  if (-not (Test-Path $full)) { continue }
  $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($full))

  # 先取 SHA 以便更新
  $sha = $null
  try {
    $meta = Invoke-RestMethod -Uri "$base/$f" -Headers $headers
    $sha = $meta.sha
  } catch { }

  $payload = @{ message = $msg; content = $b64; branch = 'main' }
  if ($sha) { $payload.sha = $sha }
  $body = $payload | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/$f" -Method Put -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
  Write-Host "uploaded $f" -ForegroundColor Green
}

Write-Host ''
Write-Host "发布完成：https://jasonhan007.github.io/ios-planner/" -ForegroundColor Cyan
Write-Host '（Pages 缓存约 1 分钟内生效）'
