# Codex 1024px pixel-art (magenta background) -> clean small sprite.
# Finds the real pixel-grid pitch, takes the most common color per cell,
# removes magenta, crops, and pads to a square with the feet on the bottom row.
# Usage: powershell -ExecutionPolicy Bypass -File gridsnap.ps1 -Src a_src.png -Out a.png [-Preview a_x8.png]
param([Parameter(Mandatory)][string]$Src, [Parameter(Mandatory)][string]$Out, [string]$Preview = '',
  [switch]$NoHalf, [double]$Pitch = 0) # -Pitch: force the art pixel size when the fit locks onto a wrong multiple # -NoHalf: keep the fitted pitch when the half-pitch check guesses wrong (result looks twice too big)
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap $Src
$W = $bmp.Width; $H = $bmp.Height
$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$bd = $bmp.LockBits($rect, 'ReadOnly', 'Format32bppArgb')
$buf = New-Object byte[] ($W * $H * 4)
[Runtime.InteropServices.Marshal]::Copy($bd.Scan0, $buf, 0, $buf.Length)
$bmp.UnlockBits($bd); $bmp.Dispose()

# edge counts per column / row
$ex = New-Object double[] $W; $ey = New-Object double[] $H
for ($y = 1; $y -lt $H; $y += 3) { for ($x = 1; $x -lt $W; $x++) { $k = ($y * $W + $x) * 4
  if (([math]::Abs($buf[$k] - $buf[$k - 4]) + [math]::Abs($buf[$k + 1] - $buf[$k - 3]) + [math]::Abs($buf[$k + 2] - $buf[$k - 2])) -gt 60) { $ex[$x] += 1 } } }
for ($x = 1; $x -lt $W; $x += 3) { for ($y = 1; $y -lt $H; $y++) { $k = ($y * $W + $x) * 4; $u = $k - $W * 4
  if (([math]::Abs($buf[$k] - $buf[$u]) + [math]::Abs($buf[$k + 1] - $buf[$u + 1]) + [math]::Abs($buf[$k + 2] - $buf[$u + 2])) -gt 60) { $ey[$y] += 1 } } }
function BestOff($e, $p) { # best offset for one pitch: grid lines should land on edges
  $len = $e.Length; $best = -1; $bo = 0
  for ($o = 0.0; $o -lt $p; $o += 0.5) { $sum = 0.0; $cnt = 0
    for ($t = $o; $t -lt $len - 1; $t += $p) { $i = [int][math]::Round($t); $sum += $e[$i] + 0.5 * $e[[math]::Max(0, $i - 1)] + 0.5 * $e[[math]::Min($len - 1, $i + 1)]; $cnt++ }
    $sc = $sum / $cnt; if ($sc -gt $best) { $best = $sc; $bo = $o } }
  return @($best, $bo)
}
# art pixels are square: one pitch for both axes (separate fits can lock onto different multiples)
$bestSc = -1; $pitchX = 16; $oxBest = 0; $oyBest = 0
for ($p = 8.0; $p -le 22.0; $p += 0.02) { $a = BestOff $ex $p; $b2 = BestOff $ey $p
  if (($a[0] + $b2[0]) -gt $bestSc) { $bestSc = $a[0] + $b2[0]; $pitchX = $p; $oxBest = $a[1]; $oyBest = $b2[1] } }
# a double-size pitch also lands on edges: if the half pitch scores nearly as well, it is the real one
# tell them apart by the shortest common run of one color along a row: it is about one art pixel wide
$runs = New-Object System.Collections.Generic.List[int]
for ($y = 8; $y -lt $H; $y += 8) { $run = 1; for ($x = 1; $x -lt $W; $x++) { $k = ($y * $W + $x) * 4
  if (([math]::Abs($buf[$k] - $buf[$k - 4]) + [math]::Abs($buf[$k + 1] - $buf[$k - 3]) + [math]::Abs($buf[$k + 2] - $buf[$k - 2])) -lt 40) { $run++ } else { if ($run -ge 5 -and $run -le 60) { $runs.Add($run) }; $run = 1 } } }
$runs.Sort(); $short = if ($runs.Count) { $runs[[int]($runs.Count * 0.2)] } else { $pitchX }
Write-Output ("short run {0}, fitted pitch {1:N2}" -f $short, $pitchX)
if ($Pitch -gt 0) { $a = BestOff $ex $Pitch; $b2 = BestOff $ey $Pitch; $pitchX = $Pitch; $oxBest = $a[1]; $oyBest = $b2[1] } elseif ($NoHalf) { } elseif ($short -lt 0.75 * $pitchX) { $half = $pitchX / 2; $a = BestOff $ex $half; $b2 = BestOff $ey $half; $pitchX = $half; $oxBest = $a[1]; $oyBest = $b2[1] }
$pitchY = $pitchX; $offX = $oxBest - $pitchX; $offY = $oyBest - $pitchY
$cols = [int][math]::Ceiling(($W - $offX) / $pitchX); $rows = [int][math]::Ceiling(($H - $offY) / $pitchY)
Write-Output ("pitch {0:N2} x {1:N2}, grid {2} x {3}" -f $pitchX, $pitchY, $cols, $rows)

