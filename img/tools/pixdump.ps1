# 36x36 그림을 글자 격자로 출력해요. 얼굴 위치 확인용.
# . 투명  # 외곽선(아주 어두움)  W 흰자  s 피부  나머지는 색을 크게 묶어 글자로.
param([string]$Src, [int]$Y0 = 0, [int]$Y1 = 35)
Add-Type -AssemblyName System.Drawing
$bm = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Src))
$map = @{}; $chars = 'abcdefghijklmnopqrtuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ0123456789'
"    " + (-join (0..($bm.Width-1) | % { $_ % 10 }))
for ($y = $Y0; $y -le $Y1; $y++) { $line = ''
  for ($x = 0; $x -lt $bm.Width; $x++) { $c = $bm.GetPixel($x, $y)
    if ($c.A -lt 128) { $line += '.'; continue }
    $lum = 0.3 * $c.R + 0.59 * $c.G + 0.11 * $c.B
    if ($lum -lt 50) { $line += '#'; continue }
    if ($c.R -gt 235 -and $c.G -gt 235 -and $c.B -gt 235) { $line += 'W'; continue }
    if ($c.R -gt 230 -and $c.G -ge 170 -and $c.G -le 215 -and $c.B -ge 140 -and $c.B -le 185) { $line += 's'; continue }
    $k = '{0}{1}{2}' -f [int]($c.R / 64), [int]($c.G / 64), [int]($c.B / 64)
    if (-not $map.ContainsKey($k)) { $map[$k] = $chars[$map.Count] }
    $line += $map[$k] }
  '{0,3} {1}' -f $y, $line }
$bm.Dispose()
($map.GetEnumerator() | Sort-Object Value | % { "$($_.Value)=$($_.Key)" }) -join ' '
