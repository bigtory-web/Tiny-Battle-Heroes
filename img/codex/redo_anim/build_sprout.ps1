# 8-frame sheet (512x64): frames 1-4 idle made from the approved still, frames 5-8 attack from the Codex row
Add-Type -AssemblyName System.Drawing
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
function IsKey($c){ $c.R -gt 170 -and $c.B -gt 170 -and $c.G -lt 100 }
function Feet($b){ $y1=0; for($y=63;$y -ge 0;$y--){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){ $y1=$y; break } }; if($y1){break} }
  $a=99;$z=0; for($y=$y1-2;$y -le $y1;$y++){ for($x=0;$x -lt 64;$x++){ if($b.GetPixel($x,$y).A){ if($x -lt $a){$a=$x}; if($x -gt $z){$z=$x} } } }; return @($y1, (($a+$z)/2.0)) }
foreach($n in @('sprout')){
  $still=Load "img\codex\redo_anim\${n}_still.png"; if($still.Width -ne 64){ throw "still not 64" }
  $pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A){ $pal[$c.ToArgb()]=$c } } }; $cols=@($pal.Values)
  $near=@{}; function Snap($c){ $k=$c.ToArgb(); if($near.ContainsKey($k)){ return $near[$k] }; $bd=1e9; foreach($p in $cols){ $d=($c.R-$p.R)*($c.R-$p.R)+($c.G-$p.G)*($c.G-$p.G)+($c.B-$p.B)*($c.B-$p.B); if($d -lt $bd){$bd=$d;$best=$p} }; $near[$k]=$best; return $best }
  $sf=Feet $still
  $sheet=New-Object System.Drawing.Bitmap 512,64; $g=[System.Drawing.Graphics]::FromImage($sheet)
  # idle: still, breathe up, breathe up (+weapon), still
  $weaponX = if($n -eq 'storm'){ 40 } else { 99 }
  for($f=0;$f -lt 4;$f++){ for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
        $up = if($f -eq 1){1}elseif($f -eq 2){ if($x -ge $weaponX){2}else{1} }else{0}
        $sy = if($y -le 53){ $y+$up } else { $y }; if($sy -gt 63){continue}
        $c=$still.GetPixel($x,$sy); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
  # attack: sample the 8x grid, snap to the still's colours, put the feet where the still's feet are
  $src=Load "img\codex\redo_anim\${n}_atk_src.png"; $p=$src.Width/256.0
  for($f=0;$f -lt 4;$f++){ $cell=New-Object System.Drawing.Bitmap 64,64
    for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel([int][math]::Min($src.Width-1,(($f*64+$x+0.5)*$p)),[int][math]::Min($src.Height-1,(($y+0.5)*$p))); if(-not (IsKey $c)){ $cell.SetPixel($x,$y,(Snap $c)) } } }
    $cf=Feet $cell; $dx=[int][math]::Round($sf[1]-$cf[1]); $dy=$sf[0]-$cf[0]
    $out=New-Object System.Drawing.Bitmap 64,64
    for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$cell.GetPixel($x,$y); $i=$x+$dx; $j=$y+$dy; if($c.A -and $i -ge 0 -and $i -lt 64 -and $j -ge 0 -and $j -lt 64){ $out.SetPixel($i,$j,$c) } } }
    "$n atk$($f+1) shift $dx,$dy"
    for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$out.GetPixel($x,$y); if($c.A){ $sheet.SetPixel((4+$f)*64+$x,$y,$c) } } } }
  # the staff butt drawn across the neck in the thrust frames: put the still's collar back there
  if($n -eq 'storm'){ foreach($f in 5,6){ for($y=41;$y -le 46;$y++){ for($x=14;$x -le 35;$x++){ $c=$sheet.GetPixel($f*64+$x,$y)
          if($c.A -and $c.B -ge $c.R-10){ $sheet.SetPixel($f*64+$x,$y,$still.GetPixel($x,$y)) } } } } }
  # stray maroon dots -> outline colour
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 512;$x++){ $c=$sheet.GetPixel($x,$y); if($c.A -and $c.G -lt 30 -and $c.R -gt 55 -and $c.B -gt 28){ $sheet.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml('#3a190b')) } } }
  $sheet.Save([IO.Path]::GetFullPath("img\codex\redo_anim\${n}_anim.png")) }
# preview 6x, two rows per hero
$o=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$r=0; foreach($n in @('sprout')){ $s=Load "img\codex\redo_anim\${n}_anim.png"; foreach($row in 0,1){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle 0,($r*384),1536,384),(New-Object System.Drawing.Rectangle ($row*256),0,256,64),[System.Drawing.GraphicsUnit]::Pixel); $r++ } }
$o.Save([IO.Path]::GetFullPath('img\codex\redo_anim\compare_sprout.png'))
