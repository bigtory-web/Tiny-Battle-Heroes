# masculine / brave eye concepts 11..17 on Blaze's head (same 3x3 eye grid as concepts.ps1, own brows)
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$col=@{ 'W'='#fcfcfa'; 'x'='#e2d7d8'; 'D'='#782e07'; 'A'='#d67d0e'; 'L'='#500e09'; 'S'='#fdd3a8' }
$L=C '#500e09'; $S=C '#fdd3a8'
$inL=@(@(30,36),@(31,37),@(32,37),@(33,38),@(34,38)); $inR=@(@(40,35),@(39,36),@(38,36),@(37,37),@(36,37))
$list=@(
 @{ n=11; eye='DDD','WDD','WAA'; brow=$inL+$inR },
 @{ n=12; eye='xDD','WDD','WAA'; brow=@(@(29,38),@(30,38),@(31,38),@(32,38),@(33,38),@(34,38),@(36,37),@(37,37),@(38,37),@(39,37),@(40,37)) },
 @{ n=13; eye='xDD','WDD','WAA'; brow=@(@(30,37),@(31,37),@(32,37),@(33,37),@(30,38),@(31,38),@(32,38),@(33,38),@(37,36),@(38,36),@(39,36),@(40,36),@(37,37),@(38,37),@(39,37),@(40,37)) },
 @{ n=14; eye='SSS','LLL','WDA'; brow=@(@(30,38),@(31,38),@(32,39),@(33,39),@(40,37),@(39,37),@(38,38),@(37,38)) },
 @{ n=15; eye='xDD','WDD','WAA'; brow=$inL+$inR; extra=@(@(33,35,'#b9605a'),@(33,36,'#b9605a'),@(32,37,'#f6a58a'),@(31,42,'#b9605a'),@(31,43,'#b9605a')) },
 @{ n=16; eye='xDD','WDD','WAA'; brow=$inR; patch=$true },
 @{ n=17; eye='xDD','WDD','WAA'; brow=$inL+$inR; jaw=$true })
$base=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame.png'))
$cw=300; $ch=330
$o=New-Object System.Drawing.Bitmap (4*$cw),(2*$ch); $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear((C '#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($e in $list){
  $b=New-Object System.Drawing.Bitmap $base
  # open the forehead so the brows read (bangs lines sat right on top of them)
  foreach($y in 35..37){ foreach($x in 31..39){ $b.SetPixel($x,$y,$S) } }; foreach($x in 30..33){ $b.SetPixel($x,38,$S) }; $b.SetPixel(30,39,$S); foreach($x in 37..39){ $b.SetPixel($x,37,$S) }
  foreach($p in @(@(30,36),@(31,35),@(32,34),@(33,34),@(34,34),@(35,35),@(36,34),@(37,34),@(38,34),@(39,35),@(40,35))){ $b.SetPixel($p[0],$p[1],$L) }
  for($r=0;$r -lt 3;$r++){ $row=$e.eye[$r]; for($k=0;$k -lt 3;$k++){ $c=C $col[[string]$row[$k]]; $b.SetPixel(31+$k,39+$r,$c); $b.SetPixel(39-$k,38+$r,$c) } }
  foreach($p in $e.brow){ $b.SetPixel($p[0],$p[1],$L) }
  foreach($p in $e.extra){ if($p){ $b.SetPixel($p[0],$p[1],(C $p[2])) } }
  if($e.patch){ $pc=C '#2a1712'; foreach($y in 38..42){ foreach($x in 30..34){ if(-not (($y -eq 42) -and ($x -eq 30 -or $x -eq 34))){ $b.SetPixel($x,$y,$pc) } } }; foreach($p in @(@(29,37),@(35,37),@(36,36),@(37,35),@(38,35),@(28,36))){ $b.SetPixel($p[0],$p[1],$pc) }; $b.SetPixel(31,39,(C '#6b4a3a')) }
  if($e.jaw){ foreach($p in @(@(39,42),@(38,43),@(39,43),@(29,43))){ $b.SetPixel($p[0],$p[1],$S) }; foreach($p in @(@(40,42),@(40,43),@(28,42),@(28,43))){ $b.SetPixel($p[0],$p[1],$L) }; foreach($x in 28..40){ $b.SetPixel($x,44,$L) } }
  $b.Save([IO.Path]::GetFullPath("img\codex\eyes\eye$($e.n).png"))
  $ox=($i%4)*$cw; $oy=[math]::Floor($i/4)*$ch
  $g.DrawString("$($e.n)",$font,[System.Drawing.Brushes]::White,($ox+10),($oy+4))
  $g.DrawImage($b,(New-Object System.Drawing.Rectangle ($ox+18),($oy+34),264,220),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($b,(New-Object System.Drawing.Rectangle ($ox+114),($oy+258),72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\brave.png'))
