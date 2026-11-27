# list small disconnected pixel groups (floating specks) and remove those under 8 pixels
param([string]$Name,[switch]$Fix)
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$Name.png")); $b=New-Object System.Drawing.Bitmap $s; $s.Dispose()
$seen=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if(-not $b.GetPixel($x,$y).A -or $seen["$x,$y"]){continue}
  $q=New-Object System.Collections.Stack; $q.Push(@($x,$y)); $seen["$x,$y"]=1; $grp=@()
  while($q.Count){ $p=$q.Pop(); $grp+=,$p; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$p[0]+$d[0]; $ny=$p[1]+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $seen["$nx,$ny"] -and $b.GetPixel($nx,$ny).A){ $seen["$nx,$ny"]=1; $q.Push(@($nx,$ny)) } } }
  "$Name group size $($grp.Count) at $($grp[0][0]),$($grp[0][1])"
  if($Fix -and $grp.Count -lt 8){ foreach($p in $grp){ $b.SetPixel($p[0],$p[1],[System.Drawing.Color]::FromArgb(0,0,0,0)) } } } }
if($Fix){ $b.Save([IO.Path]::GetFullPath("img\codex\redo3\$Name.png")) }
