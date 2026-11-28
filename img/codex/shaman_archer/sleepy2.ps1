# sleepy eyes with one more eye row under the brow (brow stays) on e.png (full hair + big rifle)
Add-Type -AssemblyName System.Drawing
$d='img/codex/shaman_archer'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/e.png" -Out "$d/tmp.png" -LeftEye '34,36' -Style sleepy -Iris '#4c3e40,#8a7470'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $one=[Drawing.Bitmap]::new($s)
for($y=32;$y -le 41;$y++){for($x=31;$x -le 44;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 150){ $one.SetPixel($x,$y,(C '8a7470')) }}}
$s.Dispose(); Remove-Item "$d/tmp.png"; $one.Save((Join-Path (Get-Location) "$d/sleepy_old.png"))
$two=[Drawing.Bitmap]::new($one); $white=C 'fcfcfa'; $dark=C '4c3e40'; $light=C '8a7470'
foreach($e in @(@(34,38,35,36),@(42,37,40,41))){ $wx,$y,$i1,$i2=$e
  $two.SetPixel($wx,$y+1,$white); $two.SetPixel($wx,$y,$white)
  foreach($x in $i1,$i2){ $two.SetPixel($x,$y,$dark); $two.SetPixel($x,$y+1,$light) } }
$two.Save((Join-Path (Get-Location) "$d/sleepy_new.png"))
$sh=[Drawing.Bitmap]::new(1600,830); $g=[Drawing.Graphics]::FromImage($sh); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('now','img/p/shaman.png'),@('big rifle, old sleepy',"$d/sleepy_old.png"),@('big rifle, new eyes',"$d/sleepy_new.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,[int]($i*400+200-$b.Width*3),[int](420-$b.Height*6),$b.Width*6,$b.Height*6); $g.DrawImage($b,$i*400+170,430,$b.Width,$b.Height); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$i=2
foreach($it in @(@('before','sleepy_old'),@('+1 row','sleepy_new'))){ $b=[Drawing.Bitmap]::new((Resolve-Path "$d/$($it[1]).png").Path); $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+56,540,288,264),26,26,24,22,'Pixel'); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,505); $i++ }
$sh.Save((Join-Path (Get-Location) "$d/compare3.png"))
