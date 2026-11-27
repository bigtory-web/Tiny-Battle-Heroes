# 8 frames: idle 1-4 from the confirmed still (breathing), attack 5-8 = the still with only arm + fireball taken from the Codex frames
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$still=Load 'img\codex\redo3\final\flame.png'; $src=Load 'img\codex\redo3\sheet\flame_atk_src.png'
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
$cw=$src.Width/2.0; $cache=@{}; $raw=@()
for($i=0;$i -lt 4;$i++){ $f=New-Object System.Drawing.Bitmap 64,64
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel([int][math]::Floor(($i%2)*$cw+($x+0.5)*$cw/64),[int][math]::Floor([math]::Floor($i/2)*$cw+($y+0.5)*$cw/64))
      if($c.R -gt 180 -and $c.B -gt 180 -and $c.G -lt 100){continue}
      $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$cache[$k]=$p} } }
      $f.SetPixel($x,$y,$cache[$k]) } }
  $raw+=$f }
function InArm($x,$y){ ($y -ge 24 -and $y -le 44 -and $x -ge 41) -or ($y -ge 45 -and $y -le 53 -and $x -ge 39) }
$out=New-Object System.Drawing.Bitmap 512,64
for($i=0;$i -lt 4;$i++){ $up= if($i -eq 1 -or $i -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $sy= if($y -le 53){$y+$up}else{$y}; if($sy -gt 63){continue}; $c=$still.GetPixel($x,$sy); if($c.A){ $out.SetPixel($i*64+$x,$y,$c) } } } }
for($i=0;$i -lt 4;$i++){ $f=$raw[$i]
  # align the frame to the still on the legs and left side of the body
  $best=1e18; for($dx=-8;$dx -le 8;$dx++){ for($dy=-6;$dy -le 6;$dy++){ $s=0.0; for($y=46;$y -lt 64;$y+=1){ for($x=14;$x -lt 36;$x+=1){ $xx=$x-$dx; $yy=$y-$dy; $a=$still.GetPixel($x,$y); if($xx -lt 0 -or $xx -gt 63 -or $yy -lt 0 -or $yy -gt 63){$s+=300;continue}; $b=$f.GetPixel($xx,$yy)
            if(($a.A -gt 0) -ne ($b.A -gt 0)){$s+=300} elseif($a.A){ $s+=[math]::Abs($a.R-$b.R)+[math]::Abs($a.G-$b.G) } } }
        if($s -lt $best){$best=$s;$bx=$dx;$by=$dy} } }
  "frame $($i+5): offset $bx,$by"
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
      if(InArm $x $y){ $xx=$x-$bx; $yy=$y-$by; $c= if($xx -ge 0 -and $xx -lt 64 -and $yy -ge 0 -and $yy -lt 64){$f.GetPixel($xx,$yy)}else{[System.Drawing.Color]::FromArgb(0,0,0,0)} } else { $c=$still.GetPixel($x,$y) }
      if($c.A){ $out.SetPixel((4+$i)*64+$x,$y,$c) } } } }
$out.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_anim.png'))
$cur=Load 'img\p\flame_anim.png'
$pv=New-Object System.Drawing.Bitmap 1536,1540; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($strip in $cur,$out){ for($i=0;$i -lt 8;$i++){ $g.DrawImage($strip,(New-Object System.Drawing.Rectangle (($i%4)*384),($row*768+[math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }; $row++ }
$g.FillRectangle([System.Drawing.Brushes]::White,0,768,1536,4); $pv.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_anim_compare.png'))
