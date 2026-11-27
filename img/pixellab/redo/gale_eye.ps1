# Gale (mint): viewer's left eye one pixel lower (gaze about 20 degrees down).  b = brow moves with it
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\pixellab\redo\gale_n2_64.png'))
$skin=$src.GetPixel(34,32)
foreach($v in 'a','b'){
  $o=New-Object System.Drawing.Bitmap $src
  for($y=31;$y -le 34;$y++){ for($x=28;$x -le 32;$x++){ $o.SetPixel($x,($y+1),$src.GetPixel($x,$y)) } }
  for($x=28;$x -le 32;$x++){ $o.SetPixel($x,31,$skin) }
  if($v -eq 'b'){
    for($y=28;$y -le 29;$y++){ for($x=28;$x -le 33;$x++){ $o.SetPixel($x,($y+1),$src.GetPixel($x,$y)) } }
    for($x=28;$x -le 33;$x++){ $o.SetPixel($x,28,$src.GetPixel($x,27)) } }
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$o.GetPixel($x,$y); if($c.A -and $c.R -lt 90 -and $c.G -lt 30 -and $c.B -gt 28){ $o.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml('#391a0c')) } } }
  $o.Save([IO.Path]::GetFullPath("img\pixellab\redo\gale_eye_$v.png")) }
# preview: face zoom (before, a, b) and full sprites next to the knight
$pv=New-Object System.Drawing.Bitmap 1170,760; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'gale_n2_64','gale_eye_a','gale_eye_b'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\pixellab\redo\$f.png"))
  $g.DrawImage($im,(New-Object System.Drawing.Rectangle (5+$i*390),5,380,320),(New-Object System.Drawing.Rectangle 25,24,19,16),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($im,($i*390+3),360,384,384); $i++ }
$pv.Save([IO.Path]::GetFullPath('img\pixellab\redo\gale_eye_compare.png'))
