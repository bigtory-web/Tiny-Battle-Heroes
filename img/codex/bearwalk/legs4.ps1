# current upper body (shield untouched) + Codex walking legs shortened 8 -> 5 rows; the stepping front foot overlaps the shield's lower edge
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\bearwalk\bear64.png'; $w=Load 'img\codex\bearwalk\walk1.png'
$clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
$o=New-Object System.Drawing.Bitmap $s
# clear the old legs and pouch bottom (the shield stays)
for($y=59;$y -le 63;$y++){ for($x=8;$x -le 52;$x++){ $c=$s.GetPixel($x,$y); if($x -ge 37 -and $y -le 61 -and ($c.G -gt $c.R -or [math]::Abs($c.R-$c.G) -lt 45)){continue}; $o.SetPixel($x,$y,$clear) } }
$pick=56,58,60,62,63
for($i=0;$i -lt 5;$i++){ for($x=12;$x -le 48;$x++){ $c=$w.GetPixel($x,$pick[$i]); if(-not $c.A -or $c.G -gt $c.R){continue}; $nx=$x-2; $ny=59+$i
    $under=$o.GetPixel($nx,$ny); if($under.A -and $nx -ge 37 -and $ny -le 60){continue}   # top of the front leg stays behind the shield
    $o.SetPixel($nx,$ny,$c) } }
$line=[System.Drawing.ColorTranslator]::FromHtml('#4a150c')
$snap=New-Object System.Drawing.Bitmap $o
for($y=56;$y -le 63;$y++){ for($x=6;$x -le 52;$x++){ $c=$snap.GetPixel($x,$y); if(-not $c.A -or ($c.R -lt 110 -and $c.G -lt 40)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($ny -le 63 -and -not $snap.GetPixel($nx,$ny).A){ $o.SetPixel($nx,$ny,$line) } } } }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v4.png'))
$p=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,0,10,384,384); $g.DrawImage($o,396,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v4_view.png'))
$z=New-Object System.Drawing.Bitmap 920,380; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,(New-Object System.Drawing.Rectangle 0,0,450,225),(New-Object System.Drawing.Rectangle 12,44,40,20),[System.Drawing.GraphicsUnit]::Pixel); $g.DrawImage($o,(New-Object System.Drawing.Rectangle 460,0,450,225),(New-Object System.Drawing.Rectangle 12,44,40,20),[System.Drawing.GraphicsUnit]::Pixel); $z.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v4_legs.png'))
