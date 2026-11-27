# letter map of a region:  W white, A amber iris, # dark line, s skin, + other, . empty
param([string]$File,[int]$X0,[int]$Y0,[int]$W=18,[int]$H=11)
Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($File)); "== $File  x $X0..$($X0+$W-1)"
for($y=$Y0;$y -lt $Y0+$H;$y++){ $line=''; for($x=$X0;$x -lt $X0+$W;$x++){ $c=$im.GetPixel($x,$y)
    $L= if(-not $c.A){'.'} elseif($c.R -gt 225 -and $c.G -gt 215 -and $c.B -gt 205){'W'} elseif($c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135){'s'} elseif($c.R -lt 100 -and $c.G -lt 45){'#'} elseif($c.R -gt 160 -and $c.G -gt 90 -and $c.G -lt 170 -and $c.B -lt 45){'a'} elseif($c.R -ge 100 -and $c.G -lt 90 -and $c.B -lt 30){'b'} else {'+'}
    $line+=$L }; "{0,2} {1}" -f $y,$line }
