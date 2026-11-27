# eye gap (columns between the two irises) and face size on the eye row; heads side by side at one scale
Add-Type -AssemblyName System.Drawing
function IsAmber($c){ $c.A -and $c.R -gt 170 -and $c.R -lt 240 -and $c.G -gt 85 -and $c.G -lt 170 -and $c.B -lt 45 }
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 200 }
$files='img\p\knight.png','img\codex\redo3\flame_new9.png','img\codex\redo3\vine_new9.png','img\codex\redo3\coral_new10.png','img\p\coral.png'
$z=New-Object System.Drawing.Bitmap 1650,420; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in $files){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
  # lowest amber row pair = the eyes (hair and robes can be amber too: only pixels next to a white eye pixel count)
  $eye=@(); for($y=[int]($im.Height*0.45);$y -lt [int]($im.Height*0.8);$y++){ for($x=3;$x -lt $im.Width-3;$x++){ if(-not (IsAmber ($im.GetPixel($x,$y)))){continue}
      $w=$false; foreach($dx in -2,-1,1,2){ $c=$im.GetPixel($x+$dx,$y); if($c.A -and $c.R -gt 235 -and $c.G -gt 235){$w=$true} }; if($w){$eye+=,@($x,$y)} } }
  $xs=$eye|ForEach-Object{$_[0]}|Sort-Object -Unique; $ys=$eye|ForEach-Object{$_[1]}|Sort-Object -Unique
  $gap=0; $split=0; for($k=1;$k -lt $xs.Count;$k++){ $d=$xs[$k]-$xs[$k-1]-1; if($d -gt $gap){$gap=$d;$split=$xs[$k-1]} }
  $ey=$ys[0]
  # face width: skin / eye run on the first iris row, from the leftmost to rightmost skin pixel
  $a=999;$b=0; for($x=0;$x -lt $im.Width;$x++){ if((IsSkin ($im.GetPixel($x,$ey))) -and $x -ge $xs[0]-4 -and $x -le $xs[-1]+4){ if($x -lt $a){$a=$x}; if($x -gt $b){$b=$x} } }
  $chin=$ey; for($y=$ey;$y -lt $ey+10;$y++){ if(IsSkin ($im.GetPixel($split+2,$y))){$chin=$y} }
  "{0}: iris cols {1}  gap {2}  skin x {3}..{4} (width {5})  eye row {6} chin row {7}" -f $f,($xs -join ','),$gap,$a,$b,($b-$a+1),$ey,$chin
  $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*330+5),5,320,400),(New-Object System.Drawing.Rectangle ($split-14),($ey-24),32,40),[System.Drawing.GraphicsUnit]::Pixel); $im.Dispose(); $i++ }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\heads_measure.png'))
