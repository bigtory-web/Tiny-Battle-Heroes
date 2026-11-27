# Cora twin-curl draft: droop on the left brow, one jaw pixel, calm the speckled bangs and give them the brown line
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 120 -and $c.B -lt 200 }
function IsHair($c){ $c.A -and (($c.B -gt ($c.R+30)) -or ($c.R -gt 225 -and $c.G -gt 235 -and $c.B -gt 240)) }
$b=Load 'img\codex\redo3\coral_new13raw.png'
$skin=$b.GetPixel(40,43); $line=$b.GetPixel(40,46)
if(-not (IsSkin $skin) -or $line.R -gt 110){ throw "bad sample $skin $line" }
$b.SetPixel(35,41,$line); $b.SetPixel(44,43,$skin)
$o=0; foreach($y in 33..39){ foreach($x in 33..46){ $c=$b.GetPixel($x,$y); if($c.A -and $c.R -gt 215 -and $c.G -gt 125 -and $c.G -lt 180 -and $c.B -lt 130){ $b.SetPixel($x,$y,$skin); $o++ } } }
$list=@(); foreach($y in 32..45){ foreach($x in 30..47){ $h=$b.GetPixel($x,$y); if(-not (IsHair $h) -or ($y -ge 39 -and $h.R -gt 225 -and $h.G -gt 235)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $list+=,@($x,$y); break } } } }
foreach($p in $list){ $b.SetPixel($p[0],$p[1],$line) }
"orange speckles $o, bang line pixels $($list.Count)"
# a lone one-pixel strand in the middle of the forehead reads as a brown stick: open the parting; one orange dot left
$b.SetPixel(40,37,$skin); $b.SetPixel(40,38,$skin); $b.SetPixel(36,37,$skin)
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new14.png'))
$z=New-Object System.Drawing.Bitmap 1210,600; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'coral_new13raw','coral_new14'){ $im=Load "img\codex\redo3\$f.png"; $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*610),0,600,600),(New-Object System.Drawing.Rectangle 25,22,30,30),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\coral14_face.png'))
# outline gaps on the curls, then move the body so the face sits like Blaze's (the mace was counted as feet)
foreach($p in @(@(52,33),@(52,34),@(53,36),@(53,37),@(30,38),@(53,38),@(52,40),@(52,41))){ $b.SetPixel($p[0],$p[1],$line) }
$o=New-Object System.Drawing.Bitmap 64,64; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$b.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-6,$y,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new14.png'))
