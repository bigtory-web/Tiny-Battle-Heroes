# current strip (top) vs new strip (bottom), 4 per row
Add-Type -AssemblyName System.Drawing
$pv=New-Object System.Drawing.Bitmap 1536,1540; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($f in 'img\p\flame_anim.png','img\codex\redo3\final\flame_anim.png'){ $strip=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); for($i=0;$i -lt 8;$i++){ $g.DrawImage($strip,(New-Object System.Drawing.Rectangle (($i%4)*384),($row*768+[math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }; $strip.Dispose(); $row++ }
$g.FillRectangle([System.Drawing.Brushes]::White,0,768,1536,4); $pv.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_anim_compare.png'))
