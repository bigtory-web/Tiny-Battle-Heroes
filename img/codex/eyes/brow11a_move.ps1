# 11A (brows 1 px lower): MOVE each whole brow 1 px, same length.  A = both outward, B = both toward the left
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$L=[System.Drawing.ColorTranslator]::FromHtml('#500e09'); $S=[System.Drawing.ColorTranslator]::FromHtml('#fdd3a8')
$left=@(@(31,37),@(32,38),@(33,38)); $right=@(@(39,36),@(38,37),@(37,37))
function Make($dl,$dr){ $b=Load 'img\codex\eyes\eye11A_low.png'; $hair=$b.GetPixel(30,33)
  # lift the old brows, and pull the hairline back where the moved brows go (same dark colour would swallow them)
  foreach($p in $left+$right){ $b.SetPixel($p[0],$p[1],$S) }
  foreach($p in @(@(29,35),@(30,35),@(30,36),@(29,36),@(29,37),@(30,37),@(29,38))){ $b.SetPixel($p[0],$p[1],$S) }; foreach($p in @(@(28,36),@(28,37),@(28,38),@(29,34))){ $b.SetPixel($p[0],$p[1],$L) }
  if($dr -gt 0){ foreach($p in @(@(40,35),@(40,36),@(40,37))){ $b.SetPixel($p[0],$p[1],$S) }; foreach($p in @(@(41,35),@(41,36),@(41,37),@(40,34))){ $b.SetPixel($p[0],$p[1],$L) } }
  foreach($p in $left){ $b.SetPixel($p[0]+$dl,$p[1],$L) }; foreach($p in $right){ $b.SetPixel($p[0]+$dr,$p[1],$L) }
  return $b }
$now=Load 'img\codex\eyes\eye11A_low.png'; $a=Make -1 1; $bb=Make -1 -1
$a.Save([IO.Path]::GetFullPath('img\codex\eyes\eye11A_moveA.png')); $bb.Save([IO.Path]::GetFullPath('img\codex\eyes\eye11A_moveB.png'))
$o=New-Object System.Drawing.Bitmap 1350,420; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',18,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($it in @(@('now',$now),@('A',$a),@('B',$bb))){ $ox=$i*450; $g.DrawString($it[0],$font,[System.Drawing.Brushes]::White,($ox+10),4)
  $g.DrawImage($it[1],(New-Object System.Drawing.Rectangle ($ox+5),34,440,308),(New-Object System.Drawing.Rectangle 23,30,20,14),[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($it[1],(New-Object System.Drawing.Rectangle ($ox+190),350,72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\brow11a_move.png'))
