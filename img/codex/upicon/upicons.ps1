Add-Type -AssemblyName System.Drawing
$ink = [System.Drawing.ColorTranslator]::FromHtml('#2a0e04')
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
function New24 { New-Object System.Drawing.Bitmap 24,24 }
function Box($b,$x,$y,$w,$h,$col){ for($j=$y;$j -lt $y+$h;$j++){ for($i=$x;$i -lt $x+$w;$i++){ if($i -ge 0 -and $i -lt 24 -and $j -ge 0 -and $j -lt 24){ $b.SetPixel($i,$j,(C $col)) } } } }
# put a layer on the icon with its own 1px dark outline (so overlapping shapes stay separate)
function Put($icon,$layer){
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($layer.GetPixel($x,$y).A){
    foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$x+$d[0]; $j=$y+$d[1]; if($i -ge 0 -and $i -lt 24 -and $j -ge 0 -and $j -lt 24 -and -not $layer.GetPixel($i,$j).A){ $icon.SetPixel($i,$j,$ink) } } } } }
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$layer.GetPixel($x,$y); if($c.A){ $icon.SetPixel($x,$y,$c) } } } }

# ---- backpack
$bag = New24
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'L #f6bc6c','B #d0823a','D #86461a','S #a05a28','P #e49c4e','y #ffd34d','Y #fff4b0'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$rows = @(
 '........................',
 '........................',
 '........DDDDDDDD........',
 '........DD....DD........',
 '......LLLLLLLLLLLL......',
 '.....LLBBBBBBBBBBBD.....',
 '....LLBBBBBBBBBBBBBD....',
 '....LBBBBBBBBBBBBBBD....',
 '....LBBBBBBBBBBBBBBD....',
 '....DDDDDDyyyyDDDDDD....',
 '..SSLBBBBByYYyBBBBBDSS..',
 '..SSLBBBBByyyyBBBBBDSS..',
 '..SSLBBBBBBBBBBBBBBDSS..',
 '..SSLBDDDDDDDDDDDDBDSS..',
 '..SSLBDLLLLLLLLLLDBDSS..',
 '..SSLBDLPPPPPPPPPDBDSS..',
 '..SSLBDPPPPyyPPPPDBDSS..',
 '..SSLBDPPPPPPPPPPDBDSS..',
 '..SSLBDPPPPPPPPPPDBDSS..',
 '....LBBDDDDDDDDDDBBD....',
 '....DBBBBBBBBBBBBBBD....',
 '.....DDDDDDDDDDDDDD.....')
$l = New24; for($y=0;$y -lt $rows.Count;$y++){ for($x=0;$x -lt 24;$x++){ $k=[string]$rows[$y][$x]; if($k -ne '.'){ $l.SetPixel($x,$y,(C $pal[$k])) } } }
Put $bag $l

# ---- shop stall: striped awning, goods, counter
$shop = New24
$l = New24; Box $l 3 11 2 8 '#8a4a1c'; Box $l 19 11 2 8 '#8a4a1c'; Put $shop $l
$l = New24
Box $l 8 10 1 1 '#caa27a'; Box $l 7 11 3 4 '#e8503c'; Box $l 7 11 1 2 '#ff9a8a'
Box $l 12 11 1 1 '#caa27a'; Box $l 11 12 3 3 '#58c04a'; Box $l 11 12 1 2 '#b6f08a'
Box $l 16 10 1 1 '#caa27a'; Box $l 15 11 3 4 '#3f86d8'; Box $l 15 11 1 2 '#9ad0ff'
Put $shop $l
$l = New24; Box $l 2 15 20 2 '#e49c4e'; Box $l 2 15 20 1 '#f6bc6c'; Box $l 3 17 18 5 '#a85f28'; Box $l 8 17 1 5 '#7a3f18'; Box $l 15 17 1 5 '#7a3f18'; Put $shop $l
$l = New24
for($x=2;$x -lt 22;$x++){ $red = ([math]::Floor(($x-2)/4) % 2) -eq 0
  $m = if($red){'#e0392e'}else{'#fff0d0'}; $hi = if($red){'#ff7a62'}else{'#ffffff'}; $lo = if($red){'#a81e1e'}else{'#e0c090'}
  $top = if($x -lt 4 -or $x -gt 19){4}else{2}
  Box $l $x $top 1 (9-$top) $m; Box $l $x $top 1 1 $hi; Box $l $x 8 1 1 $lo
  $in = ($x-2) % 4; if($in -eq 1 -or $in -eq 2){ Box $l $x 9 1 1 $lo } }
