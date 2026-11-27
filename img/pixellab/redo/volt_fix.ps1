# Volt (draft 2): knight-sized 3-point eyes without glow, viewer-left eye one lower; weapon outlined and readable
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\pixellab\redo\volt_b.png')); $o=New-Object System.Drawing.Bitmap $s
$ink=C '#501602'; $skin=C '#fbd3a3'
function Put($x,$y,$c){ $o.SetPixel($x,$y,$c) }
# clear both old eyes and brows
foreach($y in 22..26){ foreach($x in @(21,22,23,24,29,30,31)){ Put $x $y $skin } }
$white=C '#f6efe4'; $rows=@( (C '#4e1502'), (C '#aa5d02'), (C '#e49d08') )   # knight eye colours
# viewer-left eye (white on the left), brow at 23, eye 24-26
foreach($x in 21..24){ Put $x 23 $ink }
for($k=0;$k -lt 3;$k++){ Put 22 (24+$k) $white; Put 23 (24+$k) $rows[$k]; Put 24 (24+$k) $rows[$k] }
# viewer-right eye (white on the right), brow at 22, eye 23-25
foreach($x in 28..31){ Put $x 22 $ink }
for($k=0;$k -lt 3;$k++){ Put 29 (23+$k) $rows[$k]; Put 30 (23+$k) $rows[$k]; Put 31 (23+$k) $white }
# loose sparkles around the crystal blur its shape: keep only the biggest connected piece of the picture
$seen=New-Object 'bool[,]' 51,51; $comps=@()
for($y=0;$y -lt 51;$y++){ for($x=0;$x -lt 51;$x++){ if($seen[$x,$y] -or -not $o.GetPixel($x,$y).A){continue}
  $q=New-Object System.Collections.Queue; $q.Enqueue(@($x,$y)); $seen[$x,$y]=$true; $pts=New-Object System.Collections.ArrayList
  while($q.Count){ $p=$q.Dequeue(); [void]$pts.Add($p); foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$p[0]+$d[0]; $j=$p[1]+$d[1]; if($i -ge 0 -and $j -ge 0 -and $i -lt 51 -and $j -lt 51 -and -not $seen[$i,$j] -and $o.GetPixel($i,$j).A){ $seen[$i,$j]=$true; $q.Enqueue(@($i,$j)) } } }
  $comps+=,$pts } }
$main=($comps | Sort-Object Count -Descending)[0].Count
foreach($c in $comps){ if($c.Count -lt $main){ foreach($p in $c){ $o.SetPixel($p[0],$p[1],[System.Drawing.Color]::FromArgb(0,0,0,0)) } } }
# staff pole: light steel instead of navy-grey; crystal: darker right facet
for($y=0;$y -lt 51;$y++){ for($x=33;$x -lt 51;$x++){ $c=$o.GetPixel($x,$y); if(-not $c.A){continue}
  if($y -ge 19 -and $c.B -gt $c.R+20 -and $c.R -lt 90 -and $c.G -lt 100){ $o.SetPixel($x,$y,(C '#b8c4dc')) }
  elseif($y -le 16 -and $x -ge 41 -and $c.ToArgb() -eq (C '#3dc1fa').ToArgb()){ $o.SetPixel($x,$y,(C '#1778d0')) } } }
# unbroken dark outline wherever a coloured pixel touches empty space
$t=New-Object System.Drawing.Bitmap $o
for($y=0;$y -lt 51;$y++){ for($x=0;$x -lt 51;$x++){ if($t.GetPixel($x,$y).A){continue}
  foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$x+$d[0]; $j=$y+$d[1]; if($i -ge 0 -and $j -ge 0 -and $i -lt 51 -and $j -lt 51){ $n=$t.GetPixel($i,$j); if($n.A -and ($n.R+$n.G+$n.B) -gt 200){ $o.SetPixel($x,$y,$ink); break } } } } }
$o.Save([IO.Path]::GetFullPath('img\pixellab\redo\volt_c.png'))
$pv=New-Object System.Drawing.Bitmap 1560,420; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\knight.png','img\p\storm.png','img\pixellab\redo\volt_b.png','img\pixellab\redo\volt_c.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $g.DrawImage($im,($i*390+(390-$im.Width*7)/2),(410-$im.Height*7),($im.Width*7),($im.Height*7)); $i++ }
$pv.Save([IO.Path]::GetFullPath('img\pixellab\redo\volt_compare.png'))
