# Clean Codex sources (gridsnap) and draw them side by side with a ruler, knight v2 first,
# so the eye height (cells from feet to eyes, knight = 23) can be read for each sprite.
# Usage: powershell -ExecutionPolicy Bypass -File ruler.ps1 -Ids a,b,c [-Suffix v3] -Out sheet.png
param([Parameter(Mandatory)][string[]]$Ids, [string]$Suffix = 'v3', [Parameter(Mandatory)][string]$Out)
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path; $d = Join-Path (Split-Path -Parent $here) 'pixellab'
$Ids = $Ids -split ',' | Where-Object { $_ }   # -File passes "a,b,c" as one string
$names = @('knight_v2_game')
foreach ($id in $Ids) { $n = "${id}_$Suffix"; $src = "$d\${n}_src.png"
  if (-not (Test-Path $src)) { Write-Output "$id : no source"; continue }
  if (-not (Test-Path "$d\$n.png")) { $r = powershell -NoProfile -ExecutionPolicy Bypass -File "$here\gridsnap.ps1" -Src $src -Out "$d\$n.png"; Write-Output ("$id : " + (($r | Select-String 'pitch \d|sprite') -join ' | ')) }
  $names += $n }
$z = 6; $c = 66; $per = 6; $rh = 70; $rowsN = [int][math]::Ceiling($names.Count / $per)
$sheet = New-Object System.Drawing.Bitmap ($per * $c * $z), ($rowsN * $rh * $z); $g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(58, 125, 68)); $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
$f = New-Object System.Drawing.Font 'Arial', 12; $fs = New-Object System.Drawing.Font 'Arial', 9
for ($i = 0; $i -lt $names.Count; $i++) { $im = New-Object System.Drawing.Bitmap "$d\$($names[$i]).png"; $cx = $i % $per; $cy = [int][math]::Floor($i / $per); $base = $cy * $rh + $rh - 2
  $bot = 0; for ($y = $im.Height - 1; $y -ge 0 -and $bot -eq 0; $y--) { for ($x = 0; $x -lt $im.Width; $x++) { if ($im.GetPixel($x, $y).A -gt 0) { $bot = $y + 1; break } } }
  $g.DrawImage($im, ($cx * $c + 8 + [int](($c - 8 - $im.Width) / 2)) * $z, ($base - $bot) * $z, $im.Width * $z, $im.Height * $z)
  for ($k = 15; $k -le 60; $k += 5) { $yy = ($base - $k) * $z; $a = if ($k % 10 -eq 0) { 150 } else { 70 }
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($a, 255, 255, 255)), 1; $g.DrawLine($pen, $cx * $c * $z, $yy, ($cx + 1) * $c * $z - 6, $yy)
    if ($k % 10 -eq 0) { $g.DrawString("$k", $fs, [System.Drawing.Brushes]::White, $cx * $c * $z, $yy - 14) } }
  $g.DrawString(($names[$i] -replace '_game', ''), $f, [System.Drawing.Brushes]::Yellow, $cx * $c * $z + 30, $cy * $rh * $z + 2); $im.Dispose() }
$sheet.Save($Out); $g.Dispose(); $sheet.Dispose()
