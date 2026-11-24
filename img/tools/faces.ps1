# Find where each hero's face is, so small icons (left roster) can zoom onto the face.
# Face = centroid of skin-coloured pixels in the upper part of the figure;
# no skin (animals, golems, masks) -> centre of the upper body block.
# Usage: powershell -ExecutionPolicy Bypass -File faces.ps1 -Ids a,b [-Dir img\p] [-Sheet out.png]
# Prints a JS object: id:[faceX/side, faceY/side, side]
param([Parameter(Mandatory)][string[]]$Ids, [string]$Dir = '', [string]$Sheet = '', [hashtable]$Fix = @{})
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Dir) { $Dir = Join-Path (Split-Path -Parent $here) 'p' }
$Ids = $Ids -split ',' | Where-Object { $_ }
$out = @(); $res = @{}
foreach ($id in $Ids) {
  $f = Join-Path $Dir "$id.png"; if (-not (Test-Path $f)) { continue }
  $b = New-Object System.Drawing.Bitmap $f; $W = $b.Width; $Hh = $b.Height
  $y0 = $Hh; $y1 = -1
  for ($y = 0; $y -lt $Hh; $y++) { for ($x = 0; $x -lt $W; $x++) { if ($b.GetPixel($x, $y).A -gt 0) { if ($y -lt $y0) { $y0 = $y }; $y1 = $y } } }
  $hgt = $y1 - $y0 + 1; $lim = $y0 + [int]($hgt * 0.6)
  # light skin only (hair/fur are darker or more orange), then the biggest connected blob = the face (not hands)
  $sk = New-Object 'bool[,]' $W, $Hh
  for ($y = $y0; $y -lt $lim; $y++) { for ($x = 0; $x -lt $W; $x++) { $c = $b.GetPixel($x, $y)
    if ($c.A -gt 0 -and $c.R -gt 185 -and $c.G -gt 125 -and $c.B -gt 85 -and $c.R -ge $c.G -and $c.G -gt $c.B -and ($c.R - $c.B) -ge 35 -and ($c.R - $c.B) -le 125 -and ($c.G - $c.B) -ge 12) { $sk[$x, $y] = $true } } }
  $seen = New-Object 'int[,]' $W, $Hh; $best = $null; $lab = 0
  for ($y = $y0; $y -lt $lim; $y++) { for ($x = 0; $x -lt $W; $x++) { if (-not $sk[$x, $y] -or $seen[$x, $y]) { continue }
    $lab++; $q = New-Object System.Collections.Generic.Queue[int]; $q.Enqueue($y * $W + $x); $seen[$x, $y] = $lab; $cnt = 0; $ax0 = $x; $ax1 = $x; $ay0 = $y; $ay1 = $y
    while ($q.Count) { $v = $q.Dequeue(); $px = $v % $W; $py = [math]::Floor($v / $W); $cnt++
      if ($px -lt $ax0) { $ax0 = $px }; if ($px -gt $ax1) { $ax1 = $px }; if ($py -lt $ay0) { $ay0 = $py }; if ($py -gt $ay1) { $ay1 = $py }
      foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $px + $d[0]; $ny = $py + $d[1]
        if ($nx -ge 0 -and $ny -ge 0 -and $nx -lt $W -and $ny -lt $Hh -and $sk[$nx, $ny] -and -not $seen[$nx, $ny]) { $seen[$nx, $ny] = $lab; $q.Enqueue($ny * $W + $nx) } } }
    # eyes = non-skin pixels with this blob on both sides in the same row; a face has them, a hand does not
    $holes = 0; for ($ry = $ay0; $ry -le $ay1; $ry++) { $l = -1; $gap = 0
      for ($rx = $ax0; $rx -le $ax1; $rx++) { if ($seen[$rx, $ry] -eq $lab) { if ($l -ge 0) { $holes += $gap }; $l = $rx; $gap = 0 } elseif ($l -ge 0) { $gap++ } } }
    $score = $cnt + 4 * $holes
    if ($cnt -ge 10 -and (-not $best -or $score -gt $best[5])) { $best = @($cnt, $ax0, $ax1, $ay0, $ay1, $score) } } }
  $n = if ($best) { $best[0] } else { 0 }
  if ($n -ge 10) { $fx = ($best[1] + $best[2] + 1) / 2; $fy = ($best[3] + $best[4] + 1) / 2; $how = "face $n" }
  else { $lim2 = $y0 + [int]($hgt * 0.45); $sx = 0; $n = 0
    for ($y = $y0; $y -lt $lim2; $y++) { for ($x = 0; $x -lt $W; $x++) { if ($b.GetPixel($x, $y).A -gt 0) { $sx += $x; $n++ } } }
    $fx = $sx / [math]::Max($n, 1); $fy = $y0 + $hgt * 0.3; $how = 'shape' }
  if ($Fix.ContainsKey($id)) { $fx += $Fix[$id][0]; $fy += $Fix[$id][1]; $how += ' +fix' }
  $b.Dispose()
  $res[$id] = @($fx, $fy, $W)
  $out += ('{0}:[{1:0.###},{2:0.###},{3}]' -f $id, ($fx / $W), ($fy / $W), $W)
  Write-Host "$id $how"
}
Write-Output ('{' + ($out -join ',') + '}')
if ($Sheet) { # preview: each icon as the game shows it (56px box, 190% at a 64 canvas)
  $B = 56; $cols = 11; $rows = [math]::Ceiling($Ids.Count / $cols)
  $bmp = New-Object System.Drawing.Bitmap ($cols * ($B + 4)), ($rows * ($B + 4)); $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'; $g.Clear([System.Drawing.Color]::FromArgb(59, 37, 20)); $i = 0
  foreach ($id in $Ids) { if (-not $res.ContainsKey($id)) { continue }; $r = $res[$id]; $im = [System.Drawing.Image]::FromFile((Join-Path $Dir "$id.png"))
    $S = $B * 1.9 * $r[2] / 64; $k = $S / $r[2]; $cx = ($i % $cols) * ($B + 4) + 2; $cy = [math]::Floor($i / $cols) * ($B + 4) + 2
    $g.SetClip((New-Object System.Drawing.Rectangle $cx, $cy, $B, $B))
    $g.DrawImage($im, [single]($cx + $B / 2 - $r[0] * $k), [single]($cy + $B / 2 - $r[1] * $k), [single]$S, [single]$S); $g.ResetClip(); $im.Dispose(); $i++ }
  $g.Dispose(); $bmp.Save($Sheet); $bmp.Dispose() }
