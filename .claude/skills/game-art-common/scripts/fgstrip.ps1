# magenta decoration strip -> 720x80 front layer on the same 2x2 pixel grid as the backgrounds, with an unbroken outline
param([Parameter(Mandatory)]$In, [Parameter(Mandatory)]$Out, $Line='#1b2340')
Add-Type -AssemblyName System.Drawing
$tmp = Join-Path $env:TEMP 'fgstrip_px.png'
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($In)); $H=[int][math]::Round(360.0*$src.Height/$src.Width); $src.Dispose()
& "$PSScriptRoot\pixelize.ps1" -In $In -Out $tmp -W 360 -H $H
$s = New-Object System.Drawing.Bitmap $tmp
$ink=[System.Drawing.ColorTranslator]::FromHtml($Line)
$on = New-Object 'bool[,]' 360,40
for($j=0;$j -lt 40;$j++){ for($i=0;$i -lt 360;$i++){ $c=$s.GetPixel($i*2,($H-40+$j)*2); $on[$i,$j] = -not (($c.R - $c.G) -gt 40 -and ($c.B - $c.G) -gt 40) } }
$o = New-Object System.Drawing.Bitmap 720,80
for($j=0;$j -lt 40;$j++){ for($i=0;$i -lt 360;$i++){ if(-not $on[$i,$j]){continue}
  $c=$s.GetPixel($i*2,($H-40+$j)*2)
  $edge = ($i -gt 0 -and -not $on[($i-1),$j]) -or ($i -lt 359 -and -not $on[($i+1),$j]) -or ($j -gt 0 -and -not $on[$i,($j-1)])
  if($edge -or (($c.R - $c.G) -gt 12 -and ($c.B - $c.G) -gt 12)){ $c=$ink }
  foreach($dx in 0,1){ foreach($dy in 0,1){ $o.SetPixel($i*2+$dx,$j*2+$dy,$c) } } } }
$o.Save([IO.Path]::GetFullPath($Out)); $s.Dispose(); Remove-Item $tmp
