# how far the face sits in front of the feet: face-skin centre x minus feet centre x (sprite pixels)
Add-Type -AssemblyName System.Drawing
foreach($f in 'img\p\knight.png','img\p\vine.png','img\codex\redo3\vine_new6.png','img\codex\redo3\vine_new9.png','img\codex\redo3\flame_new9.png','img\codex\redo3\coral_new9.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $h=$im.Height
  $a=999;$b=0; for($y=$h-3;$y -lt $h;$y++){ for($x=0;$x -lt $im.Width;$x++){ if($im.GetPixel($x,$y).A){ if($x -lt $a){$a=$x}; if($x -gt $b){$b=$x} } } }
  $s=0;$k=0; for($y=[int]($h*0.45);$y -lt [int]($h*0.72);$y++){ for($x=0;$x -lt $im.Width;$x++){ $c=$im.GetPixel($x,$y); if($c.A -and $c.R -gt 235 -and $c.G -gt 190 -and $c.G -lt 230 -and $c.B -gt 140 -and $c.B -lt 190){$s+=$x;$k++} } }
  "{0}: face {1:n1} feet {2:n1} forward {3:n1}" -f $f,($s/$k),(($a+$b)/2),($s/$k-($a+$b)/2); $im.Dispose() }
