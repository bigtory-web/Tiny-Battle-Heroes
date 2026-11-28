# move brows + eyes of sleepy_new up by 1 (jaw stays); also clean the dark red dot on the muzzle
Add-Type -AssemblyName System.Drawing
$d='img/codex/shaman_archer'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/sleepy_new.png").Path); $o=[Drawing.Bitmap]::new($s)
$skin=$s.GetPixel(38,38)
# left: brow row 37, eye rows 38-39, x34..36 / right: brow row 36, eye rows 37-38, x40..43
foreach($e in @(@(34,36,37,39),@(40,43,36,38))){ $x0,$x1,$top,$bot=$e
  for($x=$x0;$x -le $x1;$x++){ for($y=$top;$y -le $bot;$y++){ $o.SetPixel($x,$y-1,$s.GetPixel($x,$y)) }; $o.SetPixel($x,$bot,$skin) } }
$n=0; for($y=20;$y -lt 50;$y++){for($x=46;$x -lt 64;$x++){$c=$o.GetPixel($x,$y); if($c.A -and $c.B -gt 40 -and $c.G -lt 40 -and $c.R -lt 150){$o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#461205')); $n++}}}
"muzzle dots $n"
$o.Save((Join-Path (Get-Location) "$d/up1.png"))
$sh=[Drawing.Bitmap]::new(1200,830); $g=[Drawing.Graphics]::FromImage($sh); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('new eyes',"$d/sleepy_new.png"),@('eyes up 1',"$d/up1.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,[int]($i*400+200-$b.Width*3),[int](420-$b.Height*6),$b.Width*6,$b.Height*6); $g.DrawImage($b,$i*400+170,430,$b.Width,$b.Height); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); if($i){ $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+56,520,288,264),26,26,24,22,'Pixel') }; $i++ }
$sh.Save((Join-Path (Get-Location) "$d/compare4.png"))
