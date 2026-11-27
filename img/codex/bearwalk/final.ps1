# check each frame of walk B: floating specks (removed) and silhouette pixels without outline (closed); write img/p/bear_walk.png
Add-Type -AssemblyName System.Drawing
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\bear_walkB.png')); $s=New-Object System.Drawing.Bitmap $src; $src.Dispose()
$line=[System.Drawing.ColorTranslator]::FromHtml('#4a150c'); $clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
for($f=0;$f -lt 4;$f++){ $ox=$f*64; $seen=@{}; $sp=0
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if(-not $s.GetPixel($ox+$x,$y).A -or $seen["$x,$y"]){continue}
    $q=New-Object System.Collections.Stack; $q.Push(@($x,$y)); $seen["$x,$y"]=1; $grp=@()
    while($q.Count){ $p=$q.Pop(); $grp+=,$p; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$p[0]+$d[0]; $ny=$p[1]+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $seen["$nx,$ny"] -and $s.GetPixel($ox+$nx,$ny).A){ $seen["$nx,$ny"]=1; $q.Push(@($nx,$ny)) } } }
    if($grp.Count -lt 8){ $sp+=$grp.Count; foreach($p in $grp){ $s.SetPixel($ox+$p[0],$p[1],$clear) } } } }
  $list=@(); for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$s.GetPixel($ox+$x,$y); if(-not $c.A -or ($c.R -le 105 -and $c.G -le 45)){continue}; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $s.GetPixel($ox+$nx,$ny).A){ $list+=,@($x,$y); break } } } }
  foreach($p in $list){ $s.SetPixel($ox+$p[0],$p[1],$line) }
  "frame $($f+1): speck px $sp, outline px $($list.Count)" }
$s.Save([IO.Path]::GetFullPath('img\p\bear_walk.png'))
$o=New-Object System.Drawing.Bitmap 1536,384; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($f=0;$f -lt 4;$f++){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle ($f*384),0,384,384),(New-Object System.Drawing.Rectangle ($f*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\final_view.png'))
