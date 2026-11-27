# attack frames: drop floating specks, then close the outline on the arm / fireball area
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'img\codex\redo3\final\flame_anim.png'; $line=[System.Drawing.ColorTranslator]::FromHtml('#500e09'); $clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
foreach($i in 4..7){ $ox=$i*64
  $seen=@{}; foreach($y in 0..63){ foreach($x in 0..63){ if(-not $s.GetPixel($ox+$x,$y).A -or $seen["$x,$y"]){continue}
    $q=New-Object System.Collections.Stack; $q.Push(@($x,$y)); $seen["$x,$y"]=1; $grp=@()
    while($q.Count){ $p=$q.Pop(); $grp+=,$p; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$p[0]+$d[0]; $ny=$p[1]+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $seen["$nx,$ny"] -and $s.GetPixel($ox+$nx,$ny).A){ $seen["$nx,$ny"]=1; $q.Push(@($nx,$ny)) } } }
    if($grp.Count -lt 8){ foreach($p in $grp){ $s.SetPixel($ox+$p[0],$p[1],$clear) }; "frame $($i+1): removed speck $($grp.Count)" } } }
  $n=0; $list=@(); foreach($y in 24..56){ foreach($x in 37..63){ $c=$s.GetPixel($ox+$x,$y); if(-not $c.A){continue}; if($c.R -le 100 -and $c.G -le 40){continue}
      foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($nx -ge 64 -or -not $s.GetPixel($ox+$nx,$ny).A){ $list+=,@($x,$y); break } } } }
  foreach($p in $list){ $s.SetPixel($ox+$p[0],$p[1],$line) }; "frame $($i+1): outlined $($list.Count)" }
$s.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_anim.png'))
$z=New-Object System.Drawing.Bitmap 1600,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($i in 4..7){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle (($i-4)*400),0,390,520),(New-Object System.Drawing.Rectangle ($i*64+30),24,27,36),[System.Drawing.GraphicsUnit]::Pixel) }
$z.Save([IO.Path]::GetFullPath('img\codex\redo3\final\flame_atk_zoom.png'))
