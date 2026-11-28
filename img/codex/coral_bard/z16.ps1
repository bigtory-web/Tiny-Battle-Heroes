Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$a=[Drawing.Bitmap]::new((Resolve-Path img/p/coral_anim.png).Path)
$z=[Drawing.Bitmap]::new(1200,480); $g=[Drawing.Graphics]::FromImage($z); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,[Drawing.Rectangle]::new(0,0,600,480),[Drawing.Rectangle]::new(34,44,25,20),'Pixel')
$g.DrawImage($a,[Drawing.Rectangle]::new(600,0,600,480),[Drawing.Rectangle]::new((384+30),36,25,20),'Pixel')
$f=[Drawing.Font]::new('Arial',8)
for($i=0;$i -lt 25;$i++){ $g.DrawString([string](34+$i),$f,[Drawing.Brushes]::White,$i*24+4,0); $g.DrawString([string](30+$i),$f,[Drawing.Brushes]::White,600+$i*24+4,0) }
for($j=1;$j -lt 20;$j++){ $g.DrawString([string](44+$j),$f,[Drawing.Brushes]::White,0,$j*24+6); $g.DrawString([string](36+$j),$f,[Drawing.Brushes]::White,600,$j*24+6) }
$z.Save((Join-Path (Get-Location) "$d/zoom_conch.png"))
