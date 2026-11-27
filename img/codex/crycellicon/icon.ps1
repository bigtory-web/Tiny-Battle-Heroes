# "crystal cell" feature icon: hex floor tile with small crystals on its corners, red = minus, blue = plus (game colours)
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$ink = C '#17141d'
$red  = (C '#8f1f2a'), (C '#ff5a5a'), (C '#ffd0c8')
$blue = (C '#1f4a9c'), (C '#5aa8ff'), (C '#d6ecff')
function Px($o,$x,$y,$c){ if($x -ge 0 -and $y -ge 0 -and $x -lt 24 -and $y -lt 24){ $o.SetPixel($x,$y,$c) } }
# flat hex floor: rows y0..y0+h-1, widest w in the middle, slanted ends; filled, with a dark rim
function Hex($o,$x0,$y0,$w,$h,$fill,$edge){
  $half=($h-1)/2.0; $slant=[int][math]::Floor($w/4)
  $in={ param($i,$j) if($j -lt 0 -or $j -ge $h){ return $false }; $d=[int][math]::Round($slant*[math]::Abs($j-$half)/$half); return ($i -ge $d -and $i -lt $w-$d) }
  # thickness under the tile, like the swamp tile icon
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(& $in $i $j){ foreach($k in 1,2){ Px $o ($x0+$i) ($y0+$j+$k) (C '#262a44') } } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(-not (& $in $i $j)){continue}
      $rim = -not ((& $in ($i-1) $j) -and (& $in ($i+1) $j) -and (& $in $i ($j-1)) -and (& $in $i ($j+1)))
      Px $o ($x0+$i) ($y0+$j) $(if($rim){$edge}else{$fill}) } } }
# a small pointed crystal with a 1px dark rim, bottom at (x,y)
function Shard($o,$x,$y,$col,$map){
  $h=$map.Count; $w=$map[0].Length; $ox=$x-[int][math]::Floor($w/2); $oy=$y-$h+1
  $on={ param($i,$j) $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $map[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(& $on $i $j){continue}; if((& $on ($i+1) $j) -or (& $on ($i-1) $j) -or (& $on $i ($j+1)) -or (& $on $i ($j-1))){ Px $o ($ox+$i) ($oy+$j) $ink } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(& $on $i $j){ Px $o ($ox+$i) ($oy+$j) $col['DML'.IndexOf([string]$map[$j][$i])] } } } }
$big = '.L.','LMD','LMD','LMD','.D.'
$mid = '.L.','LMD','LMD'
# A: one big tile, three red crystals on the left corners, three blue on the right
$a = New-Object System.Drawing.Bitmap 24,24
Hex $a 2 7 20 12 (C '#4a5272') (C '#aab4d8')
foreach($x in 4..19){ if($x % 3 -eq 0){ Px $a $x 7 $(if($x -lt 12){$red[1]}else{$blue[1]}); Px $a $x 18 $(if($x -lt 12){$red[1]}else{$blue[1]}) } }
Shard $a 6 8 $red $big; Shard $a 17 8 $blue $big
Shard $a 2 14 $red $big; Shard $a 21 14 $blue $big
Shard $a 6 21 $red $big; Shard $a 17 21 $blue $big
$a.Save([IO.Path]::GetFullPath('img\codex\crycellicon\a.png'))
# B: two small tiles, red upper left and blue lower right
$b = New-Object System.Drawing.Bitmap 24,24
Hex $b 1 4 14 9 (C '#5a2c3a') $red[1]
Shard $b 4 6 $red $mid; Shard $b 11 6 $red $mid; Shard $b 2 12 $red $mid
Hex $b 9 13 14 9 (C '#26406e') $blue[1]
Shard $b 12 15 $blue $big; Shard $b 20 15 $blue $big; Shard $b 16 23 $blue $mid
$b.Save([IO.Path]::GetFullPath('img\codex\crycellicon\b.png'))
# preview: both next to the swamp-cell icon, big and at screen size
$pv=New-Object System.Drawing.Bitmap 620,260; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#2a2533')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Arial',14,([System.Drawing.FontStyle]::Bold); $slot=New-Object System.Drawing.SolidBrush (C '#17141d')
$i=0; foreach($f in 'img\codex\crycellicon\a.png','img\codex\crycellicon\b.png','img\p\ui_swampcell.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $x=12+$i*204
  $g.FillRectangle($slot,$x,12,192,192); $g.DrawImage($im,$x,12,192,192); $g.FillRectangle($slot,($x+72),214,40,40); $g.DrawImage($im,($x+80),222,24,24); $g.DrawString(@('A','B','swamp')[$i],$font,[System.Drawing.Brushes]::White,($x+4),16); $i++ }
$pv.Save([IO.Path]::GetFullPath('img\codex\crycellicon\compare.png'))
