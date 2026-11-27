# two reset icons = merchant face centred + the usual reset mark bottom-right (same mark as centerall.ps1); preview of all three
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$reset = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
function Mark($o){ $h=$reset.Count; $w=$reset[0].Length; $ox=23-$w; $oy=23-$h
  $on={ param($i,$j) $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $reset[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(& $on $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(& $on ($i+$dx) ($j+$dy)){ $near=$true } } }
    $px=$ox+$i; $py=$oy+$j; if($near -and $px -lt 24 -and $py -lt 24){ $o.SetPixel($px,$py,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(& $on $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C '#5fe8ff')) } } } }
foreach($v in @(@('swampReset','img\p\ui_swampshop.png'),@('crystalReset','img\p\ui_cryshop.png'))){ $b=Load $v[1]; $o=New-Object System.Drawing.Bitmap $b; Mark $o; $o.Save([IO.Path]::GetFullPath("img\codex\shopups\up_$($v[0]).png")) }
$files='img\p\up_swampSlot.png','img\codex\shopups\up_crystalSlot.png','img\p\up_merchReset.png','img\codex\shopups\up_swampReset.png','img\codex\shopups\up_crystalReset.png'
$z=3; $pv=New-Object System.Drawing.Bitmap (5*62*$z+16),(2*62*$z+16); $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $i=0; foreach($f in $files){ $x=16+$i*62*$z; $y=16+$row*62*$z
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($row){'#ffd34d'}else{'#ffffff'}))),$x,$y,56*$z,56*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($row){'#5b3a8c'}else{'#0c0a10'}))),$x+2*$z,$y+2*$z,52*$z,52*$z)
  $im=Load $f; $g.DrawImage($im,$x+10*$z,$y+10*$z,36*$z,36*$z); $im.Dispose(); $i++ } }
$pv.Save([IO.Path]::GetFullPath('img\codex\shopups\compare.png'))
