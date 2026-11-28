# 8 frames made only from the approved still: body/face never redrawn; the trumpet tilts up (right end rises), upper body bobs 1px.
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$still=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path)
# trumpet + hands, per row: first and last x
$mask=@{41=@(46,50);42=@(45,51);43=@(42,52);44=@(41,52);45=@(39,52);46=@(37,52);47=@(34,52);48=@(34,52);49=@(34,52);50=@(34,52);51=@(37,51);52=@(43,49)}
function InMask($x,$y){ $mask.ContainsKey($y) -and $x -ge $mask[$y][0] -and $x -le $mask[$y][1] }
function Tilt($steps){ # $steps: list of (fromX, lift)
  $o=[Drawing.Bitmap]::new($still)
  for($x=34;$x -le 52;$x++){ $l=0; foreach($s in $steps){ if($x -ge $s[0]){$l=$s[1]} }; if(-not $l){continue}
    $ys=@(41..52 | Where-Object { InMask $x $_ }); if(-not $ys){continue}; $top=$ys[0]; $bot=$ys[-1]
    for($y=$top;$y -le $bot;$y++){ $c=$still.GetPixel($x,$y); if($c.A){ $o.SetPixel($x,$y-$l,$c) } }
    for($y=$bot-$l+1;$y -le $bot;$y++){ $o.SetPixel($x,$y, $(if($x -le 41){$still.GetPixel($x,$bot+1)}else{[Drawing.Color]::FromArgb(0,0,0,0)})) } }
  return ,$o }
function Bob($b,$dy){ if(-not $dy){return ,$b}; $o=[Drawing.Bitmap]::new($b)   # rows above the skirt move, feet stay
  for($y=1;$y -le 55;$y++){ for($x=0;$x -lt 64;$x++){ $sy=$y+$dy; if($sy -ge 0 -and $sy -le 63){ $o.SetPixel($x,$y,$b.GetPixel($x,$sy)) } } }
  if($dy -lt 0){ for($x=0;$x -lt 64;$x++){ $o.SetPixel($x,0,[Drawing.Color]::FromArgb(0,0,0,0)) } }
  return ,$o }
$none=,@(99,0)
$frames=@(
  $still, (Bob $still 1), (Bob $still 1), $still,
  (Bob $still -1),
  (Tilt @(@(40,1),@(44,2))),
  (Bob (Tilt @(@(39,1),@(42,2),@(46,3))) 1),
  (Tilt @(,@(43,1))) )
$sheet=[Drawing.Bitmap]::new(512,64)
for($f=0;$f -lt 8;$f++){ for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$frames[$f].GetPixel($x,$y); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
$sheet.Save((Join-Path (Get-Location) "$d/anim.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($sheet,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
