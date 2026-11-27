# game anim strip (8 x 64) -> 4 columns x 2 rows, 8x, on magenta; and the new still 8x
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame_anim.png'))
$o=New-Object System.Drawing.Bitmap 2048,1024; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 8;$i++){ $g.DrawImage($src,(New-Object System.Drawing.Rectangle (($i%4)*512),([math]::Floor($i/4)*512),512,512),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\flame_sheet_x8.png'))
