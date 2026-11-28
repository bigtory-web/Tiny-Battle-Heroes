Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
$o=[Drawing.Bitmap]::new(1200,500); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('now in game','img/p/shadow.png'),@('shuriken','img/codex/shadow_assassin/s8.png'),@('curved fang blade',"$d/fang.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,$i*400+8,20,384,384); $g.DrawImage($b,$i*400+170,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$o.Save((Join-Path (Get-Location) "$d/weapons.png"))
