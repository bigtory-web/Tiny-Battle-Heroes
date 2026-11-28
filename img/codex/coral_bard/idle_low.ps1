# idle/move: trumpet lowered. Body from the Codex "low" pose aligned to the still; head and eyes copied from the still.
# attack (frames 5-8) stays as built by anim_rig.ps1.
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $b=[Drawing.Bitmap]::new($s); $s.Dispose(); $b }
$still=Load "$d/still.png"; $low=Load "$d/low.png"; $anim=Load "$d/anim.png"
# align by the face
$best=1e9
foreach($dy in -3..3){ foreach($dx in -9..9){ $sum=0
  for($y=36;$y -le 41 -and $sum -lt $best;$y++){ for($x=28;$x -le 38;$x++){ $a=$still.GetPixel($x,$y); $b=$low.GetPixel($x-$dx,$y-$dy); $sum+=[math]::Abs($a.R-$b.R)+[math]::Abs($a.G-$b.G)+[math]::Abs($a.B-$b.B)+[math]::Abs($a.A-$b.A) } }
  if($sum -lt $best){$best=$sum;$bx=$dx;$by=$dy} } }
"align $bx,$by diff $best"
$o=[Drawing.Bitmap]::new(64,64)
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $i=$x-$bx; $j=$y-$by; if($i -ge 0 -and $i -lt 64 -and $j -ge 0 -and $j -lt 64){ $o.SetPixel($x,$y,$low.GetPixel($i,$j)) } } }
$mask=@{41=46;42=45;43=42;44=41}   # first x of the raised trumpet per row
for($y=0;$y -le 44;$y++){ for($x=0;$x -lt 64;$x++){ if($y -le 40 -or ($x -le 38 -and $x -lt $mask[$y])){ $o.SetPixel($x,$y,$still.GetPixel($x,$y)) } } }
$o.Save((Join-Path (Get-Location) "$d/still_low.png"))
# idle 4 frames: still, breathe, breathe, still (rows above the skirt move down 1)
for($f=0;$f -lt 4;$f++){ $dyy= if($f -eq 1 -or $f -eq 2){1}else{0}
  for($y=0;$y -lt 64;$y++){ $sy= if($y -le 55){$y+$dyy}else{$y}; for($x=0;$x -lt 64;$x++){ $anim.SetPixel($f*64+$x,$y,$o.GetPixel($x,[math]::Min(63,$sy))) } } }
$anim.Save((Join-Path (Get-Location) "$d/anim2.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($anim,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
