# last checks: hair pixels touching skin -> brown line; heights from the ground; final sheet (knight, Blaze, Ivy, Cora)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 200 }
$v=Load 'img\codex\redo3\vine_new11.png'; $c=$v.GetPixel(18,38); if($c.R -gt 150){ $v.SetPixel(18,38,[System.Drawing.ColorTranslator]::FromHtml('#450b01')) }; $v.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_new11.png'))
$k=Load 'img\codex\redo3\coral_new11.png'; $n=0
for($y=20;$y -lt 46;$y++){ for($x=1;$x -lt 63;$x++){ $c=$k.GetPixel($x,$y); if(-not ($c.A -and $c.B -gt ($c.R+30))){continue}
    foreach($dd in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($k.GetPixel($x+$dd[0],$y+$dd[1]))){ $n++; break } } } }
"coral hair touching skin: $n"
foreach($id in 'flame','vine','coral'){ $im=Load "img\codex\redo3\${id}_new11.png"; $x0=64;$x1=-1;$y0=64; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if($im.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x}; if($y -lt $y0){$y0=$y} } } }; "$id size $($x1-$x0+1)x$(64-$y0)  x $x0..$x1" }
$o=New-Object System.Drawing.Bitmap 1536,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\knight.png','img\codex\redo3\flame_new11.png','img\codex\redo3\vine_new11.png','img\codex\redo3\coral_new11.png'){ $im=Load $f; $g.DrawImage($im,$i*384,10,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\final11.png'))
# left boot sole: join the broken outline on the bottom row
$b=Load 'img\codex\redo3\coral_new11.png'; foreach($x in 23..27){ $b.SetPixel($x,63,[System.Drawing.ColorTranslator]::FromHtml('#470901')) }; $b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new11.png'))
$g.Dispose(); $o=New-Object System.Drawing.Bitmap 1536,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\knight.png','img\codex\redo3\flame_new11.png','img\codex\redo3\vine_new11.png','img\codex\redo3\coral_new11.png'){ $im=Load $f; $g.DrawImage($im,$i*384,10,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\final11.png'))
