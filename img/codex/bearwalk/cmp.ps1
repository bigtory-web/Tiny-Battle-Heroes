# current still vs walk frame at one pixel scale, with sizes
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'bear64.png','walk1_new.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $x0=64;$x1=0;$y0=64; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if($im.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x}; if($y -lt $y0){$y0=$y} } } }; "$f sprite $($x1-$x0+1)x$(64-$y0) x $x0..$x1"; $g.DrawImage($im,($i*396),10,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('cmp1.png'))
