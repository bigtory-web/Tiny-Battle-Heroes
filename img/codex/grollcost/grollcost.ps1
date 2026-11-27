Add-Type -AssemblyName System.Drawing
# gold goblin roulette cost down: the goblin + a red "down" arrow (the chance nodes use a green up arrow)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\upicon3\base19\up_gobcoin.png'))
$o = New-Object System.Drawing.Bitmap 24,24
$x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }
for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-$x0,$y-$y0,$c) } } }
$m = '...rrr...','...rrd...','...rrd...','...rrd...','rrrrrrddd','.rrrrrdd.','..rrrdd..','...rrd...','....d....'
$h=$m.Count; $w=9; $ox=14; $oy=14
function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
  if($near -and $ox+$i -lt 24 -and $oy+$j -lt 24){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C $(if($m[$j][$i] -eq [char]'r'){'#ff4a3c'}else{'#b81a12'}))) } } }
New-Item -ItemType Directory -Force img\codex\grollcost | Out-Null
$o.Save([IO.Path]::GetFullPath('img\codex\grollcost\up_grollCost.png'))
$z=4; $t=62*$z; $s = New-Object System.Drawing.Bitmap (3*$t+16), ($t+16+90); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\up_groll.png','img\p\up_grollGrade.png','img\codex\grollcost\up_grollCost.png'){ $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $b = $i -eq 2
  foreach($pass in @(@((16+$i*$t),16,$z),@((16+$i*70),($t+24),1.333))){ $px,$py,$k=$pass
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
    $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
    $g.DrawImage($im,[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)) }
  $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\grollcost\compare.png'))
