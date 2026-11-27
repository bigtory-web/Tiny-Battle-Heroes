# copy only the left twin tail + tie from the Codex result (raw x = ours + 6) and lower the left antler 1 px; everything else untouched
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$a=Load 'img\codex\redo3\coral_new19.png'; $r=Load 'img\codex\redo3\coral_new20raw.png'; $o=New-Object System.Drawing.Bitmap $a
foreach($y in 29..49){ foreach($x in 4..26){ if($y -ge 49 -and $x -le 22){continue}; $o.SetPixel($x,$y,$r.GetPixel($x+6,$y)) } }
$snap=New-Object System.Drawing.Bitmap $o
foreach($x in 18..28){ foreach($y in 22..29){ $c=$a.GetPixel($x,$y-1); $keep=$snap.GetPixel($x,$y)
    if($y -le 28){ $o.SetPixel($x,$y,$c) } elseif($c.A){ $o.SetPixel($x,$y,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new21.png'))
$z=New-Object System.Drawing.Bitmap 1300,640; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($im in $a,$o){ $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*660),0,640,640),(New-Object System.Drawing.Rectangle 6,18,46,46),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\cmp21.png'))
$o.SetPixel(21,38,$o.GetPixel(20,29)); if($o.GetPixel(21,38).R -gt 110){ $o.SetPixel(21,38,[System.Drawing.ColorTranslator]::FromHtml('#4a0802')) }; $o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new21.png'))
$f=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($f); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,0,10,384,384); $g.DrawImage($o,396,10,384,384); $f.Save([IO.Path]::GetFullPath('img\codex\redo3\full21.png'))
$z=New-Object System.Drawing.Bitmap 1300,640; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($im in $a,$o){ $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*660),0,640,640),(New-Object System.Drawing.Rectangle 6,18,46,46),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\cmp21.png'))
