# Cora (redrawn smaller): pixel eyes broke when sampled. Both eyes white 1 + iris 2, 3 rows; left one row lower with a drooping brow;
# gap 3; face line right where the right eye ends; bangs in brown; then shift so the face sits like Blaze's.
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$b=Load 'img\codex\redo3\coral_p17.6_64.png'; $r=Load 'img\codex\redo3\coral_new10.png'
$line=$b.GetPixel(36,39); $skin=$b.GetPixel(37,40); $white=$r.GetPixel(31,35); $d=$r.GetPixel(32,34); $a1=$r.GetPixel(32,35); $a2=$r.GetPixel(32,36)
if($line.R -gt 110 -or $skin.G -lt 180){ throw "bad sample colours" }
# middle strand outline one row up
foreach($x in 36..39){ $b.SetPixel($x,37,$skin); $b.SetPixel($x,36,$line) }
# right eye and brow
foreach($x in 40..42){ $b.SetPixel($x,38,$line) }
foreach($x in 40,41){ $b.SetPixel($x,39,$d); $b.SetPixel($x,40,$a1); $b.SetPixel($x,41,$a2) }; foreach($y in 39..41){ $b.SetPixel(42,$y,$white) }
# left brow (droops at the outer end) and eye, one row lower
$b.SetPixel(33,39,$skin); foreach($x in 34..36){ $b.SetPixel($x,39,$line) }; $b.SetPixel(33,40,$line)
foreach($y in 40..42){ $b.SetPixel(34,$y,$white) }; foreach($x in 35,36){ $b.SetPixel($x,40,$d); $b.SetPixel($x,41,$a1); $b.SetPixel($x,42,$a2) }
$o=New-Object System.Drawing.Bitmap 64,64
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$b.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-4,$y,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new11.png'))
Copy-Item img\codex\redo3\flame_new9.png img\codex\redo3\flame_new11.png -Force
$z=New-Object System.Drawing.Bitmap 1210,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($o,(New-Object System.Drawing.Rectangle 0,0,600,520),(New-Object System.Drawing.Rectangle 22,28,22,19),[System.Drawing.GraphicsUnit]::Pixel)
$f=Load 'img\codex\redo3\flame_new9.png'; $g.DrawImage($f,(New-Object System.Drawing.Rectangle 610,0,600,520),(New-Object System.Drawing.Rectangle 23,29,22,19),[System.Drawing.GraphicsUnit]::Pixel)
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_eye_compare.png'))
