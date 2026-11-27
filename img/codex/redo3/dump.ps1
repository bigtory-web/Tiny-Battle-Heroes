# print the face region as letters so single pixels can be edited
param([string]$Suffix='new2',[string[]]$Ids=@('flame','vine','coral'))
Add-Type -AssemblyName System.Drawing
foreach($id in $Ids){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${id}_$Suffix.png"))
  $sx=0;$sy=0;$k=0; for($y=25;$y -lt 48;$y++){ for($x=0;$x -lt 64;$x++){ $c=$im.GetPixel($x,$y); if($c.A -and $c.R -gt 235 -and $c.G -gt 190 -and $c.G -lt 230 -and $c.B -gt 140 -and $c.B -lt 190){$sx+=$x;$sy+=$y;$k++} } }
  $cx=[int]($sx/$k); $cy=[int]($sy/$k); "== $id  x from $($cx-10)"
  for($y=$cy-8;$y -le $cy+6;$y++){ $line=''; for($x=$cx-10;$x -le $cx+10;$x++){ $c=$im.GetPixel($x,$y)
      $L= if(-not $c.A){'.'} elseif($c.R -gt 230 -and $c.G -gt 230){'W'} elseif($c.R -gt 230 -and $c.G -gt 185 -and $c.B -gt 135){'s'} elseif($c.R -lt 95 -and $c.G -lt 40){'#'} elseif($c.R -gt 150 -and $c.G -gt 90 -and $c.G -lt 160 -and $c.B -lt 40){'a'} elseif($c.R -ge 95 -and $c.G -lt 90 -and $c.B -lt 25){'b'} else {'+'}
      $line+=$L }; "{0,2} {1}" -f $y,$line }
  $im.Dispose() }
