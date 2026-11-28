# hand-drawn 6-blade shuriken: round center disc is the grip, fist on it
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/s7.png").Path); $o=[Drawing.Bitmap]::new($s); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
for($y=40;$y -le 58;$y++){ for($x=46;$x -lt 64;$x++){ $o.SetPixel($x,$y,$clear) } }
$cx=52.0; $cy=49.0; $tip=10.4; $hub=3.8
$w=[Drawing.Bitmap]::new(64,64)
for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
  $dx=$x-$cx; $dy=$y-$cy; $dist=[math]::Sqrt($dx*$dx+$dy*$dy); if($dist -gt $tip){continue}
  $col=$null
  if($dist -le $hub){ $col= if($dx+$dy -lt -2){'9aa2b2'}elseif($dx+$dy -gt 3){'4a5060'}else{'6e7586'} }
  else { foreach($a in 0,60,120,180,240,300){ $rad=$a*[math]::PI/180; $along=$dx*[math]::Cos($rad)+$dy*[math]::Sin($rad); $side=-$dx*[math]::Sin($rad)+$dy*[math]::Cos($rad)
      if($along -gt 0 -and [math]::Abs($side) -le 2.6*(1-($along-$hub)/($tip-$hub))+0.35){ $col= if($side -lt -0.4){'e8ecf4'}elseif($side -gt 0.8){'6e7586'}else{'b4bccb'}; break } } }
  if($col){ $w.SetPixel($x,$y,(C $col)) } } }
$ink=C '2c0e06'
for($y=1;$y -lt 63;$y++){ for($x=1;$x -lt 63;$x++){
  if($w.GetPixel($x,$y).A){ $o.SetPixel($x,$y,$w.GetPixel($x,$y)) }
  elseif($w.GetPixel($x-1,$y).A -or $w.GetPixel($x+1,$y).A -or $w.GetPixel($x,$y-1).A -or $w.GetPixel($x,$y+1).A){ $o.SetPixel($x,$y,$ink) } } }
# center hole, then the fist gripping the disc (purple wrap -> skin knuckles)
$o.SetPixel(53,49,$ink)
$skin=C 'fcd5a6'; $shade=C 'f2b480'; $wrap=C '4a1c4e'
foreach($p in @(@(49,48),@(50,48),@(49,49),@(50,49),@(51,49),@(49,50))){ $o.SetPixel($p[0],$p[1],$skin) }
foreach($p in @(@(50,50),@(51,50))){ $o.SetPixel($p[0],$p[1],$shade) }
foreach($p in @(@(45,48),@(46,48),@(45,49),@(46,49),@(45,50),@(46,50))){ $o.SetPixel($p[0],$p[1],$wrap) }
foreach($p in @(@(47,48),@(47,49),@(47,50),@(48,49))){ $o.SetPixel($p[0],$p[1],(C '6c2e72')) }
foreach($p in @(@(49,47),@(50,47),@(48,48),@(51,48),@(52,49),@(52,50),@(49,51),@(50,51),@(51,51),@(48,50),@(45,47),@(46,47),@(47,47),@(45,51),@(46,51),@(47,51))){ $o.SetPixel($p[0],$p[1],$ink) }
$o.Save((Join-Path (Get-Location) "$d/s8.png"))
