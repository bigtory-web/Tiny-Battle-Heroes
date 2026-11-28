Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $b=[Drawing.Bitmap]::new($s); $s.Dispose(); $b }
$a=Load img/p/coral_anim.png
$o=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($a,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$o.Save((Join-Path (Get-Location) "$d/frames.png"))
