# 11 again: brows sit right over the eyes (left eye x31..33 top row 39, right x37..39 top row 38); only the slant differs
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$L=C '#500e09'; $S=C '#fdd3a8'
$list=@(
 @{ n='A'; brow=@(@(31,37),@(32,38),@(33,38), @(39,36),@(38,37),@(37,37)) },
 @{ n='B'; brow=@(@(30,37),@(31,37),@(32,38),@(33,38), @(40,36),@(39,36),@(38,37),@(37,37)) },
 @{ n='C'; brow=@(@(31,36),@(32,37),@(33,38), @(39,35),@(38,36),@(37,37)) })
$base=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame.png'))
$o=New-Object System.Drawing.Bitmap 1200,330; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear((C '#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$old=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\eyes\eye11.png'))
$ims=@(,@('11',$old))
foreach($e in $list){ $b=New-Object System.Drawing.Bitmap $base
  foreach($y in 34..37){ foreach($x in 31..39){ $b.SetPixel($x,$y,$S) } }; foreach($x in 30..33){ $b.SetPixel($x,38,$S) }; $b.SetPixel(30,39,$S)
  foreach($p in @(@(30,36),@(31,35),@(32,33),@(33,33),@(34,33),@(35,34),@(36,33),@(37,33),@(38,33),@(39,34),@(40,35))){ $b.SetPixel($p[0],$p[1],$L) }
  foreach($p in $e.brow){ $b.SetPixel($p[0],$p[1],$L) }
  $b.Save([IO.Path]::GetFullPath("img\codex\eyes\eye11$($e.n)_low.png")); $ims+=,@("11$($e.n)",$b) }
$i=0; foreach($p in $ims){ $ox=$i*300; $g.DrawString($p[0],$font,[System.Drawing.Brushes]::White,($ox+10),4)
  $g.DrawImage($p[1],(New-Object System.Drawing.Rectangle ($ox+18),34,264,220),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($p[1],(New-Object System.Drawing.Rectangle ($ox+114),258,72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\brow11_low.png'))
