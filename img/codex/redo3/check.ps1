# face zoom (top: current, bottom: new) + size / width / outline-gap counts against the knight
param([string]$Suffix='new2')
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1500,800; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Stat($f){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $x0=999;$x1=-1;$y0=999;$y1=-1;$vivid=0;$n=0;$gap=0
  for($y=0;$y -lt $im.Height;$y++){ for($x=0;$x -lt $im.Width;$x++){ $c=$im.GetPixel($x,$y); if($c.A -lt 128){continue}; $n++
    if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x}; if($y -lt $y0){$y0=$y}; if($y -gt $y1){$y1=$y}
    $mx=[math]::Max($c.R,[math]::Max($c.G,$c.B)); $mn=[math]::Min($c.R,[math]::Min($c.G,$c.B)); if($mx -gt 200 -and ($mx-$mn)/$mx -gt 0.8){$vivid++}
    # silhouette pixel that is not dark = outline gap
    $edge=$false; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $a=$x+$d[0]; $b=$y+$d[1]; if($a -lt 0 -or $b -lt 0 -or $a -ge $im.Width -or $b -ge $im.Height){$edge=$true} elseif($im.GetPixel($a,$b).A -lt 128){$edge=$true} }
    if($edge -and (0.3*$c.R+0.59*$c.G+0.11*$c.B) -gt 90){$gap++} } }
  $im.Dispose(); '{0}: {1}x{2} vivid {3}% outlinegap {4}' -f $f,($x1-$x0+1),($y1-$y0+1),[math]::Round(100*$vivid/$n),$gap }
Stat 'img\p\knight.png'
$i=0; foreach($id in 'flame','vine','coral'){
  $row=0; foreach($f in "img\p\$id.png","img\codex\redo3\${id}_$Suffix.png"){ Stat $f; $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
    # find the face: skin pixel rows in the middle of the canvas
    $sx=0;$sy=0;$k=0; for($y=[int]($im.Height*0.4);$y -lt [int]($im.Height*0.75);$y++){ for($x=0;$x -lt $im.Width;$x++){ $c=$im.GetPixel($x,$y); if($c.A -and $c.R -gt 235 -and $c.G -gt 190 -and $c.G -lt 230 -and $c.B -gt 140 -and $c.B -lt 190){$sx+=$x;$sy+=$y;$k++} } }
    $cx=[int]($sx/$k); $cy=[int]($sy/$k)
    $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*500+10),($row*400+10),480,384),(New-Object System.Drawing.Rectangle ($cx-10),($cy-10),20,16),[System.Drawing.GraphicsUnit]::Pixel); $im.Dispose(); $row++ }
  $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\faces.png'))
