Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
$o=[Drawing.Bitmap]::new(900,700); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('4 basic eyes','h4_f'),@('4 sparkle eyes','h4_sp'))){ $s=[Drawing.Bitmap]::new((Resolve-Path "$d/$($it[1]).png").Path); $g.DrawImage($s,$i*450+30,0,384,384); $g.DrawImage($s,$i*450+190,390,64,64); $g.DrawImage($s,[Drawing.Rectangle]::new($i*450+80,460,288,216),26,32,24,18,'Pixel'); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*450+10,8); $i++ }
$o.Save((Join-Path (Get-Location) "$d/sparkle.png"))
