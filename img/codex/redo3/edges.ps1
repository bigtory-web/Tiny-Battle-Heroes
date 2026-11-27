# silhouette pixels (touching transparency) that are not the dark brown outline
param([string]$Names='coral_new8,flame_new8,vine_new8')
Add-Type -AssemblyName System.Drawing
foreach($n in $Names -split ','){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$n.png")); $list=@(); $dark=@{}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$im.GetPixel($x,$y); if($c.A -lt 128){continue}
      $edge=$false; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $a=$x+$d[0]; $b=$y+$d[1]; if($a -lt 0 -or $b -lt 0 -or $a -ge 64 -or $b -ge 64 -or $im.GetPixel($a,$b).A -lt 128){$edge=$true} }
      if($edge){ if($c.R -gt 100 -or $c.G -gt 40 -or $c.B -gt 30){ $list+="($x,$y #{0:x2}{1:x2}{2:x2})" -f $c.R,$c.G,$c.B } else { $k='#{0:x2}{1:x2}{2:x2}' -f $c.R,$c.G,$c.B; $dark[$k]++ } } } }
  "$n : not-outline edge $($list.Count) $($list -join ' ')"; "  main outline " + (($dark.GetEnumerator()|Sort-Object Value -Descending|Select-Object -First 2|ForEach-Object{"$($_.Key) x$($_.Value)"}) -join ', '); $im.Dispose() }
