# 몸 부분만 색 수를 줄이고(k-means), 회색 장비(무기·방패)는 밝게 + 위쪽 테두리 밝은 선.
# 사용: bodyquant.ps1 -Src img/p/bear_body15.png -Out img/p/bear55c.png -Y0 21 -K 8
param([string]$Src, [string]$Out, [int]$Y0 = 21, [int]$K = 8, [double]$Bright = 1.22, [double]$Edge = 1.45)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Src).Path); $bm = New-Object System.Drawing.Bitmap 36, 36
$gx = [System.Drawing.Graphics]::FromImage($bm); $gx.DrawImage($img, 0, 0, 36, 36); $gx.Dispose(); $img.Dispose()
$LX = New-Object System.Collections.Generic.List[int]; $LY = New-Object System.Collections.Generic.List[int]
$LR = New-Object System.Collections.Generic.List[double]; $LG = New-Object System.Collections.Generic.List[double]; $LB = New-Object System.Collections.Generic.List[double]
for ($y = $Y0; $y -le 35; $y++) { for ($x = 0; $x -lt 36; $x++) { $c = $bm.GetPixel($x, $y); if ($c.A -gt 128) { $LX.Add($x); $LY.Add($y); $LR.Add($c.R); $LG.Add($c.G); $LB.Add($c.B) } } }
$N = $LX.Count
function Dist([double]$r1, [double]$g1, [double]$b1, [double]$r2, [double]$g2, [double]$b2) { ($r1 - $r2) * ($r1 - $r2) + ($g1 - $g2) * ($g1 - $g2) + ($b1 - $b2) * ($b1 - $b2) }
$CR = New-Object double[] $K; $CG = New-Object double[] $K; $CB = New-Object double[] $K
$CR[0] = $LR[0]; $CG[0] = $LG[0]; $CB[0] = $LB[0]
for ($j = 1; $j -lt $K; $j++) { $bi = 0; $bd = -1.0
  for ($i = 0; $i -lt $N; $i++) { $md = [double]::MaxValue; for ($q = 0; $q -lt $j; $q++) { $d = Dist $LR[$i] $LG[$i] $LB[$i] $CR[$q] $CG[$q] $CB[$q]; if ($d -lt $md) { $md = $d } }; if ($md -gt $bd) { $bd = $md; $bi = $i } }
  $CR[$j] = $LR[$bi]; $CG[$j] = $LG[$bi]; $CB[$j] = $LB[$bi] }
$A = New-Object int[] $N
for ($it = 0; $it -lt 12; $it++) {
  for ($i = 0; $i -lt $N; $i++) { $md = [double]::MaxValue; for ($q = 0; $q -lt $K; $q++) { $d = Dist $LR[$i] $LG[$i] $LB[$i] $CR[$q] $CG[$q] $CB[$q]; if ($d -lt $md) { $md = $d; $A[$i] = $q } } }
  $SR = New-Object double[] $K; $SG = New-Object double[] $K; $SB = New-Object double[] $K; $SN = New-Object int[] $K
  for ($i = 0; $i -lt $N; $i++) { $q = $A[$i]; $SR[$q] += $LR[$i]; $SG[$q] += $LG[$i]; $SB[$q] += $LB[$i]; $SN[$q]++ }
  for ($q = 0; $q -lt $K; $q++) { if ($SN[$q] -gt 0) { $CR[$q] = $SR[$q] / $SN[$q]; $CG[$q] = $SG[$q] / $SN[$q]; $CB[$q] = $SB[$q] / $SN[$q] } } }
$gray = New-Object bool[] $K
for ($q = 0; $q -lt $K; $q++) { $mx = [Math]::Max($CR[$q], [Math]::Max($CG[$q], $CB[$q])); $mn = [Math]::Min($CR[$q], [Math]::Min($CG[$q], $CB[$q])); $l = 0.3 * $CR[$q] + 0.59 * $CG[$q] + 0.11 * $CB[$q]
  $gray[$q] = (($mx - $mn) -lt 30 -and $l -gt 80); '{0} {1:X2}{2:X2}{3:X2} gray={4}' -f $q, [int]$CR[$q], [int]$CG[$q], [int]$CB[$q], $gray[$q] }
$at = @{}; for ($i = 0; $i -lt $N; $i++) { $at["$($LX[$i]),$($LY[$i])"] = $A[$i] }
for ($i = 0; $i -lt $N; $i++) { $q = $A[$i]; $r = $CR[$q]; $g = $CG[$q]; $b = $CB[$q]
  if ($gray[$q]) { $up = $at["$($LX[$i]),$($LY[$i] - 1)"]; $isEdge = ($null -eq $up) -or (-not $gray[$up]); $f = if ($isEdge) { $Edge } else { $Bright }; $add = if ($isEdge) { 30 } else { 15 }
    $r = [Math]::Min(255, $r * $f + $add); $g = [Math]::Min(255, $g * $f + $add); $b = [Math]::Min(255, $b * $f + $add) }
  $bm.SetPixel($LX[$i], $LY[$i], [System.Drawing.Color]::FromArgb(255, [int]$r, [int]$g, [int]$b)) }
$bm.Save($Out); $bm.Dispose(); "-> $Out"
