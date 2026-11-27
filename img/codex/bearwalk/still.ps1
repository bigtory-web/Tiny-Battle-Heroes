# current Roxy still on a 64x64 canvas (feet on the bottom row), 8x for attaching
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bear.png')); $c=New-Object System.Drawing.Bitmap 64,64; $g=[System.Drawing.Graphics]::FromImage($c); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,(64-$s.Height),$s.Width,$s.Height); $c.Save([IO.Path]::GetFullPath('img\codex\bearwalk\bear64.png'))
$o=New-Object System.Drawing.Bitmap 512,512; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($c,0,0,512,512); $o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\bear_x8.png'))
