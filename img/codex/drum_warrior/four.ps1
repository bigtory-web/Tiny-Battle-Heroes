param($Suffix='')
Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
$o=[Drawing.Bitmap]::new(1600,460); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('1 wolf cut','h1'),@('2 puffy curls','h2'),@('3 twin tails','h3'),@('4 big ponytail','h4'))){ $p="$d/$($it[1])$Suffix.png"; if(Test-Path $p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $g.DrawImage($s,$i*400+8,0,384,384); $g.DrawImage($s,$i*400+170,390,64,64) }; $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$o.Save((Join-Path (Get-Location) "$d/four.png"))
