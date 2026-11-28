Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$o=[Drawing.Bitmap]::new(1600,500); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('current','img/p/coral.png'),@('1 sea idol',"$d/o1.png"),@('2 navy bard',"$d/o2.png"),@('3 priestess',"$d/o3.png"))){ if(Test-Path $it[1]){ $s=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($s,$i*400+8,20,384,384); $g.DrawImage($s,$i*400+170,420,64,64) }; $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$o.Save((Join-Path (Get-Location) "$d/outfits.png"))
