# A: current art, only the face replaced by the template (smaller), freed skin filled with hair.
# B: the redrawn one with colours snapped back to the current palette (face pixels kept as stamped).
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 205 }
$now=Load 'img\p\sprout.png'
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$now.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
function Snap($c){ $best=1e9; $r=$c; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$r=$p} }; $r }
function Hairline($b,$line,$y0,$y1,$x0,$x1){ $list=@(); foreach($y in $y0..$y1){ foreach($x in $x0..$x1){ $c=$b.GetPixel($x,$y); if(-not ($c.A -and $c.R -gt 180 -and $c.G -gt 100 -and $c.G -lt 200 -and $c.B -lt 100)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $list+=,@($x,$y); break } } } }; foreach($p in $list){ $b.SetPixel($p[0],$p[1],$line) } }
# B
$b=Load 'img\codex\bloom\b_face.png'; $cache=@{}
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if($x -ge 30 -and $x -le 41 -and $y -ge 38 -and $y -le 45){continue}; $c=$b.GetPixel($x,$y); if(-not $c.A){continue}; $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){$cache[$k]=Snap $c}; $b.SetPixel($x,$y,$cache[$k]) } }
$line=$b.GetPixel(30,45); Hairline $b $line 34 44 26 44; $b.Save([IO.Path]::GetFullPath('img\codex\bloom\sprout_B.png'))
# A
$a=Load 'img\p\sprout.png'; $hair=$a.GetPixel(27,30); $line=$a.GetPixel(30,43)
for($y=35;$y -le 42;$y++){ for($x=29;$x -le 42;$x++){ $c=$a.GetPixel($x,$y); if(-not $c.A){continue}
    $inFace = (IsSkin $c) -or ($c.R -gt 235 -and $c.G -gt 220) -or ($x -ge 29 -and $x -le 42 -and $c.R -lt 140 -and $c.G -lt 80 -and $y -ge 35 -and $y -le 40 -and $x -le 41)
    if($inFace){ $a.SetPixel($x,$y,$hair) } } }
$a.Save([IO.Path]::GetFullPath('img\codex\bloom\a_pre.png'))
$d=$now.GetPixel(32,37); $l=$now.GetPixel(32,39)
"A iris #{0:x2}{1:x2}{2:x2},#{3:x2}{4:x2}{5:x2}" -f $d.R,$d.G,$d.B,$l.R,$l.G,$l.B | Out-File img\codex\bloom\iris_a.txt -Encoding ascii
# touch-ups: B - the bang line sat on top of the left brow (looked 2 px thick); A - stray skin dots in the hair
$b=Load 'img\codex\bloom\sprout_B.png'; $hairB=$b.GetPixel(28,38)
for($y=36;$y -le 38;$y++){ for($x=31;$x -le 36;$x++){ $b.SetPixel($x,$y,$hairB) } }; $b.SetPixel(40,36,$hairB); $b.Save([IO.Path]::GetFullPath('img\codex\bloom\sprout_B.png'))
$a=Load 'img\codex\bloom\a_pre.png'; $hairA=$a.GetPixel(27,30); foreach($p in @(@(34,34),@(42,33),@(41,33),@(42,34),@(41,34))){ $c=$a.GetPixel($p[0],$p[1]); if(IsSkin $c){ $a.SetPixel($p[0],$p[1],$hairA) } }; $a.Save([IO.Path]::GetFullPath('img\codex\bloom\a_pre.png'))
