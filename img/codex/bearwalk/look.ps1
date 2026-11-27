Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1536,900; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bear.png')); "bear $($s.Width)x$($s.Height)"; $g.DrawImage($s,0,0,384,384)
$k=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bear_atk.png')); $g.DrawImage($k,400,0,384,384)
$a=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bear_anim.png')); "anim $($a.Width)x$($a.Height)"
for($i=0;$i -lt 8;$i++){ $g.DrawImage($a,(New-Object System.Drawing.Rectangle (($i%4)*384),(450+[math]::Floor($i/4)*225),224,224),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\look.png'))
