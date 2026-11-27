# the fix round drifted brighter: snap its colors to the previous draft's palette
Add-Type -AssemblyName System.Drawing
foreach($n in 'vine','coral'){
  $ref=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${n}_new3.png")); $pal=@{}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$ref.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
  $src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${n}_new5.png")); $o=New-Object System.Drawing.Bitmap 64,64; $cache=@{}
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$src.GetPixel($x,$y); if(-not $c.A){continue}; $k=$c.ToArgb()
      if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*[math]::Pow($c.R-$p.R,2)+4*[math]::Pow($c.G-$p.G,2)+3*[math]::Pow($c.B-$p.B,2); if($d -lt $best){$best=$d;$cache[$k]=$p} } }
      $o.SetPixel($x,$y,$cache[$k]) } }
  $o.Save([IO.Path]::GetFullPath("img\codex\redo3\${n}_new6.png")) }
Copy-Item img\codex\redo3\flame_new3.png img\codex\redo3\flame_new6.png -Force
