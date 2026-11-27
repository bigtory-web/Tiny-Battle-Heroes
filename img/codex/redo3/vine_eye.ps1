# Ivy: both eyes 3 rows (white 1 + iris 2); the left eye and its brow sit one row lower. Never balance by cutting a row.
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\vine_new9.png')); $b=New-Object System.Drawing.Bitmap $src
$white=$src.GetPixel(29,40); $dark=$src.GetPixel(30,39); $a1=$src.GetPixel(30,40); $a2=$src.GetPixel(30,41); $skin=$src.GetPixel(33,41); $line=$src.GetPixel(31,38)
# right eye: rows 39-41
foreach($x in 36,37){ $b.SetPixel($x,39,$dark); $b.SetPixel($x,40,$a1); $b.SetPixel($x,41,$a2) }; foreach($y in 39..41){ $b.SetPixel(38,$y,$white) }
# left brow and eye: one row down (rows 40-42, brow on 39)
foreach($x in 29..33){ $b.SetPixel($x,38,$skin) }; foreach($x in 29..32){ $b.SetPixel($x,39,$line) }; $b.SetPixel(33,39,$skin)
$b.SetPixel(29,40,$white); foreach($x in 30,31){ $b.SetPixel($x,40,$dark); $b.SetPixel($x,41,$a1); $b.SetPixel($x,42,$a2) }; $b.SetPixel(29,41,$white); $b.SetPixel(29,42,$white)
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_new11.png'))
$z=New-Object System.Drawing.Bitmap 1210,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($im in $src,$b){ $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*610),0,600,520),(New-Object System.Drawing.Rectangle 22,30,22,19),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_eye_compare.png'))
