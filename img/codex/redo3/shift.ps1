# place.ps1 counted the weapon tips as feet: put the body back so the face sits where the knight's does
Add-Type -AssemblyName System.Drawing
foreach($p in @(@('vine_new9',8),@('coral_new9',-6))){ $path=[IO.Path]::GetFullPath("img\codex\redo3\$($p[0]).png"); $src=New-Object System.Drawing.Bitmap $path; $o=New-Object System.Drawing.Bitmap 64,64
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel($x,$y); if($c.A){ $o.SetPixel($x+[int]$p[1],$y,$c) } } }
  $src.Dispose(); $o.Save($path) }
