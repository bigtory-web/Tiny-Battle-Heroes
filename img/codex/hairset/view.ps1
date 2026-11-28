param($Suffix='',$Out='compare.png')
Add-Type -AssemblyName System.Drawing
$d='img/codex/hairset'
$o=[Drawing.Bitmap]::new(1200,860); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold)
foreach($k in 1..6){ $s=[Drawing.Bitmap]::new((Resolve-Path "$d/h$k$Suffix.png").Path); $cx=(($k-1)%3)*400; $cy=[math]::Floor(($k-1)/3)*430
 $g.DrawImage($s,[Drawing.Rectangle]::new($cx+40,$cy+30,320,320),16,24,32,32,'Pixel'); $g.DrawImage($s,$cx+170,$cy+350,64,64); $g.DrawString("$k",$f,[Drawing.Brushes]::White,$cx+10,$cy+6) }
$o.Save((Join-Path (Get-Location) "$d/$Out"))
