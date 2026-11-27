# the user marked (34,38) and (36,38): just in front of each pupil, toward the nose
#   1: fill exactly those two cells   2: move the brows toward them, same length
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$L=[System.Drawing.ColorTranslator]::FromHtml('#500e09'); $S=[System.Drawing.ColorTranslator]::FromHtml('#fdd3a8')
$now=Load 'img\codex\eyes\eye11A_low.png'; $one=Load 'img\codex\eyes\eye11A_low.png'; $two=Load 'img\codex\eyes\eye11A_low.png'
$one.SetPixel(34,38,$L); $one.SetPixel(36,38,$L)
foreach($p in @(@(31,37),@(32,38),@(33,38),@(39,36),@(38,37),@(37,37))){ $two.SetPixel($p[0],$p[1],$S) }
foreach($p in @(@(32,37),@(33,38),@(34,38),@(38,37),@(37,37),@(36,38))){ $two.SetPixel($p[0],$p[1],$L) }
$one.Save([IO.Path]::GetFullPath('img\codex\eyes\eye11A_mark1.png')); $two.Save([IO.Path]::GetFullPath('img\codex\eyes\eye11A_mark2.png'))
$o=New-Object System.Drawing.Bitmap 1350,420; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($it in @(@('now',$now),@('1',$one),@('2',$two))){ $ox=$i*450; $g.DrawString($it[0],$font,[System.Drawing.Brushes]::White,($ox+10),4)
  $g.DrawImage($it[1],(New-Object System.Drawing.Rectangle ($ox+5),34,440,308),(New-Object System.Drawing.Rectangle 23,30,20,14),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($it[1],(New-Object System.Drawing.Rectangle ($ox+190),350,72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\brow11a_front2.png'))