# most common color per cell (magenta = transparent)
$cell = New-Object 'int[,]' $cols, $rows  # 0 = transparent, else ARGB
$minX = $cols; $minY = $rows; $maxX = -1; $maxY = -1
for ($cy = 0; $cy -lt $rows; $cy++) { for ($cx = 0; $cx -lt $cols; $cx++) { $tally = @{}; $acc = @{}
  foreach ($fj in 0.2, 0.35, 0.5, 0.65, 0.8) { foreach ($fi in 0.2, 0.35, 0.5, 0.65, 0.8) {
    $sx = [int]($offX + ($cx + $fi) * $pitchX); $sy = [int]($offY + ($cy + $fj) * $pitchY)
    if ($sx -lt 0 -or $sy -lt 0 -or $sx -ge $W -or $sy -ge $H) { continue }
    $k = ($sy * $W + $sx) * 4; $cb = $buf[$k]; $cg = $buf[$k + 1]; $cr = $buf[$k + 2]
    $key = (($cr -shr 4) -shl 8) -bor (($cg -shr 4) -shl 4) -bor ($cb -shr 4)
    if ($tally.ContainsKey($key)) { $tally[$key]++; $v = $acc[$key]; $v[0] += $cr; $v[1] += $cg; $v[2] += $cb } else { $tally[$key] = 1; $acc[$key] = @($cr, $cg, $cb) } } }
  if ($tally.Count -eq 0) { continue }
  $top = ($tally.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1); $m = $top.Value; $v = $acc[$top.Name]
  $cr = [int]($v[0] / $m); $cg = [int]($v[1] / $m); $cb = [int]($v[2] / $m)
  $cell[$cx, $cy] = [System.Drawing.Color]::FromArgb(255, $cr, $cg, $cb).ToArgb() } }
# background = magenta-ish cells connected to the border (bright purple inside the sprite is art, keep it);
# enclosed pockets are removed only when they are pure background magenta
function IsBg($argb, $pure) { $col = [System.Drawing.Color]::FromArgb($argb)
  if ($pure) { return ($col.R -gt 225 -and $col.G -lt 45 -and $col.B -gt 225) }
  return ($col.R -gt 170 -and $col.G -lt 120 -and $col.B -gt 170) }
$bg = New-Object 'bool[,]' $cols, $rows; $queue = New-Object System.Collections.Generic.Queue[int]
for ($cx = 0; $cx -lt $cols; $cx++) { $queue.Enqueue($cx); $queue.Enqueue($cx + ($rows - 1) * $cols) }
for ($cy = 0; $cy -lt $rows; $cy++) { $queue.Enqueue($cy * $cols); $queue.Enqueue($cols - 1 + $cy * $cols) }
while ($queue.Count) { $qi = $queue.Dequeue(); $cx = $qi % $cols; $cy = [int][math]::Floor($qi / $cols)
  if ($bg[$cx, $cy]) { continue }; $a = $cell[$cx, $cy]; if ($a -ne 0 -and -not (IsBg $a $false)) { continue }
  $bg[$cx, $cy] = $true
  if ($cx -gt 0) { $queue.Enqueue($qi - 1) }; if ($cx -lt $cols - 1) { $queue.Enqueue($qi + 1) }; if ($cy -gt 0) { $queue.Enqueue($qi - $cols) }; if ($cy -lt $rows - 1) { $queue.Enqueue($qi + $cols) } }
$kept = 0
for ($cy = 0; $cy -lt $rows; $cy++) { for ($cx = 0; $cx -lt $cols; $cx++) { $a = $cell[$cx, $cy]
  if ($bg[$cx, $cy] -or $a -eq 0 -or (IsBg $a $true)) { $cell[$cx, $cy] = 0; continue }
  if (IsBg $a $false) { $kept++ }
  if ($cx -lt $minX) { $minX = $cx }; if ($cx -gt $maxX) { $maxX = $cx }; if ($cy -lt $minY) { $minY = $cy }; if ($cy -gt $maxY) { $maxY = $cy } } }
Write-Output "kept $kept bright purple cells inside the sprite"
if ($maxX -lt 0) { throw 'no sprite pixels found' }

$sw = $maxX - $minX + 1; $sh = $maxY - $minY + 1; $side = [math]::Max($sw, $sh) + 2
$res = New-Object System.Drawing.Bitmap $side, $side
$dx = [int](($side - $sw) / 2); $dy = $side - $sh
for ($cy = 0; $cy -lt $sh; $cy++) { for ($cx = 0; $cx -lt $sw; $cx++) { $a = $cell[($minX + $cx), ($minY + $cy)]
  if ($a -ne 0) { $res.SetPixel($dx + $cx, $dy + $cy, [System.Drawing.Color]::FromArgb($a)) } } }
$res.Save($Out)
Write-Output ("sprite {0} x {1}, canvas {2} x {2}" -f $sw, $sh, $side)
if ($Preview) { $z = 8; $pv = New-Object System.Drawing.Bitmap ($side * $z), ($side * $z); $gr = [System.Drawing.Graphics]::FromImage($pv)
  $gr.Clear([System.Drawing.Color]::FromArgb(58, 125, 68)); $gr.InterpolationMode = 'NearestNeighbor'; $gr.PixelOffsetMode = 'Half'
  $gr.DrawImage($res, 0, 0, $side * $z, $side * $z); $pv.Save($Preview); $gr.Dispose(); $pv.Dispose() }
$res.Dispose()
