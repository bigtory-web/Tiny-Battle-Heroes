Add-Type -AssemblyName System.Drawing
# flame and coral again, with the fireball / shield / body masked out instead of cropping the hair
function Head($id,$name,$x0,$y0,$w,$ht,$skip){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$id.png")); $c=New-Object System.Drawing.Bitmap $w,$ht
  for($y=0;$y -lt $ht;$y++){ for($x=0;$x -lt $w;$x++){ $sx=$x+$x0; $sy=$y+$y0; if(& $skip $sx $sy){continue}; $c.SetPixel($x,$y,$im.GetPixel($sx,$sy)) } }
  $o=New-Object System.Drawing.Bitmap ($w*8),($ht*8); $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($c,0,0,($w*8),($ht*8)); $o.Save([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$name.png")) }
Head 'flame' 'flame_short' 14 18 31 26 { param($x,$y) ($x -ge 43 -and $y -ge 32) -or ($x -ge 42 -and $y -ge 36) }
Head 'coral' 'coral_twincurl' 8 22 42 27 { param($x,$y) ($y -ge 44 -and $x -ge 38) -or ($y -ge 45 -and $x -ge 22) }
$p=New-Object System.Drawing.Bitmap 1150,300; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage((New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('.claude\skills\game-art-hero\references\face\face.png'))),10,70,192,128)
$x=230; foreach($n in 'flame_short','vine_ponytail','coral_twincurl'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath(".claude\skills\game-art-hero\references\hair\$n.png")); $g.DrawImage($im,$x,30,$im.Width,$im.Height); $x+=$im.Width+30 }
$p.Save([IO.Path]::GetFullPath('img\codex\redo3\library.png'))
