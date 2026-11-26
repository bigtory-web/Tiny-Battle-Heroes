param([string]$F)
Add-Type -AssemblyName System.Drawing
$p=[IO.Path]::GetFullPath($F); $src=New-Object System.Drawing.Bitmap $p; $b=New-Object System.Drawing.Bitmap $src; $src.Dispose()
$seen=@{}; $q=New-Object System.Collections.Queue
for($i=0;$i -lt 24;$i++){ foreach($pt in @(@($i,0),@($i,23),@(0,$i),@(23,$i))){ $q.Enqueue($pt) } }
while($q.Count){ $x,$y=$q.Dequeue(); if($x -lt 0 -or $y -lt 0 -or $x -gt 23 -or $y -gt 23 -or $seen["$x,$y"] -or $b.GetPixel($x,$y).A){continue}; $seen["$x,$y"]=1
  foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $q.Enqueue(@(($x+$d[0]),($y+$d[1]))) } }
$n=0; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if(-not $b.GetPixel($x,$y).A -and -not $seen["$x,$y"]){ $b.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(46,12,6)); $n++ } } }
$b.Save($p); "filled $n"
