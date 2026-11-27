# cut concepts 4, 5, 8 into face templates (same mask and position as face.png; 1 = face.png itself)
Add-Type -AssemblyName System.Drawing
$rows=@{37=@(37,40);38=@(29,40);39=@(29,40);40=@(29,40);41=@(29,40);42=@(29,40);43=@(29,39);44=@(30,38)}
$prev=New-Object System.Drawing.Bitmap 480,80; $g=[System.Drawing.Graphics]::FromImage($prev); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($p in @(@(1,''),@(4,'sleepy'),@(5,'sparkle'),@(8,'lashes'))){ $s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\eyes\eye$($p[0]).png")); $f=New-Object System.Drawing.Bitmap 12,8
  foreach($y in $rows.Keys){ for($x=$rows[$y][0];$x -le $rows[$y][1];$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $f.SetPixel($x-29,$y-37,$c) } } }
  if($p[1]){ $f.Save([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\face\face_$($p[1]).png")) }
  $g.DrawImage($f,($i*120+12),8,96,64); $i++ }
$prev.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\styles.png'))
