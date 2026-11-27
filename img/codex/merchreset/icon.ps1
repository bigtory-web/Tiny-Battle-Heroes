# merchant reset = merchant face + reset mark, same layout and mark as img/codex/center/centerall.ps1
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$reset = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
$b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\upicon3\base22\up_mgirl.png')); $o=New-Object System.Drawing.Bitmap $b
$h=$reset.Count; $w=$reset[0].Length; $ox=23-$w; $oy=23-$h
function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $reset[$j][$i] -ne [char]'.' }
for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
  $px=$ox+$i; $py=$oy+$j; if($near -and $px -lt 24 -and $py -lt 24){ $o.SetPixel($px,$py,(C '#2e0c06')) } } }
for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C '#5fe8ff')) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\merchreset\up_merchReset.png'))
# preview next to the sibling icons on the upgrade tile (36 on 56), unbought and bought
$names='img\p\up_shopReset.png','img\p\up_merchSlot.png','img\codex\merchreset\up_merchReset.png'
$z=3; $pv=New-Object System.Drawing.Bitmap (3*62*$z+16),(2*62*$z+16); $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $i=0; foreach($f in $names){ $x=16+$i*62*$z; $y=16+$row*62*$z
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($row){'#ffd34d'}else{'#ffffff'}))),$x,$y,56*$z,56*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($row){'#5b3a8c'}else{'#0c0a10'}))),$x+2*$z,$y+2*$z,52*$z,52*$z)
  $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $g.DrawImage($im,$x+10*$z,$y+10*$z,36*$z,36*$z); $im.Dispose(); $i++ } }
$pv.Save([IO.Path]::GetFullPath('img\codex\merchreset\compare.png'))
