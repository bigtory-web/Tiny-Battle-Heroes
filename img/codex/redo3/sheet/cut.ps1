# 4x2 sheet -> 8 frames of 64x64: sample the middle of each sprite pixel, key magenta, snap to the new still's palette,
# then one common offset (frame 1 = the still's feet) so the motion between frames is kept
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\sheet\flame_src.png'))
$still=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\flame_new9.png'))
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
$cw=$src.Width/4.0; $ch=$src.Height/2.0; $cache=@{}; $frames=@()
for($i=0;$i -lt 8;$i++){ $f=New-Object System.Drawing.Bitmap 64,64
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
      $px=[int][math]::Floor(($i%4)*$cw+($x+0.5)*$cw/64); $py=[int][math]::Floor([math]::Floor($i/4)*$ch+($y+0.5)*$ch/64); $c=$src.GetPixel($px,$py)
      if($c.R -gt 180 -and $c.B -gt 180 -and $c.G -lt 100){continue}
      $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$cache[$k]=$p} } }
      $f.SetPixel($x,$y,$cache[$k]) } }
  $frames+=$f }
function Feet($b){ $y1=-1; for($y=63;$y -ge 0 -and $y1 -lt 0;$y--){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){$y1=$y;break} } }
  $a=999;$z=0; for($y=$y1-2;$y -le $y1;$y++){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){ if($x -lt $a){$a=$x}; if($x -gt $z){$z=$x} } } }; return @((($a+$z)/2.0),$y1) }
$s=Feet $still; $f0=Feet $frames[0]; $dx=[int][math]::Round($s[0]-$f0[0]); $dy=$s[1]-$f0[1]; "offset $dx,$dy"
$out=New-Object System.Drawing.Bitmap 512,64
for($i=0;$i -lt 8;$i++){ $ft=Feet $frames[$i]; "frame $($i+1): feet $($ft[0]),$($ft[1])"
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$frames[$i].GetPixel($x,$y); $nx=$x+$dx; $ny=$y+$dy; if($c.A -and $nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64){ $out.SetPixel($i*64+$nx,$ny,$c) } } } }
$out.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\flame_anim_new.png'))
# preview: current strip on top, new below (4 per row)
$cur=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame_anim.png'))
$pv=New-Object System.Drawing.Bitmap 1536,1540; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($strip in $cur,$out){ for($i=0;$i -lt 8;$i++){ $g.DrawImage($strip,(New-Object System.Drawing.Rectangle (($i%4)*384),($row*768+[math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }; $row++ }
$g.FillRectangle([System.Drawing.Brushes]::White,0,768,1536,4)
$pv.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\compare_anim.png'))
