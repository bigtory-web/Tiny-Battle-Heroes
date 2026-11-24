# Put a cleaned sprite on the shared game canvas: feet on the bottom row, feet centered left-right.
# (Centering the whole picture pushes the body sideways when a staff or wing sticks out on one side.)
# Every new-style hero must use the same -Side so the game draws them all at the same pixel size.
# Usage: powershell -ExecutionPolicy Bypass -File place.ps1 -Src a.png -Out img\p\a.png [-Side 64]
param([Parameter(Mandatory)][string]$Src, [Parameter(Mandatory)][string]$Out, [int]$Side = 64)
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap $Src
$x0 = $bmp.Width; $y0 = $bmp.Height; $x1 = -1; $y1 = -1
for ($y = 0; $y -lt $bmp.Height; $y++) { for ($x = 0; $x -lt $bmp.Width; $x++) { if ($bmp.GetPixel($x, $y).A -gt 0) {
  if ($x -lt $x0) { $x0 = $x }; if ($x -gt $x1) { $x1 = $x }; if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y } } } }
if ($x1 -lt 0) { $bmp.Dispose(); throw "empty image: $Src" }
$w = $x1 - $x0 + 1; $h = $y1 - $y0 + 1
if ($w -gt $Side -or $h -gt $Side) { $bmp.Dispose(); throw "sprite ${w}x${h} does not fit a ${Side} canvas: $Src" }
# feet = opaque pixels in the bottom 3 rows
$fa = $x1; $fb = $x0
for ($y = $y1 - 2; $y -le $y1; $y++) { for ($x = $x0; $x -le $x1; $x++) { if ($bmp.GetPixel($x, $y).A -gt 0) { if ($x -lt $fa) { $fa = $x }; if ($x -gt $fb) { $fb = $x } } } }
$feet = ($fa + $fb) / 2.0
$dx = [int][math]::Round($Side / 2.0 - 0.5 - $feet)               # feet center -> canvas center
$dx = [math]::Max(-$x0, [math]::Min($Side - 1 - $x1, $dx))        # but never cut the picture off
$dy = $Side - 1 - $y1
$res = New-Object System.Drawing.Bitmap $Side, $Side
for ($y = $y0; $y -le $y1; $y++) { for ($x = $x0; $x -le $x1; $x++) { $px = $bmp.GetPixel($x, $y); if ($px.A -gt 0) { $res.SetPixel($x + $dx, $y + $dy, $px) } } }
$bmp.Dispose(); $res.Save($Out); $res.Dispose()
Write-Output ("{0}x{1}, feet center moved to {2}, picture spans {3}..{4} of {5}" -f $w, $h, ($feet + $dx), ($x0 + $dx), ($x1 + $dx), $Side)
