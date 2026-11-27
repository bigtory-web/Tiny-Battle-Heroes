# sheet: sprites (knight / current / B / E / F), their face-crop icons (same rule as the game), and on the cave floor
Add-Type -AssemblyName System.Drawing
$files='img\p\knight.png','img\p\thunderbird.png','img\pixellab\redo\tora_d_64.png','img\pixellab\redo\tora_e_64.png','img\pixellab\redo\tora_f_64.png'
function On($im,$x,$y){ $x -ge 0 -and $y -ge 0 -and $x -lt $im.Width -and $y -lt $im.Height -and $im.GetPixel($x,$y).A -gt 40 }
function Face($im){ $w=$im.Width; $h=$im.Height; $x0=$w; $x1=0
  for($y=[math]::Floor($h*.6);$y -lt $h;$y++){ for($x=0;$x -lt $w;$x++){ if(On $im $x $y){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x} } } }
  $cx=($x0+$x1)/2.0; $top=-1
  for($y=0;$y -lt $h -and $top -lt 0;$y++){ $n=0; for($x=[int][math]::Round($cx-$w*.18);$x -le $cx+$w*.18;$x++){ if(On $im $x $y){$n++} }; if($n -ge 4){$top=$y} }
  $sx=0.0;$k=0; for($y=$top;$y -lt [math]::Min($h,$top+$h*.28);$y++){ for($x=[int][math]::Round($cx-$w*.24);$x -le $cx+$w*.24;$x++){ if(On $im $x $y){ $sx+=$x+.5; $k++ } } }
  return @(($sx/$k/$w), ($top/$h)) }
$o=New-Object System.Drawing.Bitmap 2000,880; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$bg=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_cave.png'))
$g.DrawImage($bg,(New-Object System.Drawing.Rectangle 0,620,2000,260),(New-Object System.Drawing.Rectangle 100,262,500,65),[System.Drawing.GraphicsUnit]::Pixel)
$slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$i=0; foreach($f in $files){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
  $g.DrawImage($im,($i*400+(400-$im.Width*6)/2),(400-$im.Height*6),($im.Width*6),($im.Height*6))
  $fc=Face $im; $B=144; $FZ=2.05; $bx=$i*400+128; $by=430
  $g.FillRectangle($slot,$bx,$by,$B,$B); $g.SetClip((New-Object System.Drawing.Rectangle $bx,$by,$B,$B))
  $g.DrawImage($im,[int]($bx+$B*.5-$fc[0]*$FZ*$B),[int]($by+$B*.03-$fc[1]*$FZ*$B),[int]($FZ*$B),[int]($FZ*$B)); $g.ResetClip()
  $g.DrawImage($im,($i*400+(400-$im.Width*3)/2),(865-$im.Height*3),($im.Width*3),($im.Height*3)); $i++ }
$o.Save([IO.Path]::GetFullPath('img\pixellab\redo\tora_compare.png'))
