# knight-shaped 3-point eyes for drafts E and F: viewer-left eye one point lower; stray magenta pixels removed
Add-Type -AssemblyName System.Drawing
function Hx($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$ink=Hx '#461912'; $white=Hx '#fdf8ef'; $iris=(Hx '#4e1502'),(Hx '#aa5d02'),(Hx '#e49d07')
foreach($n in 'tora_e','tora_f'){
  $p=[IO.Path]::GetFullPath("img\pixellab\redo\${n}_64.png"); $s=New-Object System.Drawing.Bitmap $p; $o=New-Object System.Drawing.Bitmap $s; $s.Dispose()
  $skin=Hx '#fad4ac'
  if($n -eq 'tora_f'){ for($y=36;$y -lt 48;$y++){ for($x=26;$x -lt 46;$x++){ $c=$o.GetPixel($x,$y); if($c.A -and $c.R -eq 0xed -and $c.G -eq 0xd5 -and $c.B -eq 0xb0){ $o.SetPixel($x,$y,$skin) } } } }
  foreach($y in 40..42){ foreach($x in 29..34){ $c=$o.GetPixel($x,$y); if($x -ge 30 -and $x -le 33){ $o.SetPixel($x,$y,$skin) } } }
  foreach($y in 39..41){ foreach($x in 37..40){ $o.SetPixel($x,$y,$skin) } }
  foreach($x in 31..33){ $o.SetPixel($x,39,$ink) }
  foreach($x in 38..40){ $o.SetPixel($x,38,$ink) }
  for($k=0;$k -lt 3;$k++){ $o.SetPixel(31,(40+$k),$white); $o.SetPixel(32,(40+$k),$iris[$k]); $o.SetPixel(33,(40+$k),$iris[$k])
    $o.SetPixel(38,(39+$k),$iris[$k]); $o.SetPixel(39,(39+$k),$iris[$k]); $o.SetPixel(40,(39+$k),$white) }
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$o.GetPixel($x,$y); if($c.A -and $c.G -lt 40 -and $c.B -gt 90 -and $c.R -gt 90){ $o.SetPixel($x,$y,$ink) } } }
  $o.Save($p) }
