# 8x nearest-neighbour copy: x8any.ps1 -Names coral_new6,vine_new6
param([string]$Names)
Add-Type -AssemblyName System.Drawing
foreach($n in $Names -split ','){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$n.png"))
  $o=New-Object System.Drawing.Bitmap ($im.Width*8),($im.Height*8); $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($im,0,0,$o.Width,$o.Height); $o.Save([IO.Path]::GetFullPath("img\codex\redo3\${n}_x8.png")) }
