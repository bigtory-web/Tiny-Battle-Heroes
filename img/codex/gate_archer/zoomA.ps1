param($In='img/codex/gate_archer/g_red.png',$Out='img/codex/gate_archer/zoomA.png')
Add-Type -AssemblyName System.Drawing
$s=[Drawing.Bitmap]::new((Resolve-Path $In).Path); $o=[Drawing.Bitmap]::new(704,640); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,[Drawing.Rectangle]::new(0,0,704,640),10,17,44,40,'Pixel')
$f=[Drawing.Font]::new('Arial',7); for($i=0;$i -lt 44;$i+=2){$g.DrawString("$($i+10)",$f,[Drawing.Brushes]::White,$i*16,0)}; for($i=2;$i -lt 40;$i+=2){$g.DrawString("$($i+17)",$f,[Drawing.Brushes]::White,0,$i*16)}
$o.Save((Join-Path (Get-Location) $Out))
