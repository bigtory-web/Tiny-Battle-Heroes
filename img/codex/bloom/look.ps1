# Bloom next to Blaze, Ivy, Cora at the same pixel scale (feet on one line), and sizes
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1536,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($n in 'sprout','flame','vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$n.png"))
  $x0=64;$x1=0;$y0=64; for($y=0;$y -lt $im.Height;$y++){ for($x=0;$x -lt $im.Width;$x++){ if($im.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x}; if($y -lt $y0){$y0=$y} } } }
  "$n canvas $($im.Width)x$($im.Height) sprite $($x1-$x0+1)x$($im.Height-$y0)"
  $g.DrawImage($im,($i*384),10,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\bloom\look.png'))
