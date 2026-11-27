# current upper body + the Codex walking legs shortened by 3 rows; the shield rides 2 px higher so the front foot shows
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\bearwalk\bear64.png'; $w=Load 'img\codex\bearwalk\walk1.png'
$clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
function IsShield($x,$y,$c){ $c.A -and $x -ge 36 -and $y -ge 43 -and $y -le 62 }
$o=New-Object System.Drawing.Bitmap $s
# clear the old legs and the bottom of the pouch
for($y=59;$y -le 63;$y++){ for($x=8;$x -le 52;$x++){ $o.SetPixel($x,$y,$clear) } }
# walking legs: 8 rows -> 5 rows
$pick=56,58,60,62,63
for($i=0;$i -lt 5;$i++){ for($x=12;$x -le 48;$x++){ $c=$w.GetPixel($x,$pick[$i]); if(-not $c.A){continue}; if($c.G -gt $c.R){continue}; $nx=$x-2; $o.SetPixel($nx,59+$i,$c) } }
# shield: lift it off and put it back 2 px higher, in front
$shield=New-Object System.Drawing.Bitmap 64,64
for($y=43;$y -le 62;$y++){ for($x=37;$x -le 52;$x++){ $c=$s.GetPixel($x,$y); if($c.A -and ($x -ge 39 -or $y -le 58)){ $shield.SetPixel($x,$y,$c); if($y -ge 57 -and $o.GetPixel($x,$y).ToArgb() -eq $c.ToArgb()){ $o.SetPixel($x,$y,$clear) } } } }
for($y=43;$y -le 62;$y++){ for($x=37;$x -le 52;$x++){ $c=$shield.GetPixel($x,$y); if($c.A){ $o.SetPixel($x,$y-2,$c) } } }
$line=[System.Drawing.ColorTranslator]::FromHtml('#4a150c')
$snap=New-Object System.Drawing.Bitmap $o
for($y=54;$y -le 63;$y++){ for($x=6;$x -le 52;$x++){ $c=$snap.GetPixel($x,$y); if(-not $c.A -or ($c.R -lt 110 -and $c.G -lt 40)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($ny -le 63 -and -not $snap.GetPixel($nx,$ny).A){ $o.SetPixel($nx,$ny,$line) } } } }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v3.png'))
$p=New-Object System.Drawing.Bitmap 1170,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,0,10,384,384); $g.DrawImage($w,390,10,384,384); $g.DrawImage($o,780,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v3_view.png'))
