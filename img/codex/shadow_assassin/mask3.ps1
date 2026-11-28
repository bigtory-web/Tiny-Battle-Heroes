# mask per the user's drawing: top edge rises to the right (under both eyes), bottom shorter than top (tapers to the chin)
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/s6.png").Path); $o=[Drawing.Bitmap]::new($s)
$m=C '3b2f2e'; $hi=C '55494a'; $ink=C '340f06'
# top: y where the mask starts per column
$top=@{31=43;32=43;33=42;34=42;35=42;36=42;37=42;38=41;39=41;40=41;41=41;42=41}
foreach($x in $top.Keys){ for($y=$top[$x];$y -le 42;$y++){ $c=$s.GetPixel($x,$y); if($c.R -gt 200){ $o.SetPixel($x,$y,$m) } } }
foreach($x in $top.Keys){ $y=$top[$x]; if($x -ge 34){ $o.SetPixel($x,$y,$hi) } }   # light fold along the top edge
# taper
foreach($p in @(@(31,43),@(32,44),@(33,44),@(41,44),@(33,45),@(34,45),@(39,45))){ $o.SetPixel($p[0],$p[1],$ink) }
$s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/s7.png"))
$z=[Drawing.Bitmap]::new(1200,860); $g=[Drawing.Graphics]::FromImage($z); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('before (4 blades)',"$d/s2.png"),@('6 blades, new mask',"$d/s8.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,$i*400+8,20,384,384); $g.DrawImage($b,$i*400+170,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); if($i){ $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+20,520,360,330),28,32,18,16,'Pixel') }; $i++ }
$z.Save((Join-Path (Get-Location) "$d/compare_s.png"))
