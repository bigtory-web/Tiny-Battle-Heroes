# eye design concepts drawn on Blaze's head.  Each eye is 3x3, written for the LEFT eye (outer -> inner); the right eye is mirrored.
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$col=@{ 'W'='#fcfcfa'; 'x'='#e2d7d8'; 'D'='#782e07'; 'A'='#d67d0e'; 'L'='#500e09'; 'S'='#fdd3a8'; 'G'='#ffffff' }
$basic='xDD','WDD','WAA'
# top, mid, bottom, brow (keep / none / in = inner end low / out = outer end low), lash
$list=@(
 @('xDD','WDD','WAA','keep',0), @('xDD','WDD','WAA','in',0), @('xDD','WDD','WAA','out',0), @('SSS','LLL','WAA','none',0), @('xDD','WGD','WAA','keep',0),
 @('SDD','WGD','SAA','keep',0), @('xDA','WDA','WDA','keep',0), @('LLL','xDD','WAA','none',1), @('SSS','LLL','SSS','keep',0), @('SSS','SDD','SDD','keep',0))
$base=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame.png'))
$cw=300; $ch=330
$o=New-Object System.Drawing.Bitmap (5*$cw),(2*$ch); $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear((C '#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($e in $list){
  $b=New-Object System.Drawing.Bitmap $base; $L=C $col['L']; $S=C $col['S']
  if($e[3] -ne 'keep'){ foreach($x in 30..33){ $b.SetPixel($x,38,$S) }; $b.SetPixel(30,39,$S); foreach($x in 37..39){ $b.SetPixel($x,37,$S) } }
  for($r=0;$r -lt 3;$r++){ $s=$e[$r]; for($k=0;$k -lt 3;$k++){ $c=C $col[[string]$s[$k]]; $b.SetPixel(31+$k,39+$r,$c); $b.SetPixel(39-$k,38+$r,$c) } }
  $brow=@{ 'in'=@(@(30,37),@(31,38),@(32,38),@(33,39),@(40,36),@(39,37),@(38,37),@(37,38)); 'out'=@(@(30,39),@(31,38),@(32,38),@(33,37),@(37,36),@(38,37),@(39,37),@(40,38)) }[$e[3]]
  foreach($p in $brow){ if($p){ $b.SetPixel($p[0],$p[1],$L) } }
  if($e[4]){ foreach($p in @(@(30,39),@(30,38),@(40,38),@(40,37))){ $b.SetPixel($p[0],$p[1],$L) } }
  $b.Save([IO.Path]::GetFullPath("img\codex\eyes\eye$($i+1).png"))
  $ox=($i%5)*$cw; $oy=[math]::Floor($i/5)*$ch
  $g.DrawString("$($i+1)",$font,[System.Drawing.Brushes]::White,($ox+10),($oy+4))
  $g.DrawImage($b,(New-Object System.Drawing.Rectangle ($ox+18),($oy+34),264,220),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($b,(New-Object System.Drawing.Rectangle ($ox+114),($oy+258),72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\concepts.png'))
