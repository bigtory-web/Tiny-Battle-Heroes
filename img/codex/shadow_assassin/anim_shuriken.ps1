# 8 frames from the approved still: body/face unchanged; the shuriken + hand swing, upper body bobs.
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
$still=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path); $s7=[Drawing.Bitmap]::new((Resolve-Path "$d/s7.png").Path); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
$body=[Drawing.Bitmap]::new($s7); for($y=40;$y -le 58;$y++){ for($x=46;$x -lt 64;$x++){ $body.SetPixel($x,$y,$clear) } }
# old fist left in the body would show when the hand moves: make it sleeve
$sleeve=[Drawing.ColorTranslator]::FromHtml("#4a1c4e"); $ink=[Drawing.ColorTranslator]::FromHtml("#2c0e06")
foreach($y in 45..53){ foreach($x in 42..45){ $c=$body.GetPixel($x,$y); if($c.A -and $c.R -gt 200 -and $c.G -gt 140){ $body.SetPixel($x,$y,$sleeve) } } }
$layer=[Drawing.Bitmap]::new(64,64)
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A -and $c.ToArgb() -ne $body.GetPixel($x,$y).ToArgb()){ $layer.SetPixel($x,$y,$c) } } }
function Bob($b,$dy,$dx){ $o=[Drawing.Bitmap]::new($b)
  for($y=0;$y -le 54;$y++){ for($x=0;$x -lt 64;$x++){ $sx=$x-$dx; $sy=$y+$dy; $o.SetPixel($x,$y,$(if($sx -ge 0 -and $sx -lt 64){$b.GetPixel($sx,$sy)}else{$clear})) } }
  return ,$o }
function Frame([int]$lx,[int]$ly,[int]$by,[int]$bx){ $o= if($by -or $bx){ Bob $body $by $bx } else { [Drawing.Bitmap]::new($body) }
  # sleeve from the shoulder to the moved fist
  if([math]::Abs($ly) -ge 3){ for($i=0;$i -le 4;$i++){ $ax=[int](43+$bx+($lx+4-$bx)*$i/4); $ay=[int](48-$by+($ly+1+$by)*$i/4); $o.SetPixel($ax,$ay-1,$ink); $o.SetPixel($ax,$ay,$sleeve); $o.SetPixel($ax,$ay+1,$sleeve); $o.SetPixel($ax,$ay+2,$ink) } }
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$layer.GetPixel($x,$y); if($c.A){ $tx=$x+$lx; $ty=$y+$ly; if($tx -ge 0 -and $tx -lt 64 -and $ty -ge 0 -and $ty -lt 64){ $o.SetPixel($tx,$ty,$c) } } } }
  return ,$o }
$frames=@( $still, (Frame 0 -1 1 0), (Frame 0 -1 1 0), $still,
  (Frame 0 -5 1 -1),    # wind up: raised high, clear of the face
  (Frame 1 -1 0 1),     # swing forward
  (Frame 1 3 1 2),      # cut down
  (Frame 0 1 0 1) )     # recover
$sheet=[Drawing.Bitmap]::new(512,64)
for($f=0;$f -lt 8;$f++){ for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$frames[$f].GetPixel($x,$y); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
$sheet.Save((Join-Path (Get-Location) "$d/anim.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($sheet,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
