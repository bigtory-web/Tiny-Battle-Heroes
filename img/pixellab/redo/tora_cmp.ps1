Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1792,460; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\knight.png','img\p\thunderbird.png','img\pixellab\redo\tora_c_64.png','img\pixellab\redo\tora_d_64.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $g.DrawImage($im,($i*448+(448-$im.Width*7)/2),(455-$im.Height*7),($im.Width*7),($im.Height*7)); $i++ }
$o.Save([IO.Path]::GetFullPath('img\pixellab\redo\tora_compare.png'))
