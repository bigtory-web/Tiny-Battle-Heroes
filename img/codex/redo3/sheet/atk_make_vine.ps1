# current attack frames 5-8 as a 2x2 sheet (8x, magenta) and the confirmed still 8x
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\vine_anim.png'))
$o=New-Object System.Drawing.Bitmap 1024,1024; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 4;$i++){ $g.DrawImage($src,(New-Object System.Drawing.Rectangle (($i%2)*512),([math]::Floor($i/2)*512),512,512),(New-Object System.Drawing.Rectangle ((4+$i)*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\vine_atk_x8.png'))
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\final\vine.png')); $p=New-Object System.Drawing.Bitmap 512,512; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,512,512); $p.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\vine_still_x8.png'))
