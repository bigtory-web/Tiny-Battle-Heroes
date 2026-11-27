Add-Type -AssemblyName System.Drawing
# the campfire / fairy reset was split in two: fairyReset keeps the old fairy art, eventReset (campfire only now) gets a campfire
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
New-Item -ItemType Directory -Force img\codex\resets | Out-Null
$old = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\up_eventReset.png'))
$old.Save([IO.Path]::GetFullPath('img\codex\resets\up_fairyReset.png'))
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\upicon3\base19\up_start.png'))
$o = New-Object System.Drawing.Bitmap 24,24
$x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }
for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-$x0,$y-$y0,$c) } } }
$m = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
$h=$m.Count; $w=9; $ox=23-$w; $oy=23-$h
function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
  if($near){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C '#5fe8ff')) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\resets\up_eventReset.png'))
$fairy = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\resets\up_fairyReset.png'))
$z=4; $s = New-Object System.Drawing.Bitmap (2*62*$z+16), (2*62*$z+16); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($im in $o,$fairy){ foreach($b in 0,1){ $px=16+$i*62*$z; $py=16+$b*62*$z
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),$px,$py,56*$z,56*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),$px+2*$z,$py+2*$z,52*$z,52*$z)
  $g.DrawImage($im,$px+10*$z,$py+10*$z,36*$z,36*$z) }; $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\resets\compare.png'))
