# idle: replace the small lowered conch with the SAME pixels as the raised conch (sheared 0..3 down so the bell points down)
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $b=[Drawing.Bitmap]::new($s); $s.Dispose(); $b }
$still=Load "$d/still.png"; $low=Load "$d/still_low.png"
$mask=@{41=@(46,50);42=@(45,51);43=@(42,52);44=@(41,52);45=@(39,52);46=@(37,52);47=@(35,52);48=@(35,52);49=@(35,52);50=@(35,52);51=@(37,51);52=@(43,49)}
$o=[Drawing.Bitmap]::new($low); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
for($y=54;$y -le 63;$y++){ for($x=41;$x -lt 64;$x++){ $o.SetPixel($x,$y,$clear) } }
foreach($y in $mask.Keys){ for($x=$mask[$y][0];$x -le $mask[$y][1];$x++){ $c=$still.GetPixel($x,$y); if($c.A){
  $tx=$x+3; $ty=$y+8+[math]::Floor(($x-35)/5); if($ty -le 63){ $o.SetPixel($tx,$ty,$c) } } } }
for($y=54;$y -le 57;$y++){ for($x=38;$x -le 41;$x++){ $c=$low.GetPixel($x,$y); if($c.A){ $o.SetPixel($x,$y,$c) } } }
$o.Save((Join-Path (Get-Location) "$d/still_low2.png"))
$anim=Load "$d/anim2.png"
for($f=0;$f -lt 4;$f++){ $dy= if($f -eq 1 -or $f -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ $sy= if($y -le 53){$y+$dy}else{$y}; for($x=0;$x -lt 64;$x++){ $anim.SetPixel($f*64+$x,$y,$o.GetPixel($x,$sy)) } } }
$anim.Save((Join-Path (Get-Location) "$d/anim3.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($anim,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
