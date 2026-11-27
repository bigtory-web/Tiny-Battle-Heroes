# the game's big face icon (same rule as index.html faceAt): Blaze, Ivy, Cora from the game files
Add-Type -AssemblyName System.Drawing
function Face($im){ $s=$im.Width; $x0=$s;$x1=0; for($y=[int]($s*0.6);$y -lt $s;$y++){ for($x=0;$x -lt $s;$x++){ if($im.GetPixel($x,$y).A -gt 40){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x} } } }
  $cx=($x0+$x1)/2.0; $top=-1; for($y=0;$y -lt $s -and $top -lt 0;$y++){ $n=0; for($x=[int][math]::Round($cx-$s*0.18);$x -le $cx+$s*0.18;$x++){ if($x -ge 0 -and $x -lt $s -and $im.GetPixel($x,$y).A -gt 40){$n++} }; if($n -ge 4){$top=$y} }
  $sx=0.0;$k=0; for($y=$top;$y -lt [math]::Min($s,$top+$s*0.28);$y++){ for($x=[int][math]::Round($cx-$s*0.24);$x -le $cx+$s*0.24;$x++){ if($x -ge 0 -and $x -lt $s -and $im.GetPixel($x,$y).A -gt 40){ $sx+=$x+.5; $k++ } } }
  "  body span $x0..$x1 centre $cx, crop centre x $([math]::Round($sx/$k,1))" | Out-Host
  return @(($sx/$k/$s), ($top/[double]$s)) }
$o=New-Object System.Drawing.Bitmap 960,320; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$i=0; foreach($id in 'flame','vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$id.png")); $id; $fc=Face $im; $B=288; $bx=$i*320+16; $by=16
  $g.FillRectangle($slot,$bx,$by,$B,$B); $g.SetClip((New-Object System.Drawing.Rectangle $bx,$by,$B,$B)); $g.DrawImage($im,[int]($bx+$B*.5-$fc[0]*2.05*$B),[int]($by+$B*.03-$fc[1]*2.05*$B),[int](2.05*$B),[int](2.05*$B)); $g.ResetClip(); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\final\icons.png'))
