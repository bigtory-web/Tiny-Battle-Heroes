# composite on the battle ground at game scale with the face-icon crop (same rule as index.html faceAt), plus body zooms
param([string]$Suffix='new3')
Add-Type -AssemblyName System.Drawing
function Face($im){ $s=$im.Width; $x0=$s;$x1=0; for($y=[int]($s*0.6);$y -lt $s;$y++){ for($x=0;$x -lt $s;$x++){ if($im.GetPixel($x,$y).A -gt 40){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x} } } }
  $cx=($x0+$x1)/2.0; $top=-1; for($y=0;$y -lt $s -and $top -lt 0;$y++){ $n=0; for($x=[int][math]::Round($cx-$s*0.18);$x -le $cx+$s*0.18;$x++){ if($x -ge 0 -and $x -lt $s -and $im.GetPixel($x,$y).A -gt 40){$n++} }; if($n -ge 4){$top=$y} }
  $sx=0.0;$k=0; for($y=$top;$y -lt [math]::Min($s,$top+$s*0.28);$y++){ for($x=[int][math]::Round($cx-$s*0.24);$x -le $cx+$s*0.24;$x++){ if($x -ge 0 -and $x -lt $s -and $im.GetPixel($x,$y).A -gt 40){ $sx+=$x+.5; $k++ } } }
  return @(($sx/$k/$s), ($top/[double]$s)) }
$o=New-Object System.Drawing.Bitmap 1440,960; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$bg=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_field.png')); $g.DrawImage($bg,(New-Object System.Drawing.Rectangle 0,0,1440,380),(New-Object System.Drawing.Rectangle 0,200,720,190),[System.Drawing.GraphicsUnit]::Pixel)
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#55607c'))),0,380,1440,580)
$slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$i=0; foreach($id in 'flame','vine','coral'){ $j=0; foreach($f in "img\p\$id.png","img\codex\redo3\${id}_$Suffix.png"){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
    $x=$i*480+$j*220+20; $g.DrawImage($im,$x,(340-$im.Height*3),($im.Width*3),($im.Height*3))
    $fc=Face $im; $B=96; $bx=$x+50; $by=390; $g.FillRectangle($slot,$bx,$by,$B,$B); $g.SetClip((New-Object System.Drawing.Rectangle $bx,$by,$B,$B)); $g.DrawImage($im,[int]($bx+$B*.5-$fc[0]*2.05*$B),[int]($by+$B*.03-$fc[1]*2.05*$B),[int](2.05*$B),[int](2.05*$B)); $g.ResetClip()
    $im.Dispose(); $j++ }
  $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${id}_$Suffix.png"))
  $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*480+10),500,460,450),(New-Object System.Drawing.Rectangle 6,29,48,35),[System.Drawing.GraphicsUnit]::Pixel); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\composite.png'))
