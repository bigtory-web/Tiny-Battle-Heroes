# magenta strip -> same 2x2 pixel grid as bg_cave, unbroken silhouette outline, dusk/night recolours, preview
Add-Type -AssemblyName System.Drawing
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
& img\codex\cave\pixelize.ps1 -In img\codex\cavefg\fg_raw.png -Out img\codex\cavefg\px.png -W 360 -H 120
$s = Load 'img\codex\cavefg\px.png'
$on = New-Object 'bool[,]' 360,40
for($j=0;$j -lt 40;$j++){ for($i=0;$i -lt 360;$i++){ $c=$s.GetPixel($i*2,160+$j*2); $on[$i,$j] = -not (($c.R - $c.G) -gt 40 -and ($c.B - $c.G) -gt 40) } }
$line=[System.Drawing.ColorTranslator]::FromHtml('#1b2340')
$o = New-Object System.Drawing.Bitmap 720,80
for($j=0;$j -lt 40;$j++){ for($i=0;$i -lt 360;$i++){ if(-not $on[$i,$j]){continue}
  $c=$s.GetPixel($i*2,160+$j*2)
  $edge = ($i -gt 0 -and -not $on[($i-1),$j]) -or ($i -lt 359 -and -not $on[($i+1),$j]) -or ($j -gt 0 -and -not $on[$i,($j-1)])
  if($edge -or (($c.R - $c.G) -gt 12 -and ($c.B - $c.G) -gt 12)){ $c=$line }
  foreach($dx in 0,1){ foreach($dy in 0,1){ $o.SetPixel($i*2+$dx,$j*2+$dy,$c) } } } }
$o.Save([IO.Path]::GetFullPath('img\p\fg_cave.png')); $s.Dispose(); Remove-Item img\codex\cavefg\px.png
& img\codex\cave\recolor.ps1 -In img\p\fg_cave.png -OutDusk img\p\fg_cave_dusk.png -OutNight img\p\fg_cave_night.png
# preview the way the game shows it: background raised 58 px (bottom strip mirrored), foreground on the bottom 80 rows
$out = New-Object System.Drawing.Bitmap 720,1056; $g=[System.Drawing.Graphics]::FromImage($out); $g.Clear([System.Drawing.Color]::White); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$k=0; foreach($v in '','_dusk','_night'){ $bg=Load "img\p\bg_cave$v.png"; $fg=Load "img\p\fg_cave$v.png"; $y=$k*(344+12)
  $g.SetClip((New-Object System.Drawing.Rectangle 0,$y,720,344)); $g.DrawImage($bg,0,($y-58),720,402)
  $st=$bg.Clone((New-Object System.Drawing.Rectangle(0,344,720,58)),$bg.PixelFormat); $st.RotateFlip('RotateNoneFlipY'); $g.DrawImage($st,0,($y+344-58),720,58)
  $g.DrawImage($fg,0,($y+344-80),720,80); $g.ResetClip(); $k++ }
$out.Save([IO.Path]::GetFullPath('img\codex\cavefg\compare.png'))
