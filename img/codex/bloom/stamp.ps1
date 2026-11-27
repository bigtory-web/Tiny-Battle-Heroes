# clear the old left brow line, stamp the face template with Bloom's own eye colours (left white at 32,40)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$b=Load 'img\codex\bloom\b_new2.png'
$dark=$b.GetPixel(32,39); $light=$b.GetPixel(32,42); $hair=$b.GetPixel(28,38)
"iris dark #{0:x2}{1:x2}{2:x2} light #{3:x2}{4:x2}{5:x2}  hair #{6:x2}{7:x2}{8:x2}" -f $dark.R,$dark.G,$dark.B,$light.R,$light.G,$light.B,$hair.R,$hair.G,$hair.B | Out-File img\codex\bloom\iris.txt -Encoding ascii
foreach($x in 30..34){ $b.SetPixel($x,38,$hair) }
$b.Save([IO.Path]::GetFullPath('img\codex\bloom\b_pre.png'))
