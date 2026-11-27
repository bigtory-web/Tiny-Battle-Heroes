# tidy the copied forehead: grey dots -> hair blue, drop the lone strand tip, brown line where hair meets the face
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 175 -and $c.B -gt 110 -and $c.B -lt 190 }
function IsHair($c){ $c.A -and $c.B -gt ($c.R+30) }
$b=Load 'img\codex\redo3\coral_new18.png'
$blue=$b.GetPixel(33,35); $skin=$b.GetPixel(34,38); $line=$b.GetPixel(34,35)
if($line.R -gt 110 -or -not (IsSkin $skin)){ throw "bad sample" }
foreach($p in @(@(32,35),@(32,37),@(38,37))){ $b.SetPixel($p[0],$p[1],$blue) }
$b.SetPixel(32,38,$skin); $b.SetPixel(33,38,$skin)
$list=@(); foreach($y in 33..38){ foreach($x in 28..39){ if(-not (IsHair ($b.GetPixel($x,$y)))){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $list+=,@($x,$y); break } } } }
foreach($p in $list){ $b.SetPixel($p[0],$p[1],$line) }
"line pixels $($list.Count)"
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new19.png'))
$a=Load 'img\codex\redo3\coral_new14.png'
$z=New-Object System.Drawing.Bitmap 1210,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,(New-Object System.Drawing.Rectangle 0,0,600,520),(New-Object System.Drawing.Rectangle 20,22,30,26),[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($b,(New-Object System.Drawing.Rectangle 610,0,600,520),(New-Object System.Drawing.Rectangle 20,22,30,26),[System.Drawing.GraphicsUnit]::Pixel)
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\bangs19.png'))
$f=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($f); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,0,10,384,384); $g.DrawImage($b,396,10,384,384); $f.Save([IO.Path]::GetFullPath('img\codex\redo3\full19.png'))
