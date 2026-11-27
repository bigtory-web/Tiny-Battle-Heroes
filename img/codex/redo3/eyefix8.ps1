# Cora: brow 1 px on the left; right eye = mirror of the left (white 1 + iris 2, 3 tall), 1 px higher.  Stray light edge pixels -> brown outline.
Add-Type -AssemblyName System.Drawing
function Load($n){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$n.png")); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$b=Load 'coral_new8'
$skin=$b.GetPixel(36,35); $dark=$b.GetPixel(38,34); $iris1=$b.GetPixel(38,35); $iris2=$b.GetPixel(38,36); $white=$b.GetPixel(37,35)
foreach($x in 35..39){ $b.SetPixel($x,32,$skin) }; foreach($x in 35,36){ $b.SetPixel($x,34,$skin) }
foreach($x in 45,46){ $b.SetPixel($x,33,$dark); $b.SetPixel($x,34,$iris1); $b.SetPixel($x,35,$iris2) }
foreach($y in 33..35){ $b.SetPixel(47,$y,$white) }
foreach($x in 45..47){ $b.SetPixel($x,36,$skin) }; foreach($y in 33..36){ $b.SetPixel(48,$y,$skin) }
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new9.png'))
$f=Load 'flame_new8'; $f.SetPixel(35,21,$f.GetPixel(36,21)); $o=[System.Drawing.ColorTranslator]::FromHtml('#450e05'); $f.SetPixel(35,21,$o); $f.Save([IO.Path]::GetFullPath('img\codex\redo3\flame_new9.png'))
$v=Load 'vine_new8'; foreach($p in @(@(40,44),@(42,44),@(34,56),@(42,56))){ $v.SetPixel($p[0],$p[1],[System.Drawing.ColorTranslator]::FromHtml('#450b01')) }; $v.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_new9.png'))
# face + head zoom, large
$z=New-Object System.Drawing.Bitmap 1560,560; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($spec in @(@('coral_new9',24,14),@('flame_new9',14,21),@('vine_new9',8,23))){ $im=Load $spec[0]
  $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*520+5),5,510,540),(New-Object System.Drawing.Rectangle $spec[1],$spec[2],34,36),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\heads9.png'))
