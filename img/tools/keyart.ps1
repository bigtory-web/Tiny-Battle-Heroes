# Title key art: battle background + confirmed logo + a crowd of in-game heroes below it.
# Everything is drawn at 2x (heroes: each canvas scaled like the game does, same box for all).
# Usage: powershell -ExecutionPolicy Bypass -File keyart.ps1 -Out img\pixellab\keyart_v1.png
param([string]$Out = 'img\pixellab\keyart_v1.png', [int]$Seed = 7)
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$K = 2; $W = 720 * $K; $H = 402 * $K; $UNIT = 64 * $K * 1.15
$bmp = New-Object System.Drawing.Bitmap $W, $H; $g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
$bg = [System.Drawing.Image]::FromFile("$root\img\p\bg_field.png"); $g.DrawImage($bg, 0, 0, $W, $H); $bg.Dispose()
# hero rows: back (small, high) to front; ids picked so colours mix; right half faces left (toward the middle)
$rows = @(
  @{ y = 560; n = 11; s = 0.85; ids = 'owl','harpy','candle','gargoyle','druid','pegasus','succubus','coral','vine','icefairy','tiger' },
  @{ y = 635; n = 10; s = 0.95; ids = 'necro','spark','fox','minotaur','frost','archmage','lion','batling','storm','valkyrie' },
  @{ y = 712; n = 9;  s = 1.05; ids = 'bear','dancer','blades','dragon','knight','phoenix','nun','frog','wolf' },
  @{ y = 792; n = 8;  s = 1.15; ids = 'pup','shield','song','seraph','windlord','kraken','horn','sprout' }
)
$rnd = New-Object System.Random $Seed
foreach ($r in $rows) { $ids = $r.ids; $n = $ids.Count; $step = ($W - 80) / $n
  for ($i = 0; $i -lt $n; $i++) { $id = $ids[$i]; $f = "$root\img\p\$id.png"; if (-not (Test-Path $f)) { continue }
    $im = New-Object System.Drawing.Bitmap $f; $box = $UNIT * $r.s
    $cx = 40 + $step * ($i + 0.5) + $rnd.Next(-10, 11); $fy = $r.y + $rnd.Next(-6, 7)
    if ($cx -gt $W / 2) { $im.RotateFlip('RotateNoneFlipX') }   # right side looks toward the middle
    $g.DrawImage($im, [single]($cx - $box / 2), [single]($fy - $box), [single]$box, [single]$box); $im.Dispose() } }
# logo on top, 3x, centred in the sky
$lg = [System.Drawing.Image]::FromFile("$root\img\pixellab\title_v4_crop.png"); $L = 3
$g.DrawImage($lg, [int](($W - $lg.Width * $L) / 2), 40, $lg.Width * $L, $lg.Height * $L); $lg.Dispose()
$g.Dispose(); $bmp.Save((Join-Path $root $Out)); $bmp.Dispose()
