param($Suffix='')
Add-Type -AssemblyName System.Drawing
$o=[Drawing.Bitmap]::new(1536,512); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($k in 'a','b','c'){ $s=[Drawing.Bitmap]::new((Resolve-Path "img/codex/gate_archer/$k$Suffix.png").Path); $g.DrawImage($s,[Drawing.Rectangle]::new($i*512,0,512,512),16,16,32,32,'Pixel')
 for($x=0;$x -lt 32;$x++){ $g.DrawString("$($x+16)",[Drawing.Font]::new('Arial',7),[Drawing.Brushes]::Black,$i*512+$x*16,0); $g.DrawString("$($x+16)",[Drawing.Font]::new('Arial',7),[Drawing.Brushes]::Black,$i*512,$x*16) }; $i++ }
$o.Save((Join-Path (Get-Location) "img/codex/gate_archer/zoom$Suffix.png"))
