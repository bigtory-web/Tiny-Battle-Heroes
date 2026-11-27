# the face template's reddish outline -> each version's own outline colour
Add-Type -AssemblyName System.Drawing
foreach($p in @(@('sprout_A','#3e2014'),@('sprout_B','#3a190b'))){ $s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\bloom\$($p[0]).png")); $b=New-Object System.Drawing.Bitmap $s; $s.Dispose(); $n=0
  $col=[System.Drawing.ColorTranslator]::FromHtml($p[1])
  for($y=34;$y -le 46;$y++){ for($x=26;$x -le 46;$x++){ $c=$b.GetPixel($x,$y); if($c.A -and $c.R -ge 65 -and $c.R -le 95 -and $c.G -lt 22 -and $c.B -lt 16){ $b.SetPixel($x,$y,$col); $n++ } } }
  "$($p[0]): $n outline pixels recoloured"; $b.Save([IO.Path]::GetFullPath("img\codex\bloom\$($p[0]).png")) }