Put $shop $l

# ---- gold: two coin stacks and one big coin in front
$gold = New24
function Stack($icon,$x,$y,$n){ for($i=$n-1;$i -ge 0;$i--){ $t=$y+$i*3; $l = New24; Box $l ($x+1) $t 8 1 '#fff1a0'; Box $l $x ($t+1) 10 1 '#ffcb2a'; Box $l ($x+1) ($t+2) 8 1 '#c8860e'; Put $icon $l } }
Stack $gold 2 6 5
Stack $gold 12 2 6
$l = New24
for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $dx=$x-11.5; $dy=$y-15.5; $d=[math]::Sqrt($dx*$dx+$dy*$dy)
  if($d -le 6.6){ $col = if($d -gt 5){ if($dx+$dy -lt 0){'#fff1a0'}else{'#c8860e'} } else {'#ffcb2a'}; $l.SetPixel($x,$y,(C $col)) } } }
Box $l 10 13 4 6 '#c8860e'; Box $l 11 14 2 4 '#7a4a06'; Box $l 8 12 2 2 '#fff1a0'
Put $gold $l

# ---- team hp: three hearts
$hp = New24
$big = '..xxx...xxx..','.xxxxx.xxxxx.','xxxxxxxxxxxxx','xxxxxxxxxxxxx','xxxxxxxxxxxxx','.xxxxxxxxxxx.','..xxxxxxxxx..','...xxxxxxx...','....xxxxx....','.....xxx.....','......x......'
$small = '.xx...xx.','xxxx.xxxx','xxxxxxxxx','xxxxxxxxx','.xxxxxxx.','..xxxxx..','...xxx...','....x....'
function Heart($icon,$m,$x,$y,$main,$dark){ $l = New24; $h=$m.Count; $w=$m[0].Length
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if($m[$j][$i] -eq 'x'){
    $edge = ($i+1 -ge $w) -or ($m[$j][$i+1] -ne 'x') -or ($j+1 -ge $h) -or ($m[$j+1][$i] -ne 'x') -or ($j+2 -ge $h) -or ($m[$j+2][$i] -ne 'x')
    $col = if($edge -and $j -ge 2){$dark}else{$main}; $l.SetPixel($x+$i,$y+$j,(C $col)) } } }
  Box $l ($x+2) ($y+1) 2 1 '#ffd0d0'; Box $l ($x+1) ($y+2) 1 2 '#ffd0d0'
  Put $icon $l }
Heart $hp $small 1 2 '#f0505a' '#a81428'
Heart $hp $small 14 2 '#f0505a' '#a81428'
Heart $hp $big 5 9 '#ee2430' '#9a0e1e'

$out = 'img\codex\upicon'; New-Item -ItemType Directory -Force $out | Out-Null
$camp = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\ev_campfire_i.png'))
$set = [ordered]@{ start=$camp; bag=$bag; shopSlot=$shop; startGold=$gold; t_hp=$hp }
foreach($k in $set.Keys){ if($k -ne 'start'){ $set[$k].Save([IO.Path]::GetFullPath("$out\up_$k.png")) } }

# preview: cells as in the game (56x46, line colour), x4; bottom row = real size x2
$cols = @{ start='#9a5a24'; bag='#7a5230'; shopSlot='#1f6e6a'; startGold='#8a3f58'; t_hp='#6b5f78' }
$s = New-Object System.Drawing.Bitmap (5*70*4), (70*4 + 140); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#17141d')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($k in $set.Keys){
  $cell = New-Object System.Drawing.Bitmap 64,54; $cg=[System.Drawing.Graphics]::FromImage($cell); $cg.InterpolationMode='NearestNeighbor'; $cg.PixelOffsetMode='Half'
  $cg.Clear((C '#17141d')); $cg.FillRectangle((New-Object System.Drawing.SolidBrush (C '#ffd34d')),2,2,60,50); $cg.FillRectangle((New-Object System.Drawing.SolidBrush (C $cols[$k])),4,4,56,46)
  $cg.DrawImage($set[$k],20,15,24,24); $cg.Dispose()
  $g.DrawImage($cell, $i*280+12, 20, 256, 216); $g.DrawImage($cell, $i*280+76, 270, 128, 108); $i++ }
$s.Save([IO.Path]::GetFullPath("$out\compare.png"))
