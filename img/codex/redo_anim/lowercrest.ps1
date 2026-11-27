# lower Tora's crest by 6 rows (crest columns only, the staff is left alone); same cut on the still and all 8 frames
Add-Type -AssemblyName System.Drawing
$cut = 18,20,21,23,24,25; $maxX = 38
function CutCell($src,$ox){ $o=New-Object System.Drawing.Bitmap 64,64
  for($x=0;$x -lt 64;$x++){
    if($x -gt $maxX){ for($y=0;$y -lt 64;$y++){ $c=$src.GetPixel($ox+$x,$y); if($c.A){ $o.SetPixel($x,$y,$c) } }; continue }
    $ny=63; for($y=63;$y -ge 0;$y--){ if($cut -contains $y){continue}; $c=$src.GetPixel($ox+$x,$y); if($c.A){ $o.SetPixel($x,$ny,$c) }; $ny-- } }
  return ,$o }
# one feather tip stuck out as a thin bar after the cut: trim it back to the other tips
function Tidy($b,$ox,$up){ $ink=[System.Drawing.ColorTranslator]::FromHtml('#461912')
  foreach($y in 26,27){ foreach($x in 10..13){ $b.SetPixel($ox+$x,$y-$up,[System.Drawing.Color]::FromArgb(0,0,0,0)) }; $b.SetPixel($ox+14,$y-$up,$ink) }
  # the upper tip was a one-row bar: shorten it too
  foreach($x in 14,15){ $b.SetPixel($ox+$x,24-$up,[System.Drawing.Color]::FromArgb(0,0,0,0)) }; $b.SetPixel($ox+16,24-$up,$ink)
  return $b }
$still=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo_anim\thunderbird_still.png'))
$sheet=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo_anim\thunderbird_anim.png'))
$new=CutCell $still 0
$out=New-Object System.Drawing.Bitmap 512,64
for($f=0;$f -lt 4;$f++){ $up = if($f -eq 1 -or $f -eq 2){1}else{0}   # idle: still, up 1, up 1, still
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $sy= if($y -le 53){$y+$up}else{$y}; if($sy -gt 63){continue}; $c=$new.GetPixel($x,$sy); if($c.A){ $out.SetPixel($f*64+$x,$y,$c) } } } }
for($f=4;$f -lt 8;$f++){ $cell=CutCell $sheet ($f*64); for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$cell.GetPixel($x,$y); if($c.A){ $out.SetPixel($f*64+$x,$y,$c) } } } }
$new=Tidy $new 0 0
for($f=0;$f -lt 8;$f++){ $null = Tidy $out ($f*64) $(if($f -eq 1 -or $f -eq 2){1}else{0}) }
$new.Save([IO.Path]::GetFullPath('img\codex\redo_anim\thunderbird_low_still.png'))
$out.Save([IO.Path]::GetFullPath('img\codex\redo_anim\thunderbird_low_anim.png'))
# preview: before / after (sprite + icon crop like the game) and the new 8 frames
function Face($im){ $x0=64;$x1=0; for($y=38;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if($im.GetPixel($x,$y).A -gt 40){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x} } } }
  $cx=($x0+$x1)/2.0; $top=-1; for($y=0;$y -lt 64 -and $top -lt 0;$y++){ $n=0; for($x=[int][math]::Round($cx-11.52);$x -le $cx+11.52;$x++){ if($x -ge 0 -and $x -lt 64 -and $im.GetPixel($x,$y).A -gt 40){$n++} }; if($n -ge 4){$top=$y} }
  $sx=0.0;$k=0; for($y=$top;$y -lt [math]::Min(64,$top+17.92);$y++){ for($x=[int][math]::Round($cx-15.36);$x -le $cx+15.36;$x++){ if($x -ge 0 -and $x -lt 64 -and $im.GetPixel($x,$y).A -gt 40){ $sx+=$x+.5; $k++ } } }
  return @(($sx/$k/64), ($top/64.0), $top) }
$pv=New-Object System.Drawing.Bitmap 1536,1000; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$i=0; foreach($im in $still,$new){ $g.DrawImage($im,($i*600),0,384,384); $fc=Face $im; "head top row $($fc[2])"; $B=192; $bx=$i*600+400; $by=100
  $g.FillRectangle($slot,$bx,$by,$B,$B); $g.SetClip((New-Object System.Drawing.Rectangle $bx,$by,$B,$B)); $g.DrawImage($im,[int]($bx+$B*.5-$fc[0]*2.05*$B),[int]($by+$B*.03-$fc[1]*2.05*$B),[int](2.05*$B),[int](2.05*$B)); $g.ResetClip(); $i++ }
foreach($row in 0,1){ $g.DrawImage($out,(New-Object System.Drawing.Rectangle 0,(420+$row*290),1160,290),(New-Object System.Drawing.Rectangle ($row*256),0,256,64),[System.Drawing.GraphicsUnit]::Pixel) }
$pv.Save([IO.Path]::GetFullPath('img\codex\redo_anim\lowercrest_compare.png'))
