Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\coral_new11.png'))
$o=New-Object System.Drawing.Bitmap 880,880; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($im,(New-Object System.Drawing.Rectangle 0,0,880,880),(New-Object System.Drawing.Rectangle 8,20,44,44),[System.Drawing.GraphicsUnit]::Pixel); $o.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_zoom.png'))
