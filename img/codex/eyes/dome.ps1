# dome eyes: the lid arches over the eye and comes down the side away from the gaze (the face looks right -> the LEFT side of both eyes)
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$col=@{ 'W'='#fcfcfa'; 'x'='#e2d7d8'; 'D'='#782e07'; 'A'='#d67d0e'; 'L'='#500e09'; 'S'='#fdd3a8' }
$L=C '#500e09'; $S=C '#fdd3a8'
# lid pixels given relative to each eye's top-left: left eye (31,39), right eye (37,38).  eye rows written left->right per eye
$list=@(
 @{ n='18A'; lid=@(@(0,-1),@(1,-1),@(2,-1),@(-1,0),@(-1,1)); left='xDD','WDD','WAA'; right='DDx','DDW','AAW' },
 @{ n='18B'; lid=@(@(0,-1),@(1,-1),@(2,-1),@(-1,0),@(-1,1),@(-1,2)); left='xDD','WDD','WAA'; right='DDx','DDW','AAW' },
 @{ n='18C'; lid=@(@(1,-1),@(2,-1),@(0,0),@(-1,1),@(-1,2)); left='LDD','WDD','WAA'; right='LDx','DDW','AAW' })
$base=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame.png'))
$o=New-Object System.Drawing.Bitmap 1200,330; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear((C '#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$ims=@(,@('1',$base))
foreach($e in $list){ $b=New-Object System.Drawing.Bitmap $base
  # open the forehead and the skin around the eyes so the arch reads
  foreach($y in 35..37){ foreach($x in 30..39){ $b.SetPixel($x,$y,$S) } }; foreach($x in 29..36){ $b.SetPixel($x,38,$S) }; foreach($y in 39..41){ $b.SetPixel(29,$y,$S); $b.SetPixel(30,$y,$S); $b.SetPixel(36,$y,$S) }
  foreach($p in @(@(29,36),@(30,35),@(31,34),@(32,34),@(33,34),@(34,34),@(35,35),@(36,34),@(37,34),@(38,34),@(39,34),@(40,35),@(28,37),@(28,38),@(28,39),@(28,40),@(28,41),@(28,42))){ $b.SetPixel($p[0],$p[1],$L) }
  foreach($eye in @(@(31,39,$e.left),@(37,38,$e.right))){ $ex=$eye[0]; $ey=$eye[1]; $rows=$eye[2]
    for($r=0;$r -lt 3;$r++){ for($k=0;$k -lt 3;$k++){ $b.SetPixel($ex+$k,$ey+$r,(C $col[[string]$rows[$r][$k]])) } }
    foreach($p in $e.lid){ $b.SetPixel($ex+$p[0],$ey+$p[1],$L) } }
  $b.Save([IO.Path]::GetFullPath("img\codex\eyes\eye$($e.n).png")); $ims+=,@($e.n,$b) }
$i=0; foreach($p in $ims){ $ox=$i*300; $g.DrawString($p[0],$font,[System.Drawing.Brushes]::White,($ox+10),4)
  $g.DrawImage($p[1],(New-Object System.Drawing.Rectangle ($ox+18),34,264,220),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($p[1],(New-Object System.Drawing.Rectangle ($ox+114),258,72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\dome.png'))
