# Cora: left brow droops at the outer end (still 1 px thick); every hair pixel that touches face skin becomes the brown line
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 225 -and $c.G -gt 140 -and $c.B -gt 85 -and $c.R -gt $c.G -and $c.G -gt $c.B -and ($c.R-$c.B) -gt 50 }
function IsHair($c){ $c.A -and $c.B -gt ($c.R+30) }
function Count($b){ $n=@(); for($y=1;$y -lt 50;$y++){ for($x=1;$x -lt 63;$x++){ if(-not (IsHair ($b.GetPixel($x,$y)))){continue}
      foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($b.GetPixel($x+$d[0],$y+$d[1]))){ $n+=,@($x,$y); break } } } }; return ,$n }
$b=Load 'img\codex\redo3\coral_new9.png'
$skin=$b.GetPixel(30,35); $line=$b.GetPixel(32,33); if($line.R -gt 90){ throw "line colour is not the outline" }
foreach($x in 29,30){ $b.SetPixel($x,33,$skin); $b.SetPixel($x,34,$line) }
$px=Count $b; "coral hair touching skin: $($px.Count)"
foreach($p in $px){ $b.SetPixel($p[0],$p[1],$line) }
"after: $((Count $b).Count)"
foreach($x in 34..37){ $b.SetPixel($x,32,$skin); $b.SetPixel($x,31,$line) }  # middle strand 1 px up so it does not run into the right brow
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new10.png'))
# before / after, large
$z=New-Object System.Drawing.Bitmap 1210,600; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'coral_new9','coral_new10'){ $im=Load "img\codex\redo3\$f.png"; $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*610),0,600,600),(New-Object System.Drawing.Rectangle 25,15,30,30),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\bangs_compare.png'))
