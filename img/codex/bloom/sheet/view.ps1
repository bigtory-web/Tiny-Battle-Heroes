Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\sprout_anim.png')); $a=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\sprout_atk.png'))
$o=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 4;$i++){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle ($i*384),0,384,384),(New-Object System.Drawing.Rectangle ((4+$i)*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$g.DrawImage($a,0,384,384,384); "atk $($a.Width)x$($a.Height)"; $o.Save([IO.Path]::GetFullPath('img\codex\bloom\sheet\current.png'))
