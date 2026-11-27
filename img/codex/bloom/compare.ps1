Add-Type -AssemblyName System.Drawing
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
$o=New-Object System.Drawing.Bitmap 1920,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\sprout.png','img\codex\bloom\sprout_A.png','img\codex\bloom\sprout_B.png','img\p\flame.png','img\p\vine.png'){ $g.DrawImage((Load $f),$i*384,10,384,384); $i++ }
$g.FillRectangle([System.Drawing.Brushes]::White,1150,20,4,360); $o.Save([IO.Path]::GetFullPath('img\codex\bloom\compare.png'))
$z=New-Object System.Drawing.Bitmap 1250,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\sprout.png','img\codex\bloom\sprout_A.png','img\codex\bloom\sprout_B.png'){ $g.DrawImage((Load $f),(New-Object System.Drawing.Rectangle ($i*420),0,400,520),(New-Object System.Drawing.Rectangle 17,22,32,42),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\bloom\zoom.png'))
