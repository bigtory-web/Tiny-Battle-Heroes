# 6-blade shuriken on a wrapped handle: grip visible above and below the fist, steel pommel
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$base=[Drawing.Bitmap]::new((Resolve-Path "$d/s7.png").Path); $o=[Drawing.Bitmap]::new($base); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
for($y=34;$y -le 58;$y++){ for($x=46;$x -lt 64;$x++){ $o.SetPixel($x,$y,$clear) } }
$ink=C '2c0e06'
function Put($layer){ for($y=1;$y -lt 63;$y++){ for($x=1;$x -lt 64;$x++){
   if($layer.GetPixel($x,$y).A){ $o.SetPixel($x,$y,$layer.GetPixel($x,$y)); continue }
   $r= if($x -lt 63){$layer.GetPixel($x+1,$y).A}else{0}
   if($layer.GetPixel($x-1,$y).A -or $r -or $layer.GetPixel($x,$y-1).A -or $layer.GetPixel($x,$y+1).A){ $o.SetPixel($x,$y,$ink) } } } }
# 1) handle: from the disc center down-left, 2 px thick, wrapped in two purples; pommel at the end
$h=[Drawing.Bitmap]::new(64,64)
for($i=0;$i -le 19;$i++){ $x=[int][math]::Round(53 - $i*0.3); $y=40+$i; $c= if(($i % 3) -eq 2){'3a1440'}else{'7a3484'}
  $h.SetPixel($x,$y,(C $c)); $h.SetPixel($x+1,$y,(C $(if(($i % 3) -eq 2){'2a0e30'}else{'552060'}))) }
foreach($p in @(@(47,60,'b4bccb'),@(48,60,'e8ecf4'),@(49,60,'9aa2b2'),@(47,61,'6e7586'),@(48,61,'b4bccb'),@(49,61,'6e7586'),@(48,59,'e8ecf4'))){ $h.SetPixel($p[0],$p[1],(C $p[2])) }
Put $h
# 2) blades
$w=[Drawing.Bitmap]::new(64,64); $cx=53.0; $cy=39.0; $tip=9.6; $hub=3.6
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
  $dx=$x-$cx; $dy=$y-$cy; $dist=[math]::Sqrt($dx*$dx+$dy*$dy); if($dist -gt $tip){continue}
  $col=$null
  if($dist -le $hub){ $col= if($dx+$dy -lt -2){'9aa2b2'}elseif($dx+$dy -gt 3){'4a5060'}else{'6e7586'} }
  else { foreach($a in 0,60,120,180,240,300){ $rad=$a*[math]::PI/180; $along=$dx*[math]::Cos($rad)+$dy*[math]::Sin($rad); $side=-$dx*[math]::Sin($rad)+$dy*[math]::Cos($rad)
      if($along -gt 0 -and [math]::Abs($side) -le 2.5*(1-($along-$hub)/($tip-$hub))+0.35){ $col= if($side -lt -0.4){'e8ecf4'}elseif($side -gt 0.8){'6e7586'}else{'b4bccb'}; break } } }
  if($col){ $w.SetPixel($x,$y,(C $col)) } } }
Put $w
foreach($p in @(@(53,39),@(52,39),@(53,38),@(52,38))){ $o.SetPixel($p[0],$p[1],(C '3a1440')) }   # center hole
$o.SetPixel(52,38,(C '9a5cc0'))
# 3) arm to the handle, then the fist wrapped around it (handle shows above and below)
$a=[Drawing.Bitmap]::new(64,64)
foreach($p in @(@(45,50),@(46,50),@(45,51),@(46,51),@(47,51),@(46,52),@(47,52),@(48,52))){ $a.SetPixel($p[0],$p[1],(C '4a1c4e')) }
foreach($p in @(@(48,51,'fcd5a6'),@(49,51,'fcd5a6'),@(50,51,'fcd5a6'),@(51,51,'fcd5a6'),@(48,52,'fcd5a6'),@(49,52,'fcd5a6'),@(50,52,'fcd5a6'),@(51,52,'f2b480'),@(49,53,'f2b480'),@(50,53,'f2b480'),@(48,53,'f2b480'))){ $a.SetPixel($p[0],$p[1],(C $p[2])) }
Put $a
$o.SetPixel(50,52,(C 'f2b480')); $o.SetPixel(51,52,$ink)
foreach($y in 47..50){ foreach($x in 43..45){ $c=$o.GetPixel($x,$y); if($c.R -gt 200 -and $c.G -gt 140){ $o.SetPixel($x,$y,(C '4a1c4e')) } } }   # old fist pixels become sleeve
$o.Save((Join-Path (Get-Location) "$d/h1.png"))
$s=[Drawing.Bitmap]::new(1200,860); $g=[Drawing.Graphics]::FromImage($s); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('shuriken before',"$d/s8.png"),@('with handle',"$d/h1.png"))){ $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,$i*400+8,20,384,384); $g.DrawImage($b,$i*400+170,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); if($i){ $g.DrawImage($b,[Drawing.Rectangle]::new($i*400+20,500,360,360),40,34,28,28,'Pixel') }; $i++ }
$s.Save((Join-Path (Get-Location) "$d/handle.png"))
