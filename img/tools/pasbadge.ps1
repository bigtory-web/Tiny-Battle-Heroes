# 패시브(스킬2) 아이콘 후처리: 코덱스 상징 원본 -> 18x18 정리 -> 24x24 어두운 둥근 메달 위에 얹기
# 사용 예:
#   powershell -ExecutionPolicy Bypass -File pasbadge.ps1 -Src img\px\pas_crit.png -Out img\p\pas_crit.png
#   -Inner : 상징 격자 크기(기본 18)
# 주의: PowerShell 변수는 대소문자를 구분하지 않아요. 이름이 겹치지 않게 접두어를 붙였어요.
#   -Mode icon : 메달 없이 상징만(투명 배경) / -Mode frame : 메달만(-Src 필요 없음, img\p\pas_frame.png) / 기본 full
param([string]$Src, [string]$Out, [int]$Inner = 18, [ValidateSet('full', 'icon', 'frame')][string]$Mode = 'full')
Add-Type -AssemblyName System.Drawing
$size = 24
$colLine = [System.Drawing.ColorTranslator]::FromHtml('#2a1a10')  # 외곽선(짙은 갈색)
$colFill = [System.Drawing.ColorTranslator]::FromHtml('#2b3048')  # 바탕(짙은 남색)
$colLow  = [System.Drawing.ColorTranslator]::FromHtml('#232639')  # 바탕 아래쪽 그림자
$colRim  = [System.Drawing.ColorTranslator]::FromHtml('#6a7090')  # 윗쪽 테두리 빛

# 1) 원본에서 상징이 있는 영역만 정사각으로 잘라내기(여백 제거)
if ($Mode -ne 'frame') {
$srcBmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Src).Path)
$w = $srcBmp.Width; $h = $srcBmp.Height; $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($py = 0; $py -lt $h; $py += 4) { for ($px = 0; $px -lt $w; $px += 4) { $pc = $srcBmp.GetPixel($px, $py)
  if ($pc.A -gt 128 -and -not ($pc.R -gt 240 -and $pc.G -gt 240 -and $pc.B -gt 240)) {
    if ($px -lt $minX) { $minX = $px }; if ($px -gt $maxX) { $maxX = $px }; if ($py -lt $minY) { $minY = $py }; if ($py -gt $maxY) { $maxY = $py } } } }
$side = [Math]::Max($maxX - $minX, $maxY - $minY) + 4
$midX = ($minX + $maxX) / 2; $midY = ($minY + $maxY) / 2
$symBmp = New-Object System.Drawing.Bitmap $Inner, $Inner
$gfx = [System.Drawing.Graphics]::FromImage($symBmp)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$gfx.DrawImage($srcBmp, (New-Object System.Drawing.Rectangle 0, 0, $Inner, $Inner), [int]($midX - $side / 2), [int]($midY - $side / 2), [int]$side, [int]$side, [System.Drawing.GraphicsUnit]::Pixel)
$gfx.Dispose(); $srcBmp.Dispose()
}

# 2) 24x24 둥근 메달
$outBmp = New-Object System.Drawing.Bitmap $size, $size
if ($Mode -ne 'icon') {
$rad = 11.5; $ctr = 11.5
for ($py = 0; $py -lt $size; $py++) { for ($px = 0; $px -lt $size; $px++) {
  $dist = [Math]::Sqrt(($px - $ctr) * ($px - $ctr) + ($py - $ctr) * ($py - $ctr))
  if ($dist -le $rad) {
    if ($dist -gt $rad - 1.2) { $outBmp.SetPixel($px, $py, $colLine) }
    elseif ($dist -gt $rad - 2.2 -and $py -lt 9) { $outBmp.SetPixel($px, $py, $colRim) }
    elseif ($py -gt 15) { $outBmp.SetPixel($px, $py, $colLow) }
    else { $outBmp.SetPixel($px, $py, $colFill) } } } }
}

# 3) 상징 얹기(가운데)
if ($Mode -ne 'frame') {
$off = [int](($size - $Inner) / 2)
for ($py = 0; $py -lt $Inner; $py++) { for ($px = 0; $px -lt $Inner; $px++) { $pc = $symBmp.GetPixel($px, $py)
  if ($pc.A -ge 128) { $outBmp.SetPixel($px + $off, $py + $off, [System.Drawing.Color]::FromArgb(255, $pc.R, $pc.G, $pc.B)) } } }
$symBmp.Dispose()
}
$outBmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $outBmp.Dispose()
"pas 24x24 -> $Out"
