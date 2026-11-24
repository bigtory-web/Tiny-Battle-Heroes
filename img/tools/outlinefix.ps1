# 바깥 외곽선 빈 곳 채우기: 투명(또는 그림 끝)과 맞닿은 칸 중 외곽선이 아닌(밝은) 칸을 짙은 갈색 외곽선으로 바꿔요.
# 사용: outlinefix.ps1 -Src img/p/bear55c.png -Out img/p/bear55d.png
param([string]$Src, [string]$Out, [string]$Line = '3D1B14', [int]$DarkLum = 70)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Src).Path); $bm = New-Object System.Drawing.Bitmap 36, 36
$gx = [System.Drawing.Graphics]::FromImage($bm); $gx.DrawImage($img, 0, 0, 36, 36); $gx.Dispose(); $img.Dispose()
$lc = [System.Drawing.ColorTranslator]::FromHtml('#' + $Line)
function Test-Empty($xx, $yy) { $xx -lt 0 -or $yy -lt 0 -or $xx -gt 35 -or $yy -gt 35 -or $bm.GetPixel($xx, $yy).A -lt 128 }
$fix = @()
for ($yy = 0; $yy -lt 36; $yy++) { for ($xx = 0; $xx -lt 36; $xx++) { $px = $bm.GetPixel($xx, $yy); if ($px.A -lt 128) { continue }
  if ((Test-Empty ($xx + 1) $yy) -or (Test-Empty ($xx - 1) $yy) -or (Test-Empty $xx ($yy + 1)) -or (Test-Empty $xx ($yy - 1))) {
    if ((0.3 * $px.R + 0.59 * $px.G + 0.11 * $px.B) -gt $DarkLum) { $fix += , @($xx, $yy) } } } }
foreach ($p in $fix) { $bm.SetPixel($p[0], $p[1], $lc) }
$bm.Save($Out); $bm.Dispose(); "filled $($fix.Count) -> $Out"
