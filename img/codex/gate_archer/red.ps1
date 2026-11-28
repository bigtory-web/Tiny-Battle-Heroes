# red hair + matching eyes: g = long hair (E), h = short bob
Add-Type -AssemblyName System.Drawing
$d='img/codex/gate_archer'
$src=[Drawing.Bitmap]::new((Resolve-Path "$d/e.png").Path); $o=[Drawing.Bitmap]::new($src); $n=0
for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$src.GetPixel($x,$y)
 # hair is the orange-brown family (green clearly above blue); scarf and cape have green ~ blue
 if($c.A -and $c.R -gt 110 -and ($c.G-$c.B) -ge 10 -and $c.G -lt 100 -and ($c.R-$c.G) -gt 60){ $h=if($c.R -lt 165){'8a0c1c'}else{'c81424'}; $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#'+$h)); $n++ }}}
"long hair pixels $n"
$o.Save((Join-Path (Get-Location) "$d/g_hair.png")); $o.Dispose(); $src.Dispose()
$st='.claude/skills/game-art-hero/scripts/stamp_face.ps1'
& $st -Target "$d/g_hair.png" -Out "$d/g_red.png" -LeftEye '32,39' -Style brave -Iris '#8a0c1c,#ee3a38'
& $st -Target "$d/f_red.png" -Out "$d/h_red.png" -LeftEye '32,39' -Style brave -Iris '#8a0c1c,#ee3a38'
$s=[Drawing.Bitmap]::new(1200,480); $g=[Drawing.Graphics]::FromImage($s); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('before (E)','e_brave'),@('A  long, red','g_red'),@('B  bob, red','h_red'),@('blaze','../../p/flame'))){
 $b=[Drawing.Bitmap]::new((Resolve-Path "$d/$($it[1]).png").Path); $g.DrawImage($b,[Drawing.Rectangle]::new($i*300,40,300,300),7,14,50,50,'Pixel'); $g.DrawImage($b,$i*300+120,380,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*300+10,8); $i++ }
$s.Save((Join-Path (Get-Location) "$d/compare4.png"))
