# 픽셀 그림 후처리 도구 (코덱스 원본 1024 그림 -> 게임용 픽셀 그림)
# 사용 예:
#   powershell -ExecutionPolicy Bypass -File pixfix.ps1 -Src "...\px2\thorn.png" -Out "...\p\thorn.png" -Kind hero
#   -Kind hero  : 36x36, 발을 맨 아래 줄에 맞춤, 공용 팔레트로 색 맞춤
#   -Kind icon  : 24x24
#   -Kind mark  : 12x12
#   -Kind hud   : 16x16
#   -Palette    : 팔레트 txt 경로(한 줄에 #RRGGBB). 주면 그 색으로만 맞춰요. hero는 기본으로 같은 폴더의 palette.txt를 써요.
#   -Sheet      : 폴더 경로를 주면 그 안의 영웅 그림을 한 장에 모아 보여 줘요 (-Out에 저장)
param(
  [string]$Src,
  [string]$Out,
  [ValidateSet('hero','icon','mark','hud','sheet')][string]$Kind = 'hero',
  [string]$Palette = '',
  [string]$Sheet = ''
)
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Load-Palette($path) {
  if (-not $path -or -not (Test-Path -LiteralPath $path)) { return $null }
  $list = @()
  foreach ($line in [System.IO.File]::ReadAllLines($path)) { $t = $line.Trim(); if ($t -match '^#?[0-9a-fA-F]{6}') { $list += [System.Drawing.ColorTranslator]::FromHtml('#' + $t.TrimStart('#').Substring(0,6)) } }
  return ,$list
}
function Nearest($c, $pal) {
  $best = $pal[0]; $bd = [double]::MaxValue
  foreach ($p in $pal) { $dr = $c.R - $p.R; $dg = $c.G - $p.G; $db = $c.B - $p.B; $d = 2*$dr*$dr + 4*$dg*$dg + 3*$db*$db; if ($d -lt $bd) { $bd = $d; $best = $p } }
  return $best
}
function Snap($srcPath, $n) {
  $im = [System.Drawing.Image]::FromFile($srcPath)
  $bm = New-Object System.Drawing.Bitmap $n, $n; $g = [System.Drawing.Graphics]::FromImage($bm)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($im, 0, 0, $n, $n); $g.Dispose(); $im.Dispose()
  for ($y = 0; $y -lt $n; $y++) { for ($x = 0; $x -lt $n; $x++) { $c = $bm.GetPixel($x, $y)
    if ($c.A -lt 128) { $bm.SetPixel($x, $y, [System.Drawing.Color]::Transparent) } elseif ($c.A -lt 255) { $bm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B)) } } }
  return $bm
}
function FloorAlign($bm) {
  $n = $bm.Width; $bot = -1
  for ($y = 0; $y -lt $n; $y++) { for ($x = 0; $x -lt $n; $x++) { if ($bm.GetPixel($x, $y).A -gt 128) { $bot = $y; break } } }
  $s = ($n - 1) - $bot; if ($bot -lt 0 -or $s -le 0) { return $bm }
  $o = New-Object System.Drawing.Bitmap $n, $n
  for ($y = 0; $y -lt $n - $s; $y++) { for ($x = 0; $x -lt $n; $x++) { $o.SetPixel($x, $y + $s, $bm.GetPixel($x, $y)) } }
  $bm.Dispose(); return $o
}
function Quantize($bm, $pal) {
  if (-not $pal) { return }
  for ($y = 0; $y -lt $bm.Height; $y++) { for ($x = 0; $x -lt $bm.Width; $x++) { $c = $bm.GetPixel($x, $y); if ($c.A -gt 0) { $bm.SetPixel($x, $y, (Nearest $c $pal)) } } }
}

if ($Kind -eq 'sheet') {
  $files = Get-ChildItem -LiteralPath $Sheet -Filter *.png | Where-Object { $_.BaseName -notmatch '^(ult_|skill_|hud_|ev_|mark_|ui_|bg_|rip)' -and $_.BaseName -notmatch '_v\d|_65|_' }
  $cols = 8; $cell = 112; $rows = [math]::Ceiling($files.Count / $cols)
  $sh = New-Object System.Drawing.Bitmap ($cols * $cell), ($rows * ($cell + 18)); $gs = [System.Drawing.Graphics]::FromImage($sh)
  $gs.Clear([System.Drawing.Color]::FromArgb(60,70,60))
  $gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor; $gs.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $font = New-Object System.Drawing.Font 'Arial', 9; $i = 0
  foreach ($f in $files) { $p = [System.Drawing.Image]::FromFile($f.FullName); $x = ($i % $cols) * $cell; $y = [math]::Floor($i / $cols) * ($cell + 18)
    $gs.DrawImage($p, $x + 2, $y, 108, 108); $gs.DrawString($f.BaseName, $font, [System.Drawing.Brushes]::White, $x + 4, $y + 108); $p.Dispose(); $i++ }
  $sh.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $gs.Dispose(); $sh.Dispose()
  "sheet: $($files.Count) -> $Out"; return
}

$size = @{ hero = 36; icon = 24; mark = 12; hud = 16 }[$Kind]
$bm = Snap $Src $size
if ($Kind -eq 'hero') {
  $bm = FloorAlign $bm
  if (-not $Palette) { $Palette = Join-Path $here 'palette.txt' }
}
$pal = Load-Palette $Palette
Quantize $bm $pal
$bm.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bm.Dispose()
"$Kind ${size}x${size}" + $(if ($pal) { " palette $($pal.Count)" } else { '' }) + " -> $Out"
