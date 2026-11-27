# 4-frame walk: upper body from walk1_final (hair and scarf streaming), legs = the current legs (same length)
#   A: feet never move   B: feet swap 2 px, the passing foot lifts 1 px.   Frames 2 and 4 the body rides 1 px higher.
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\bearwalk\bear64.png'; $w=Load 'img\codex\bearwalk\walk1_final.png'
function IsShield($c){ $c.A -and (($c.G -gt $c.R+5) -or ([math]::Abs($c.R-$c.G) -lt 45 -and $c.B -gt 100 -and $c.R -lt 200)) }
$legs=@{ back=@(23,32); front=@(34,43) }
$plan=@{ A=@(@(0,0,0,0),@(0,0,0,0),@(0,0,0,0),@(0,0,0,0)); B=@(@(-2,0,2,0),@(0,-1,0,0),@(2,0,-2,0),@(0,0,0,-1)) }   # back dx, back dy, front dx, front dy
foreach($v in 'A','B'){ $sheet=New-Object System.Drawing.Bitmap 256,64
  for($f=0;$f -lt 4;$f++){ $up= if($f % 2){1}else{0}; $p=$plan[$v][$f]; $fr=New-Object System.Drawing.Bitmap 64,64
    foreach($leg in @(@('back',$p[0],$p[1]),@('front',$p[2],$p[3]))){ $r=$legs[$leg[0]]; for($y=59;$y -le 63;$y++){ for($x=$r[0];$x -le $r[1];$x++){ $c=$s.GetPixel($x,$y); if(-not $c.A -or (IsShield $c)){continue}; $ny=$y+$leg[2]; $fr.SetPixel($x+$leg[1],$ny,$c) } } }
    for($y=0;$y -le 58;$y++){ for($x=0;$x -lt 64;$x++){ $c=$w.GetPixel($x,$y); if($c.A){ $fr.SetPixel($x,$y-$up,$c) } } }
    if($up){ for($x=0;$x -lt 64;$x++){ $c=$w.GetPixel($x,58); if($c.A){ $fr.SetPixel($x,58,$c) } } }
    for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$fr.GetPixel($x,$y); if($c.A){ $sheet.SetPixel($f*64+$x,$y,$c) } } } }
  $sheet.Save([IO.Path]::GetFullPath("img\codex\bearwalk\bear_walk$v.png")) }
# still sheet: row A, row B
$o=New-Object System.Drawing.Bitmap 1560,780; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',22,([System.Drawing.FontStyle]::Bold); $row=0
foreach($v in 'A','B'){ $im=Load "img\codex\bearwalk\bear_walk$v.png"; $g.DrawString($v,$font,[System.Drawing.Brushes]::White,10,($row*390+8)); for($f=0;$f -lt 4;$f++){ $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($f*390),($row*390),384,384),(New-Object System.Drawing.Rectangle ($f*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }; $row++ }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\cycle.png'))
