# 8 frames for vine / coral: idle from the confirmed still; attack from the Codex frames with the still's own pixels kept where nothing moves
param([string]$Id)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$still=Load "img\codex\redo3\final\$Id.png"; $src=Load "img\codex\redo3\sheet\${Id}_atk_src.png"
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
$cw=$src.Width/2.0; $cache=@{}; $raw=@()
for($i=0;$i -lt 4;$i++){ $f=New-Object System.Drawing.Bitmap 64,64
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel([int][math]::Floor(($i%2)*$cw+($x+0.5)*$cw/64),[int][math]::Floor([math]::Floor($i/2)*$cw+($y+0.5)*$cw/64))
      if($c.R -gt 180 -and $c.B -gt 180 -and $c.G -lt 100){continue}
      $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$cache[$k]=$p} } }
      $f.SetPixel($x,$y,$cache[$k]) } }
  $raw+=$f }
# vine: only what is right of the hand and below the head moves.  coral: the head box stays from the still, the rest is the frame
if($Id -eq 'vine'){ $ax=18,38,28,63; function FromFrame($x,$y){ $x -ge 39 -and $y -ge 43 } }
else { $ax=22,44,52,63; function FromFrame($x,$y){ -not ($x -ge 27 -and $x -le 50 -and $y -le 45) } }
$out=New-Object System.Drawing.Bitmap 512,64
for($i=0;$i -lt 4;$i++){ $up= if($i -eq 1 -or $i -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $sy= if($y -le 53){$y+$up}else{$y}; if($sy -gt 63){continue}; $c=$still.GetPixel($x,$sy); if($c.A){ $out.SetPixel($i*64+$x,$y,$c) } } } }
for($i=0;$i -lt 4;$i++){ $f=$raw[$i]
  $best=1e18; for($dx=-12;$dx -le 12;$dx++){ for($dy=-6;$dy -le 6;$dy++){ $s=0.0; for($y=$ax[2];$y -le $ax[3];$y++){ for($x=$ax[0];$x -le $ax[1];$x++){ $a=$still.GetPixel($x,$y); $xx=$x-$dx; $yy=$y-$dy; if($xx -lt 0 -or $xx -gt 63 -or $yy -lt 0 -or $yy -gt 63){ if($a.A){$s+=300}; continue }; $b=$f.GetPixel($xx,$yy)
            if(($a.A -gt 0) -ne ($b.A -gt 0)){$s+=300} elseif($a.A){ $s+=[math]::Abs($a.R-$b.R)+[math]::Abs($a.G-$b.G) } } }
        if($s -lt $best){$best=$s;$bx=$dx;$by=$dy} } }
  "frame $($i+5): offset $bx,$by"
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
      if(FromFrame $x $y){ $xx=$x-$bx; $yy=$y-$by; $c= if($xx -ge 0 -and $xx -lt 64 -and $yy -ge 0 -and $yy -lt 64){$f.GetPixel($xx,$yy)}else{[System.Drawing.Color]::FromArgb(0,0,0,0)} } else { $c=$still.GetPixel($x,$y) }
      if($c.A){ $out.SetPixel((4+$i)*64+$x,$y,$c) } } } }
$out.Save([IO.Path]::GetFullPath("img\codex\redo3\final\${Id}_anim.png"))
$pv=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 8;$i++){ $g.DrawImage($out,(New-Object System.Drawing.Rectangle (($i%4)*384),([math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$pv.Save([IO.Path]::GetFullPath("img\codex\redo3\final\${Id}_anim_view.png"))
