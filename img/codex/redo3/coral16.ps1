# Cora falling-curl draft: eyes to the rules (white 1 + iris 2, 3 rows, left one lower), droop, jaw, open parting, brown bang line
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 120 -and $c.B -lt 200 }
$b=Load 'img\codex\redo3\coral_new15raw.png'; $ref=Load 'img\codex\redo3\coral_new14.png'
$skin=$b.GetPixel(40,43); $line=$b.GetPixel(40,46)
if(-not (IsSkin $skin) -or $line.R -gt 110){ throw "bad sample $skin $line" }
# copy the already checked face (eyes and brows) from the previous draft: it sat 6 px to the left there
foreach($y in 39..43){ foreach($x in 35..45){ $c=$ref.GetPixel($x-6,$y); if($c.A){ $b.SetPixel($x,$y,$c) } } }
$b.SetPixel(44,43,$skin); $b.SetPixel(40,37,$skin); $b.SetPixel(40,38,$skin)
$list=@(); foreach($y in 32..39){ foreach($x in 30..47){ $c=$b.GetPixel($x,$y); if(-not ($c.A -and $c.B -gt ($c.R+30))){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $list+=,@($x,$y); break } } } }
foreach($p in $list){ $b.SetPixel($p[0],$p[1],$line) }
"bang line pixels $($list.Count)"
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new16.png'))
foreach($p in @(@(31,46),@(32,46),@(16,57),@(22,62))){ $b.SetPixel($p[0],$p[1],$line) }
$o=New-Object System.Drawing.Bitmap 64,64; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$b.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-6,$y,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new16.png'))
