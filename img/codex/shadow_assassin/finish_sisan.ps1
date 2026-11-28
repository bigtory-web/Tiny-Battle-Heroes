# same approved eyes/brows (mask kept), 3 hair tones; B = A with the gray edges turned into muted purple trim (same size as A)
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/a.png" -Out "$d/tmp.png" -LeftEye '34,39' -Iris '#4a1458,#8e2c9c'
$a=[Drawing.Bitmap]::new((Resolve-Path "$d/a.png").Path); $t=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $o=[Drawing.Bitmap]::new($a)
for($y=36;$y -le 41;$y++){ for($x=33;$x -le 43;$x++){ $c=$t.GetPixel($x,$y); if($c.ToArgb() -eq $a.GetPixel($x,$y).ToArgb()){continue}
  if($c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 150){ $c=C '6c1e7c' }
  $o.SetPixel($x,$y,$c) } }
$t.Dispose(); Remove-Item "$d/tmp.png"
# hair: light third tone along the top of each purple bang
$light=C '9a5cc0'
$src=[Drawing.Bitmap]::new($o)
function Hair($c){ $c.A -and $c.B -gt 120 -and $c.R -gt 80 -and $c.R -lt 135 -and $c.G -lt 80 }
for($y=26;$y -le 39;$y++){ for($x=22;$x -le 46;$x++){ if((Hair $src.GetPixel($x,$y)) -and -not (Hair $src.GetPixel($x,$y-1)) -and (Hair $src.GetPixel($x,$y+1))){ $o.SetPixel($x,$y,$light) } } }
$o.Save((Join-Path (Get-Location) "$d/a2.png"))
$b=[Drawing.Bitmap]::new($o); $n=0
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$o.GetPixel($x,$y)
  if($c.A -and [math]::Abs($c.R-$c.G) -le 10 -and [math]::Abs($c.G-$c.B) -le 14 -and $c.R -ge 68 -and $c.R -le 130){ $b.SetPixel($x,$y,(C $(if($c.R -ge 95){'9a62a8'}else{'6e3c7a'}))); $n++ } } }
# collar gem
foreach($p in @(@(32,45,'c58ad8'),@(33,45,'8e2c9c'),@(32,46,'8e2c9c'),@(33,46,'4a1458'))){ $b.SetPixel($p[0],$p[1],(C $p[2])) }
"trim $n"
$b.Save((Join-Path (Get-Location) "$d/b3.png"))
