Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\walk1.png')); $o=New-Object System.Drawing.Bitmap 512,512; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,512,512); $o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walkB_x8.png'))
