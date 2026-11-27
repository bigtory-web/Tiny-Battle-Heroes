# face of each attack frame must equal the still; atk pose = frame 6 (book pushed forward); hair crop for the library
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\bloom\final\sprout.png'; $a=Load 'img\codex\bloom\final\sprout_anim.png'
foreach($i in 4..7){ $n=0; for($y=38;$y -le 45;$y++){ for($x=30;$x -le 41;$x++){ $p=$s.GetPixel($x,$y); if($p.A -and $p.ToArgb() -ne $a.GetPixel($i*64+$x,$y).ToArgb()){ $n++; $a.SetPixel($i*64+$x,$y,$p) } } }; "frame $($i+1): face pixels restored $n" }
$a.Save([IO.Path]::GetFullPath('img\codex\bloom\final\sprout_anim.png'))
$k=$a.Clone((New-Object System.Drawing.Rectangle (5*64),0,64,64),$a.PixelFormat); $k.Save([IO.Path]::GetFullPath('img\codex\bloom\final\sprout_atk.png'))
$c=New-Object System.Drawing.Bitmap 34,28; for($y=0;$y -lt 28;$y++){ for($x=0;$x -lt 34;$x++){ $sx=$x+16; $sy=$y+19; if($sy -ge 45){continue}; $c.SetPixel($x,$y,$s.GetPixel($sx,$sy)) } }
$o=New-Object System.Drawing.Bitmap 272,224; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($c,0,0,272,224); $o.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\hair\sprout_fluffy.png'))
