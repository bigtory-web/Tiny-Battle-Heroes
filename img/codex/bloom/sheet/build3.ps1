# 8 frames: idle from the confirmed still; attack = each Codex cell snapped to its own pixel grid (cells.ps1 + gridsnap),
# placed on the still's feet, colours snapped to the still, and the still's face pasted back
param([string]$Id)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$still=Load "img\codex\bloom\final\$Id.png"
$box=@{ sprout=@(30,41,38,45) }[$Id]
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
$cache=@{}
function Snap($c){ $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$cache[$k]=$p} } }; $cache[$k] }
# the still's face skin, used to find each frame's face
$face=@(); for($y=$box[2];$y -le $box[3];$y++){ for($x=$box[0];$x -le $box[1];$x++){ $c=$still.GetPixel($x,$y); if($c.A){ $face+=,@($x,$y,$c) } } }
$out=New-Object System.Drawing.Bitmap 512,64
for($i=0;$i -lt 4;$i++){ $up= if($i -eq 1 -or $i -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $sy= if($y -le 53){$y+$up}else{$y}; if($sy -gt 63){continue}; $c=$still.GetPixel($x,$sy); if($c.A){ $out.SetPixel($i*64+$x,$y,$c) } } } }
for($i=0;$i -lt 4;$i++){ $cell=Load "img\codex\bloom\sheet\${Id}_cellsnap$i.png"; $w=$cell.Width; $h=$cell.Height
  # place: find where the still's face sits inside this cell
  $best=1e18; for($ox=0-$w;$ox -le 64;$ox++){ for($oy=64-$h-8;$oy -le 64-$h+8;$oy++){ $s=0.0; foreach($p in $face){ $x=$p[0]-$ox; $y=$p[1]-$oy; if($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h){$s+=600}else{ $c=$cell.GetPixel($x,$y); if(-not $c.A){$s+=600}else{ $s+=[math]::Abs($c.R-$p[2].R)+[math]::Abs($c.G-$p[2].G)+[math]::Abs($c.B-$p[2].B) } }; if($s -ge $best){break} }
        if($s -lt $best){$best=$s;$bx=$ox;$by=$oy} } }
  $f=New-Object System.Drawing.Bitmap 64,64; $lost=0
  for($y=0;$y -lt $h;$y++){ for($x=0;$x -lt $w;$x++){ $c=$cell.GetPixel($x,$y); if(-not $c.A){continue}; $nx=$x+$bx; $ny=$y+$by; if($nx -lt 0 -or $ny -lt 0 -or $nx -ge 64 -or $ny -ge 64){$lost++; continue}; $f.SetPixel($nx,$ny,(Snap $c)) } }
  foreach($p in $face){ $f.SetPixel($p[0],$p[1],$p[2]) }
  "frame $($i+5): cell ${w}x$h at $bx,$by, clipped $lost"
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$f.GetPixel($x,$y); if($c.A){ $out.SetPixel((4+$i)*64+$x,$y,$c) } } } }
$out.Save([IO.Path]::GetFullPath("img\codex\bloom\final\${Id}_anim.png"))
$pv=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 8;$i++){ $g.DrawImage($out,(New-Object System.Drawing.Rectangle (($i%4)*384),([math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$pv.Save([IO.Path]::GetFullPath("img\codex\bloom\final\${Id}_anim_view.png"))
