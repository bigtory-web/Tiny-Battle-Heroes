# paste the confirmed still's face INCLUDING the right outline column back onto Blaze's attack frames
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\p\flame.png'; $a=Load 'img\p\flame_anim.png'
foreach($i in 4..7){ for($y=35;$y -le 44;$y++){ for($x=28;$x -le 40;$x++){ $p=$s.GetPixel($x,$y); if($p.A){ $a.SetPixel($i*64+$x,$y,$p) } } } }
$a.Save([IO.Path]::GetFullPath('img\p\flame_anim.png')); $a.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_anim.png'))
