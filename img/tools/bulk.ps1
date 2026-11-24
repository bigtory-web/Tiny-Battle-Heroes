# Even out how big heroes look in game by also matching their area (bulk), not only eye height.
# The game draws every hero canvas at the same size, so a bigger canvas = a smaller hero on screen.
#   eye side  = the canvas size already chosen from feet-to-eye height (current canvas width)
#   area side = 64 * sqrt(opaque pixels / knight opaque pixels)   (knight v2 on a 64 canvas = 1393)
#   new side  = geometric mean of the two, so both height and bulk move halfway toward the knight
# Usage: powershell -ExecutionPolicy Bypass -File bulk.ps1 -Ids a,b,c [-Dir img\p] [-WhatIf]
param([Parameter(Mandatory)][string[]]$Ids, [string]$Dir = '', [switch]$WhatIf)
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Dir) { $Dir = Join-Path (Split-Path -Parent $here) 'p' }
$Ids = $Ids -split ',' | Where-Object { $_ }
$KNIGHT_AREA = 1393.0
foreach ($id in $Ids) {
  $f = Join-Path $Dir "$id.png"; if (-not (Test-Path $f)) { Write-Output "$id : missing"; continue }
  $b = New-Object System.Drawing.Bitmap $f; $area = 0; $mw = 0; $mh = 0; $x0 = $b.Width; $y0 = $b.Height; $x1 = -1; $y1 = -1
  for ($y = 0; $y -lt $b.Height; $y++) { for ($x = 0; $x -lt $b.Width; $x++) { if ($b.GetPixel($x, $y).A -gt 0) { $area++
    if ($x -lt $x0) { $x0 = $x }; if ($x -gt $x1) { $x1 = $x }; if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y } } } }
  $cur = $b.Width; $b.Dispose()
  $sideArea = 64.0 * [math]::Sqrt($area / $KNIGHT_AREA)
  $new = [int][math]::Round([math]::Sqrt($cur * $sideArea))
  $new = [math]::Max($new, [math]::Max($x1 - $x0 + 1, $y1 - $y0 + 1))   # never smaller than the picture itself
  $line = "{0} : area {1}, canvas {2} -> {3}" -f $id, $area, $cur, $new
  if (-not $WhatIf -and $new -ne $cur) {
    powershell -NoProfile -ExecutionPolicy Bypass -File "$here\place.ps1" -Src $f -Out $f -Side $new | Out-Null
    $atk = Join-Path $Dir "${id}_atk.png"; if (Test-Path $atk) { Copy-Item $f $atk -Force; $line += ' (+atk)' } }
  Write-Output $line
}
