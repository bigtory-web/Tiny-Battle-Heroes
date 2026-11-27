# the 8 faces, large, same window in every frame
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\sheet\flame_anim_new.png'))
$o=New-Object System.Drawing.Bitmap 1680,640; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#222222')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 8;$i++){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle (($i%4)*420+5),([math]::Floor($i/4)*320+5),410,310),(New-Object System.Drawing.Rectangle ($i*64+25),35,16,12),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\faces.png'))
