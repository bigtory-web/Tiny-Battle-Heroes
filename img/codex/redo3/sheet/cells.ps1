param([string]$Id)
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("${Id}_atk_src.png")); $h=[int]($src.Width/2)
for($i=0;$i -lt 4;$i++){ $c=$src.Clone((New-Object System.Drawing.Rectangle (($i%2)*$h),([math]::Floor($i/2)*$h),$h,$h),$src.PixelFormat); $c.Save([IO.Path]::GetFullPath("${Id}_cell$i.png")) }
"$($src.Width)x$($src.Height)"
