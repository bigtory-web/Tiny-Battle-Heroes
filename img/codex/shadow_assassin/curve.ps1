# mask top edge as a curve around the face: sides high, middle (nose) low
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/s.png").Path); $o=[Drawing.Bitmap]::new($s)
$mask=[Drawing.ColorTranslator]::FromHtml('#3b2f2e')
foreach($p in @(@(31,41),@(32,41),@(40,41),@(41,41),@(32,42),@(33,42),@(34,42),@(35,42),@(39,42),@(40,42),@(41,42))){ $o.SetPixel($p[0],$p[1],$mask) }
$s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/s2.png"))
$z=[Drawing.Bitmap]::new(1200,860); $g=[Drawing.Graphics]::FromImage($z); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('now (2 daggers)','img/p/shadow.png'),@('shuriken',"$d/s2.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,$i*400+8,20,384,384); $g.DrawImage($b,$i*400+170,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); if($i){ $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+20,520,360,330),28,32,18,16,'Pixel') }; $i++ }
$z.Save((Join-Path (Get-Location) "$d/compare_s.png"))
