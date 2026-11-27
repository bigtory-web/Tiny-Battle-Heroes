# Volt checklist fixes: muted gold like the knight, headband and staff head in navy steel (apart from the hair), stray teal dots gone
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$o=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\pixellab\redo\volt_c.png')); $s=New-Object System.Drawing.Bitmap $o
$ink=C '#501602'; $navy=C '#2f3d66'; $steel=C '#5a70a8'; $lite=C '#a8bce0'
function IsGold($c){ $c.A -and $c.R -gt 110 -and $c.G -gt 70 -and $c.B -lt 100 -and $c.G -gt $c.R*0.56 }
# 1) staff head and pole bands (right of the face): gold -> navy steel
for($y=0;$y -lt 51;$y++){ for($x=33;$x -lt 51;$x++){ $c=$o.GetPixel($x,$y); if(IsGold $c){ $l=($c.R*3+$c.G*6+$c.B)/10
  $o.SetPixel($x,$y,$(if($l -gt 195){$lite}elseif($l -gt 130){$steel}else{$navy})) } } }
# 2) the muddy gold headband: clear its broken lines back to hair, then draw one clean band with two short fins
foreach($y in 14..20){ foreach($x in 16..32){ if($x -ge 24 -and $x -le 27){continue}; $c=$o.GetPixel($x,$y); if($c.A -and -not ($y -ge 20 -and $x -ge 27 -and $x -le 29)){ $o.SetPixel($x,$y,(C '#fce30c')) } } }
for($x=16;$x -le 31;$x++){ if($x -ge 24 -and $x -le 27){continue}; $o.SetPixel($x,17,$ink); $o.SetPixel($x,18,$steel); $o.SetPixel($x,19,$navy); $o.SetPixel($x,20,$ink) }
foreach($p in @(@(18,16,1),@(31,16,-1))){ $bx,$by,$d=$p
  foreach($q in @(@(0,0,0),@(1,0,0),@(2,0,0),@(0,-1,0),@(1,-1,0),@(0,-2,0))){ $o.SetPixel(($bx-$d*$q[0]),($by+$q[1]),$(if($q[1] -eq -2 -or $q[0] -eq 0){$lite}else{$steel})) }
  foreach($q in @(@(0,-3),@(1,-2),@(2,-1),@(3,0),@(-1,0),@(-1,-1),@(-1,-2))){ $x=$bx-$d*$q[0]; $y=$by+$q[1]; if($x -ge 0 -and $x -lt 51){ $o.SetPixel($x,$y,$ink) } } }
# 3) calmer gold for hair, cape and trim
$map=@{ 'fce30c'='#f2c44c'; 'f7cd17'='#fcd75b'; 'f9da51'='#fcd75b'; 'eba704'='#e09a2c'; 'eea815'='#e09a2c'; 'cc8a05'='#bf7316'; 'c87908'='#a75911' }
for($y=0;$y -lt 51;$y++){ for($x=0;$x -lt 51;$x++){ $c=$o.GetPixel($x,$y); if(-not $c.A){continue}; $h="{0:x2}{1:x2}{2:x2}" -f $c.R,$c.G,$c.B
  if($map.ContainsKey($h)){ $o.SetPixel($x,$y,(C $map[$h])) }
  elseif($c.R -gt 200 -and $c.G -gt 140 -and $c.B -lt 60){ $o.SetPixel($x,$y,(C $(if($c.G -gt 200){'#f2c44c'}else{'#e09a2c'}))) }
  elseif($y -gt 38 -and $x -gt 27 -and $x -lt 37 -and $c.G -gt 100 -and $c.G -gt $c.R+10 -and $c.B -lt 190){ $o.SetPixel($x,$y,$navy) } } }
$t=New-Object System.Drawing.Bitmap $o
for($y=0;$y -lt 51;$y++){ for($x=0;$x -lt 51;$x++){ if($t.GetPixel($x,$y).A){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$x+$d[0]; $j=$y+$d[1]; if($i -ge 0 -and $j -ge 0 -and $i -lt 51 -and $j -lt 51){ $n=$t.GetPixel($i,$j); if($n.A -and ($n.R+$n.G+$n.B) -gt 200){ $o.SetPixel($x,$y,$ink); break } } } } }
$s.Dispose(); $o.Save([IO.Path]::GetFullPath('img\pixellab\redo\volt_d.png'))
