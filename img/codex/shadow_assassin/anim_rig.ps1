# 8 frames from the approved still only: body/face unchanged; the two daggers move, upper body bobs/leans.
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
$s0=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
$w=0; for($x=63;$x -ge 0 -and -not $w;$x--){ for($y=44;$y -le 52;$y++){ if($s0.GetPixel($x,$y).A){$w=$x;break} } }
function Pose($fx,$rx,$ry){   # front dagger shift x; rear dagger shift x,y
  $o=[Drawing.Bitmap]::new($s0)
  if($fx){ for($y=45;$y -le 52;$y++){
      for($x=45;$x -lt 64;$x++){ $o.SetPixel($x,$y,$clear) }
      for($x=45;$x -lt 64;$x++){ $c=$s0.GetPixel($x,$y); $t=$x+$fx; if($c.A -and $t -lt 64 -and $t -ge 40){ $o.SetPixel($t,$y,$c) } }
      for($i=0;$i -lt $fx;$i++){ $o.SetPixel(45+$i,$y,$s0.GetPixel(44,$y)) } } }   # stretch the forearm
  if($rx -or $ry){ for($y=40;$y -le 48;$y++){ for($x=0;$x -le 18;$x++){ $o.SetPixel($x,$y,$clear) } }
      for($y=40;$y -le 48;$y++){ for($x=0;$x -le 18;$x++){ $c=$s0.GetPixel($x,$y); if($c.A){ $o.SetPixel($x+$rx,$y+$ry,$c) } } } }
  return ,$o }
function Bob($b,$dy,$dx){ $o=[Drawing.Bitmap]::new($b)   # everything above the legs moves; feet stay
  for($y=0;$y -le 54;$y++){ for($x=0;$x -lt 64;$x++){ $sx=$x-$dx; $sy=$y+$dy; $o.SetPixel($x,$y,$(if($sx -ge 0 -and $sx -lt 64){$b.GetPixel($sx,$sy)}else{$clear})) } }
  return ,$o }
$frames=@(
  $s0, (Bob $s0 1 0), (Bob $s0 1 0), $s0,
  (Bob (Pose -3 -1 -2) 1 -1),   # wind up
  (Bob (Pose 3 0 -2) 0 1),      # stab
  (Bob (Pose 2 1 1) 1 2),       # follow through, rear dagger comes down
  (Bob (Pose 1 0 0) 0 1) )      # recover
$sheet=[Drawing.Bitmap]::new(512,64)
for($f=0;$f -lt 8;$f++){ for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$frames[$f].GetPixel($x,$y); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
$sheet.Save((Join-Path (Get-Location) "$d/anim.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($sheet,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
"front blade ends at $w"
