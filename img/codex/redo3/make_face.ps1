# one-off: cut the approved face (Blaze) into the skill's face template, 12x8, only face pixels
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\flame.png'))
$rows=@{37=@(37,40);38=@(29,40);39=@(29,40);40=@(29,40);41=@(29,40);42=@(29,40);43=@(29,39);44=@(30,38)}
$f=New-Object System.Drawing.Bitmap 12,8
foreach($y in $rows.Keys){ for($x=$rows[$y][0];$x -le $rows[$y][1];$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $f.SetPixel($x-29,$y-37,$c) } } }
$f.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face.png'))
$o=New-Object System.Drawing.Bitmap 96,64; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($f,0,0,96,64); $o.Save([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face_x8.png'))
# head crops of the confirmed hairstyles, 8x
foreach($h in @(@('flame','flame_short',14,18,28,26),@('vine','vine_ponytail',14,20,29,25),@('coral','coral_twincurl',10,22,39,23))){
  $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$($h[0]).png"))
  $w=[int]$h[4]; $ht=[int]$h[5]; $o=New-Object System.Drawing.Bitmap ($w*8),($ht*8); $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
  $g.DrawImage($im,(New-Object System.Drawing.Rectangle 0,0,($w*8),($ht*8)),(New-Object System.Drawing.Rectangle ([int]$h[2]),([int]$h[3]),$w,$ht),[System.Drawing.GraphicsUnit]::Pixel)
  $o.Save([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$($h[1]).png")) }
# preview sheet of the template and the three hair crops
$p=New-Object System.Drawing.Bitmap 1100,300; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage((New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face.png'))),10,70,192,128)
$x=230; foreach($n in 'flame_short','vine_ponytail','coral_twincurl'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$n.png")); $g.DrawImage($im,$x,30,$im.Width,$im.Height); $x+=$im.Width+30 }
$p.Save([IO.Path]::GetFullPath('img\codex\redo3\library.png'))
# flame and coral again, with the fireball / shield / body masked out instead of cropping the hair
function Head($id,$name,$x0,$y0,$w,$ht,$skip){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$id.png")); $c=New-Object System.Drawing.Bitmap $w,$ht
  for($y=0;$y -lt $ht;$y++){ for($x=0;$x -lt $w;$x++){ $sx=$x+$x0; $sy=$y+$y0; if(& $skip $sx $sy){continue}; $c.SetPixel($x,$y,$im.GetPixel($sx,$sy)) } }
  $o=New-Object System.Drawing.Bitmap ($w*8),($ht*8); $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($c,0,0,($w*8),($ht*8)); $o.Save([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$name.png")) }
Head 'flame' 'flame_short' 14 18 31 26 { param($x,$y) $x -ge 43 -and $y -ge 32 }
Head 'coral' 'coral_twincurl' 8 22 42 27 { param($x,$y) ($y -ge 44 -and $x -ge 38) -or ($y -ge 45 -and $x -ge 22) }
$p=New-Object System.Drawing.Bitmap 1150,300; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage((New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face.png'))),10,70,192,128)
$x=230; foreach($n in 'flame_short','vine_ponytail','coral_twincurl'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$n.png")); $g.DrawImage($im,$x,30,$im.Width,$im.Height); $x+=$im.Width+30 }
$p.Save([IO.Path]::GetFullPath('img\codex\redo3\library.png'))
