param([string]$Dir, [string]$Names, [string]$Out, [string]$OldDir='')
# icons inside the real upgrade cells: 50x50 design px tile, icon shown at 36; unbought = black + white edge, bought = purple + yellow edge
Add-Type -AssemblyName System.Drawing
$list = $Names -split '[ ,]+'
$rows = @(); if($OldDir){ $rows += ,@($OldDir,$false) }; $rows += ,@($Dir,$false); $rows += ,@($Dir,$true)
function Br($h){ New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($h)) }
$k = 4; $cw = 62*$k
$s = New-Object System.Drawing.Bitmap ($cw*$list.Count), ($cw*$rows.Count + 100); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($g,$x,$y,$z,$file,$bought){
  $edge = if($bought){'#ffd34d'}else{'#ffffff'}; $bg = if($bought){'#5b3a8c'}else{'#0c0a10'}
  $g.FillRectangle((Br $edge), $x, $y, 54*$z, 54*$z); $g.FillRectangle((Br $bg), $x+2*$z, $y+2*$z, 50*$z, 50*$z)
  if(Test-Path $file){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file)); $g.DrawImage($im, [int]($x+9*$z), [int]($y+9*$z), [int](36*$z), [int](36*$z)); $im.Dispose() } }
for($r=0;$r -lt $rows.Count;$r++){ for($i=0;$i -lt $list.Count;$i++){ Tile $g ($i*$cw+16) ($r*$cw+16) $k "$($rows[$r][0])\up_$($list[$i]).png" $rows[$r][1] } }
# bottom strip: about the size on screen
for($i=0;$i -lt $list.Count;$i++){ Tile $g ($i*70+16) ($cw*$rows.Count+16) 1.333 "$Dir\up_$($list[$i]).png" ($i%2 -eq 1) }
$s.Save([IO.Path]::GetFullPath($Out))
