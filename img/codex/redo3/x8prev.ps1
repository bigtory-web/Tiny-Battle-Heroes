Add-Type -AssemblyName System.Drawing
foreach($n in 'vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${n}_new3.png"))
  $o=New-Object System.Drawing.Bitmap 512,512; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($im,0,0,512,512); $o.Save([IO.Path]::GetFullPath("img\codex\redo3\${n}_new3_x8.png")) }
