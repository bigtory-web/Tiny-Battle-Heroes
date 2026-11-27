# 11A version 1 -> face_brave.png (12x9: one row taller than the others, for the raised brow)
Add-Type -AssemblyName System.Drawing
$rows=@{36=@(37,39);37=@(31,40);38=@(29,40);39=@(29,40);40=@(29,40);41=@(29,40);42=@(29,40);43=@(29,39);44=@(30,38)}
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\eyes\eye11A_mark1.png')); $f=New-Object System.Drawing.Bitmap 12,9
foreach($y in $rows.Keys){ for($x=$rows[$y][0];$x -le $rows[$y][1];$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $f.SetPixel($x-29,$y-36,$c) } } }
$f.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face_brave.png'))
$prev=New-Object System.Drawing.Bitmap 600,88; $g=[System.Drawing.Graphics]::FromImage($prev); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($n in 'face','face_sleepy','face_sparkle','face_lashes','face_brave'){ $t=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\face\$n.png")); $g.DrawImage($t,($i*120+12),(8+(9-$t.Height)*8),96,($t.Height*8)); $t.Dispose(); $i++ }
$prev.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\styles.png'))
