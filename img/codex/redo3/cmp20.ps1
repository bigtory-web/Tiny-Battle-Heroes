Add-Type -AssemblyName System.Drawing
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
$o=New-Object System.Drawing.Bitmap 1300,640; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage((Load 'img\codex\redo3\coral_new19.png'),(New-Object System.Drawing.Rectangle 0,0,640,640),(New-Object System.Drawing.Rectangle 6,18,46,46),[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage((Load 'img\codex\redo3\coral_new20raw.png'),(New-Object System.Drawing.Rectangle 660,0,640,640),(New-Object System.Drawing.Rectangle 12,18,46,46),[System.Drawing.GraphicsUnit]::Pixel)
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\cmp20.png'))
