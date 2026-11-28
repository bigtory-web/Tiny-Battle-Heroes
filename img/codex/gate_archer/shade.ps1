# A (long red hair) with 4-tone shading, light from the upper left. Recolors hair rows only (cape stays as in E).
Add-Type -AssemblyName System.Drawing
$d='img/codex/gate_archer'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$src=[Drawing.Bitmap]::new((Resolve-Path "$d/e.png").Path); $o=[Drawing.Bitmap]::new($src)
$hair=@{}
for($y=0;$y -le 45;$y++){for($x=0;$x -lt 64;$x++){$c=$src.GetPixel($x,$y)
 if($c.A -and $c.R -gt 110 -and ($c.G-$c.B) -ge 10 -and $c.G -lt 100 -and ($c.R-$c.G) -gt 60){ $hair["$x,$y"]= if($c.R -lt 165){'8a0c1c'}else{'b81222'} }}}
# shade: bottom and right edge of every lock
foreach($k in @($hair.Keys)){ $x,$y=[int[]]($k -split ','); if($hair[$k] -ne 'b81222'){continue}
 if(-not $hair.ContainsKey("$x,$($y+1)") -or -not $hair.ContainsKey("$($x+1),$y")){ $hair[$k]='8a0c1c' } }
# highlight: a broken shine ring on the crown, then one streak per big lock
$mid='ec4034'; $top='ec4034'
foreach($p in '31,29','32,29','30,30','31,30','30,31','34,28','35,29','33,32','31,33','30,34','29,35','36,31','37,32','39,33','38,34','21,39','20,40','22,41','21,42','27,37','28,36'){ if($hair.ContainsKey($p)){$hair[$p]=$mid} }
foreach($p in '32,28','33,28','31,29','30,30','35,30','37,33','21,39'){ if($hair.ContainsKey($p)){$hair[$p]=$top} }
foreach($k in $hair.Keys){ $x,$y=[int[]]($k -split ','); $o.SetPixel($x,$y,(C $hair[$k])) }
$o.Save((Join-Path (Get-Location) "$d/i_hair.png"))
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/i_hair.png" -Out "$d/i_red.png" -LeftEye '32,39' -Style brave -Iris '#8a0c1c,#ee3a38'
$s=[Drawing.Bitmap]::new(900,520); $g=[Drawing.Graphics]::FromImage($s); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('A before','g_red'),@('A shaded','i_red'),@('blaze','../../p/flame'))){
 $b=[Drawing.Bitmap]::new((Resolve-Path "$d/$($it[1]).png").Path); $g.DrawImage($b,[Drawing.Rectangle]::new($i*300,40,300,350),9,14,43,50,'Pixel'); $g.DrawImage($b,$i*300+120,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*300+10,8); $i++ }
$s.Save((Join-Path (Get-Location) "$d/compare5.png"))
"hair $($hair.Count) tones $(($hair.Values | Sort-Object -Unique) -join ',')"
