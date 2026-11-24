# 공격 자세 원본(1024)을 기존 36x36 그림과 같은 키·발 위치로 맞춰 1024 캔버스에 다시 놓아요. 그다음 pixfix -Kind hero.
# 사용: atkfit.ps1 -Base img/p/bear.png -Src img/px2/bear_atk.png -Out <1024 결과>
#  틀 맞춤: atkfit.ps1 -TargetH 31 -Src img/px2/rain_t.png -Out <1024 결과>  (키 31칸, 가운데, 발은 맨 아래 줄)
param([string]$Base, [string]$Src, [string]$Out, [int]$TargetH = 0)
Add-Type -AssemblyName System.Drawing
function BBox($bm, $step) {
  $x0 = $bm.Width; $y0 = $bm.Height; $x1 = -1; $y1 = -1
  for ($y = 0; $y -lt $bm.Height; $y += $step) { for ($x = 0; $x -lt $bm.Width; $x += $step) {
    if ($bm.GetPixel($x, $y).A -gt 128) { if ($x -lt $x0) { $x0 = $x }; if ($x -gt $x1) { $x1 = $x }; if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y } } } }
  return @($x0, $y0, $x1, $y1)
}
if ($TargetH -gt 0) { $n = 36; $bb = @(0, (36 - $TargetH), 35, 35) }  # 가로는 캔버스 가운데
else { $b = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Base)); $bb = BBox $b 1; $n = $b.Width; $b.Dispose() }
$s = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Src)); $sb = BBox $s 2
$k = 1024 / $n
$targetH = ($bb[3] - $bb[1] + 1) * $k
$scale = $targetH / ($sb[3] - $sb[1] + 1)
$w = ($sb[2] - $sb[0] + 1) * $scale; $h = $targetH
if ($w -gt 1024) { $scale *= 1024 / $w; $w = 1024; $h = ($sb[3] - $sb[1] + 1) * $scale }  # 넓은 날개·무기는 캔버스 폭에 맞춤
$cx = (($bb[0] + $bb[2] + 1) / 2) * $k
$bottom = ($bb[3] + 1) * $k
$o = New-Object System.Drawing.Bitmap 1024, 1024; $g = [System.Drawing.Graphics]::FromImage($o)
$g.Clear([System.Drawing.Color]::Transparent); $g.InterpolationMode = 'NearestNeighbor'
$x = [Math]::Max(0, [Math]::Min(1024 - $w, $cx - $w / 2))
$g.DrawImage($s, (New-Object System.Drawing.RectangleF $x, ($bottom - $h), $w, $h), (New-Object System.Drawing.RectangleF $sb[0], $sb[1], ($sb[2] - $sb[0] + 1), ($sb[3] - $sb[1] + 1)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $s.Dispose(); $o.Save($Out); $o.Dispose()
"fit scale {0:N2}" -f $scale
