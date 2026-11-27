# brown line where golden hair touches the face, then compare: now / new, next to Blaze, Ivy, Cora
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 200 }
$b=Load 'img\codex\bloom\b_face.png'; $line=$b.GetPixel(30,45); if($line.R -gt 110){ throw "bad line" }
$list=@(); foreach($y in 34..44){ foreach($x in 26..44){ $c=$b.GetPixel($x,$y); if(-not ($c.A -and $c.R -gt 200 -and $c.G -gt 100 -and $c.G -lt 210 -and $c.B -lt 80)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $list+=,@($x,$y); break } } } }
foreach($p in $list){ $b.SetPixel($p[0],$p[1],$line) }; "hair-face line pixels $($list.Count)"
$b.Save([IO.Path]::GetFullPath('img\codex\bloom\sprout_new.png'))
$o=New-Object System.Drawing.Bitmap 1920,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\sprout.png','img\codex\bloom\sprout_new.png','img\p\flame.png','img\p\vine.png','img\p\coral.png'){ $g.DrawImage((Load $f),$i*384,10,384,384); $i++ }
$g.FillRectangle([System.Drawing.Brushes]::White,766,20,4,360); $o.Save([IO.Path]::GetFullPath('img\codex\bloom\compare.png'))
