# fuller hair + small rifle (d.png) with four eye styles in gray
Add-Type -AssemblyName System.Drawing
$d='img/codex/shaman_archer'
foreach($st in 'sparkle','lashes','sleepy','brave'){
 & .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/d.png" -Out "$d/tmp.png" -LeftEye '34,36' -Style $st -Iris '#4c3e40,#8a7470'
 $s=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $o=[Drawing.Bitmap]::new($s)
 for($y=32;$y -le 41;$y++){for($x=31;$x -le 44;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 150){ $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml($(if($c.R -lt 160){'#5c4a4c'}else{'#7a6462'}))) }}}
 $o.Save((Join-Path (Get-Location) "$d/d_$st.png")); $s.Dispose() }
Remove-Item "$d/tmp.png"
$sh=[Drawing.Bitmap]::new(1600,830); $g=[Drawing.Graphics]::FromImage($sh); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('now','img/p/shaman.png'),@('before (big rifle)',"$d/b_face.png"),@('new (lashes)',"$d/d_lashes.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,[int]($i*400+200-$b.Width*3),[int](420-$b.Height*6),$b.Width*6,$b.Height*6); $g.DrawImage($b,$i*400+170,430,$b.Width,$b.Height); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$i=0
foreach($it in @(@('1 sparkle','sparkle'),@('2 lashes','lashes'),@('3 sleepy','sleepy'),@('4 brave','brave'))){ $b=[Drawing.Bitmap]::new((Resolve-Path "$d/d_$($it[1]).png").Path); $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+56,540,288,264),26,26,24,22,'Pixel'); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,505); $i++ }
$sh.Save((Join-Path (Get-Location) "$d/compare2.png"))
