# pixels of the still's face (including the right outline) that differ in each attack frame
Add-Type -AssemblyName System.Drawing
$boxes=@{ flame=@(28,40,35,44); vine=@(27,39,36,44); coral=@(28,39,36,45) }
foreach($id in 'flame','vine','coral'){ $s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$id.png")); $a=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\${id}_anim.png")); $b=$boxes[$id]
  foreach($i in 4..7){ $d=@(); for($y=$b[2];$y -le $b[3];$y++){ for($x=$b[0];$x -le $b[1];$x++){ $p=$s.GetPixel($x,$y); if(-not $p.A){continue}; if($p.ToArgb() -ne $a.GetPixel($i*64+$x,$y).ToArgb()){ $d+="$x,$y" } } }
    "$id frame $($i+1): $($d.Count) differ  $($d -join ' ')" }
  $s.Dispose(); $a.Dispose() }
