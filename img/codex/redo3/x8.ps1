# 8x nearest-neighbour copies of the game sprites (same pixels, big enough for the model to see the eyes) + knight face zoom
Add-Type -AssemblyName System.Drawing
foreach($n in 'knight','flame','vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$n.png"))
  $o=New-Object System.Drawing.Bitmap ($im.Width*8),($im.Height*8); $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($im,0,0,$o.Width,$o.Height); $o.Save([IO.Path]::GetFullPath("img\codex\redo3\${n}_x8.png")) }
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\knight.png'))
$o=New-Object System.Drawing.Bitmap 520,320; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($im,(New-Object System.Drawing.Rectangle 0,0,520,320),(New-Object System.Drawing.Rectangle 21,27,26,16),[System.Drawing.GraphicsUnit]::Pixel); $o.Save([IO.Path]::GetFullPath('img\codex\redo3\knight_face.png'))
