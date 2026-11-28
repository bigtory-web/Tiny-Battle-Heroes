# 8-frame sheet (512x64): frames 1-4 idle made from the approved still, frames 5-8 attack from the Codex row
Add-Type -AssemblyName System.Drawing
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
function IsKey($c){ $c.R -gt 170 -and $c.B -gt 170 -and $c.G -lt 100 }
function Feet($b){ $y1=0; for($y=63;$y -ge 0;$y--){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){ $y1=$y; break } }; if($y1){break} }
  $a=99;$z=0; for($y=$y1-2;$y -le $y1;$y++){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){ if($x -lt $a){$a=$x}; if($x -gt $z){$z=$x} } } }; return @($y1, (($a+$z)/2.0)) }
$d='img\codex\drum_warrior'
$still=Load "$d\still.png"
$pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){ $pal[$c.ToArgb()]=$c } } }; $cols=@($pal.Values)
$near=@{}; function Snap($c){ $k=$c.ToArgb(); if($near.ContainsKey($k)){ return $near[$k] }; $bd=1e9; foreach($p in $cols){ $q=($c.R-$p.R)*($c.R-$p.R)+($c.G-$p.G)*($c.G-$p.G)+($c.B-$p.B)*($c.B-$p.B); if($q -lt $bd){$bd=$q;$best=$p} }; $near[$k]=$best; return $best }
$sf=Feet $still
$sheet=New-Object System.Drawing.Bitmap 512,64
# idle: still, breathe up, breathe up, still
for($f=0;$f -lt 4;$f++){ $up= if($f -eq 1 -or $f -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ $sy= if($y -le 55){$y+$up}else{$y}; for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$sy); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
$src=Load "$d\atk_src.png"; $p=$src.Width/256.0
for($f=0;$f -lt 4;$f++){ $cell=New-Object System.Drawing.Bitmap 64,64
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel([int][math]::Floor(($f*64+$x+0.5)*$p),[int][math]::Floor(($y+0.5)*$p)); if(-not (IsKey $c)){ $cell.SetPixel($x,$y,(Snap $c)) } } }
  $cf=Feet $cell; $dx=[int][math]::Round($sf[1]-$cf[1]); $dy=$sf[0]-$cf[0]; "atk$($f+1) shift $dx,$dy"
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$cell.GetPixel($x,$y); $i=$x+$dx; $j=$y+$dy; if($c.A -and $i -ge 0 -and $i -lt 64 -and $j -ge 0 -and $j -lt 64){ $sheet.SetPixel((4+$f)*64+$i,$j,$c) } } } }
$sheet.Save([IO.Path]::GetFullPath("$d\anim_raw.png"))
# same face on the attack frames: find it, copy the still's face block (goblin skin, so no stamping)
foreach($f in 4..7){ $best=1e9
  foreach($oy in -6..6){ foreach($ox in -10..10){ $sum=0
    for($y=36;$y -le 43 -and $sum -lt $best;$y++){ for($x=31;$x -le 41;$x++){ $a=$still.GetPixel($x,$y); $b=$sheet.GetPixel($f*64+$x+$ox,$y+$oy); $sum+=[math]::Abs($a.R-$b.R)+[math]::Abs($a.G-$b.G)+[math]::Abs($a.B-$b.B)+[math]::Abs($a.A-$b.A) } }
    if($sum -lt $best){$best=$sum;$bx=$ox;$by=$oy} } }
  "frame $f face offset $bx,$by diff $best"
  for($y=36;$y -le 41;$y++){ for($x=32;$x -le 40;$x++){ $sheet.SetPixel($f*64+$x+$bx,$y+$by,$still.GetPixel($x,$y)) } } }
$sheet.Save([IO.Path]::GetFullPath("$d\anim.png")); Remove-Item "$d\anim_raw.png"
$o=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($sheet,(New-Object System.Drawing.Rectangle 0,($row*384),1536,384),(New-Object System.Drawing.Rectangle ($row*256),0,256,64),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath("$d\frames.png"))
