# walk frame 1 built from the current Roxy: same upper body and the same two legs, only stepped apart (length unchanged)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\bearwalk\bear64.png'; $w=Load 'img\codex\bearwalk\walk1.png'
$clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
function IsShield($c){ $c.A -and (($c.G -gt $c.R+5) -or ($c.R -lt 190 -and $c.B -gt 100 -and [math]::Abs($c.R-$c.G) -lt 45)) }
$o=New-Object System.Drawing.Bitmap $s
# lift both legs off
$legs=@{ back=@(23,32); front=@(34,43) }
foreach($k in 'back','front'){ for($y=60;$y -le 63;$y++){ for($x=$legs[$k][0];$x -le $legs[$k][1];$x++){ $c=$s.GetPixel($x,$y); if($c.A -and -not (IsShield $c)){ $o.SetPixel($x,$y,$clear) } } } }
function PutLeg($from,$to,$dx,$dy,$over){ for($y=59;$y -le 63;$y++){ for($x=$from;$x -le $to;$x++){ $c=$s.GetPixel($x,$y); if(-not $c.A -or (IsShield $c)){continue}; $nx=$x+$dx; $ny=$y+$dy; if($over -or -not $o.GetPixel($nx,$ny).A){ $o.SetPixel($nx,$ny,$c) } } } }
PutLeg 23 32 -4 -1 $false
PutLeg 34 43 3 0 $false
# scarf end streaming back (from the Codex frame, lowered to the same shoulder height)
$n=0; for($y=40;$y -le 52;$y++){ for($x=8;$x -le 24;$x++){ $c=$w.GetPixel($x,$y); if($c.A -and $c.G -ge $c.R -and $c.G -gt 60 -and -not $o.GetPixel($x,$y+3).A){ $o.SetPixel($x,$y+3,$c); $n++ } } }
# outline around what was moved or added
$line=$s.GetPixel(30,63); if($line.R -gt 120){ $line=[System.Drawing.ColorTranslator]::FromHtml('#4a150c') }
$snap=New-Object System.Drawing.Bitmap $o
for($y=42;$y -le 63;$y++){ for($x=5;$x -le 52;$x++){ $c=$snap.GetPixel($x,$y); if(-not $c.A -or ($c.R -lt 110 -and $c.G -lt 40)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($ny -le 63 -and -not $snap.GetPixel($nx,$ny).A){ $o.SetPixel($nx,$ny,$line) } } } }
"scarf pixels $n"
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v2a.png'))
$p=New-Object System.Drawing.Bitmap 1170,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,0,10,384,384); $g.DrawImage($w,390,10,384,384); $g.DrawImage($o,780,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_v2a_view.png'))
