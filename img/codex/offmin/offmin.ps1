Add-Type -AssemblyName System.Drawing
# merchant MIN discount: the max-discount tag in green + "floor goes up" badge (gold arrow standing on a white bar)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\upicon3\base19\up_tag.png'))
$o = New-Object System.Drawing.Bitmap 24,24
$x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }
for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if(-not $c.A){continue}
  if(($c.R - $c.G) -gt 60 -and ($c.G -lt 60 -or ($c.G -lt 150 -and $c.B -gt 70))){ $c=[System.Drawing.Color]::FromArgb(255,[int]($c.G*0.6),[int]($c.R*0.72),[int]($c.B*0.5+10)) }
  $o.SetPixel($x-$x0,$y-$y0,$c) } }
$m = '....y....','...yyy...','..yyyyy..','.yyyyyyy.','...yyd...','...yyd...','.........','wwwwwwwww','sssssssss'
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'y #ffcb2a','d #c8860e','w #f4f4f8','s #aab0c0'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$ox=14; $oy=14
function On($i,$j){ $j -ge 0 -and $j -lt 9 -and $i -ge 0 -and $i -lt 9 -and $m[$j][$i] -ne [char]'.' }
for($j=-1;$j -le 9;$j++){ for($i=-1;$i -le 9;$i++){ if(-not (On $i $j)){ $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
  if($near -and $ox+$i -lt 24 -and $oy+$j -lt 24){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } } }
for($j=0;$j -lt 9;$j++){ for($i=0;$i -lt 9;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C $pal[[string]$m[$j][$i]])) } } }
New-Item -ItemType Directory -Force img\codex\offmin | Out-Null
$o.Save([IO.Path]::GetFullPath('img\codex\offmin\up_merchOffMin.png'))
# side by side with the max-discount icon, in unbought and bought tiles (56 tile, icon at 36)
$max = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\up_merchOff.png'))
$z=4; $s = New-Object System.Drawing.Bitmap (4*62*$z+16), (62*$z+16+80); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$items = @($max,$false),@($o,$false),@($max,$true),@($o,$true)
$i=0; foreach($it in $items){ $x=16+$i*62*$z; $b=$it[1]
  foreach($pass in @(@($x,16,$z),@((16+$i*70),(62*$z+24),1.333))){ $px,$py,$k=$pass
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
    $g.DrawImage($it[0],[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)) }
  $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\offmin\compare.png'))
