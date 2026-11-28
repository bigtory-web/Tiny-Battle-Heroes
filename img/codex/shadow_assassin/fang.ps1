# hand-drawn curved barbed blade (reference: user's picture) on the approved head/mask
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$base=[Drawing.Bitmap]::new((Resolve-Path "$d/w1.png").Path); $head=[Drawing.Bitmap]::new((Resolve-Path "$d/s7.png").Path)
$o=[Drawing.Bitmap]::new($base); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
for($y=34;$y -le 60;$y++){ for($x=47;$x -lt 64;$x++){ $o.SetPixel($x,$y,$clear) } }
for($y=20;$y -le 46;$y++){ for($x=26;$x -le 43;$x++){ $o.SetPixel($x,$y,$head.GetPixel($x,$y)) } }
$w=[Drawing.Bitmap]::new(64,64); $g=[Drawing.Graphics]::FromImage($w); $g.SmoothingMode='None'; $g.PixelOffsetMode='Half'
$pts=@(@(48,47),@(52,46),@(51,42),@(54,44),@(56,42),@(54,38),@(58,39),@(59,35),@(62,31),@(63,38),@(62,44),@(59,49),@(54,52),@(48,51)) | ForEach-Object { [Drawing.Point]::new($_[0],$_[1]) }
$g.FillPolygon([Drawing.SolidBrush]::new((C '3c4468')),[Drawing.Point[]]$pts); $g.Dispose()
$o2=[Drawing.Bitmap]::new($w)
for($y=1;$y -lt 63;$y++){ for($x=1;$x -lt 63;$x++){ if(-not $w.GetPixel($x,$y).A){continue}
  $out = -not $w.GetPixel([math]::Min(63,$x+1),$y).A -or -not $w.GetPixel($x,$y+1).A          # outer (cutting) edge: lower right
  $out2= -not $w.GetPixel([math]::Min(63,$x+2),$y).A -or -not $w.GetPixel($x,$y+2).A
  $in  = -not $w.GetPixel($x-1,$y).A -or -not $w.GetPixel($x,$y-1).A
  if($out){$o2.SetPixel($x,$y,(C 'eef2fc'))} elseif($out2){$o2.SetPixel($x,$y,(C 'a8b4d8'))} elseif($in){$o2.SetPixel($x,$y,(C '6a76a8'))} } }
$ink=C '1c0a10'
for($y=1;$y -lt 63;$y++){ for($x=1;$x -lt 64;$x++){
  $c=$o2.GetPixel($x,$y); if($c.A){ $o.SetPixel($x,$y,$c); continue }
  $r= if($x -lt 63){$o2.GetPixel($x+1,$y).A}else{0}
  if($o2.GetPixel($x-1,$y).A -or $r -or $o2.GetPixel($x,$y-1).A -or $o2.GetPixel($x,$y+1).A){ $o.SetPixel($x,$y,$ink) } } }
# grip: fist over the hilt, purple wrap, short chain with a tiny cross
foreach($p in @(@(45,48,'fcd5a6'),@(46,48,'fcd5a6'),@(47,48,'fcd5a6'),@(45,49,'fcd5a6'),@(46,49,'fcd5a6'),@(47,49,'f2b480'),@(45,50,'f2b480'),@(46,50,'f2b480'),@(47,50,'6c2e72'),@(48,49,'6c2e72'),@(48,50,'4a1c4e'),@(45,47,'1c0a10'),@(46,47,'1c0a10'),@(47,47,'1c0a10'),@(45,51,'1c0a10'),@(46,51,'1c0a10'),@(47,51,'1c0a10'),
   @(46,52,'a8b4d8'),@(46,54,'a8b4d8'),@(46,56,'eef2fc'),@(45,57,'eef2fc'),@(46,57,'eef2fc'),@(47,57,'eef2fc'),@(46,58,'eef2fc'),@(46,59,'a8b4d8'),@(46,53,'1c0a10'),@(46,55,'1c0a10'))){ $o.SetPixel($p[0],$p[1],(C $p[2])) }
$o.Save((Join-Path (Get-Location) "$d/fang.png"))
