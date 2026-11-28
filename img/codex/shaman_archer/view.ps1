param($In='img/codex/shaman_archer/a.png',$Label='A twin sickles',$Out='img/codex/shaman_archer/compare.png')
Add-Type -AssemblyName System.Drawing
$o=[Drawing.Bitmap]::new(1200,500); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('now','img/p/shaman.png'),@('rifle',"img/codex/shaman_archer/b_face.png"))){ $s=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path)
 $g.DrawImage($s,[int]($i*400+200-$s.Width*3),[int](420-$s.Height*6),$s.Width*6,$s.Height*6); $g.DrawImage($s,$i*400+170,430,$s.Width,$s.Height); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$o.Save((Join-Path (Get-Location) $Out))
