# per attack frame: remove floating specks (<8 px), count silhouette pixels that are not outline and close them
param([string]$Id)
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load "img\codex\bloom\final\${Id}_anim.png"; $still=Load "img\codex\bloom\final\$Id.png"; $clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
$cnt=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$still.GetPixel($x,$y); if($c.A -and $c.R -lt 100 -and $c.G -lt 40){ $cnt[$c.ToArgb()]++ } } }
$line=[System.Drawing.Color]::FromArgb([int]($cnt.GetEnumerator()|Sort-Object Value -Descending|Select-Object -First 1).Key)
foreach($i in 4..7){ $ox=$i*64; $seen=@{}; $sp=0
  foreach($y in 0..63){ foreach($x in 0..63){ if(-not $s.GetPixel($ox+$x,$y).A -or $seen["$x,$y"]){continue}
    $q=New-Object System.Collections.Stack; $q.Push(@($x,$y)); $seen["$x,$y"]=1; $grp=@()
    while($q.Count){ $p=$q.Pop(); $grp+=,$p; foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$p[0]+$d[0]; $ny=$p[1]+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $seen["$nx,$ny"] -and $s.GetPixel($ox+$nx,$ny).A){ $seen["$nx,$ny"]=1; $q.Push(@($nx,$ny)) } } }
    if($grp.Count -lt 8){ $sp+=$grp.Count; foreach($p in $grp){ $s.SetPixel($ox+$p[0],$p[1],$clear) } } } }
  $list=@(); foreach($y in 0..63){ foreach($x in 0..63){ $c=$s.GetPixel($ox+$x,$y); if(-not $c.A -or ($c.R -le 100 -and $c.G -le 40)){continue}
      $edge=($y -eq 63 -or $x -eq 63)
      foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $nx=$x+$d[0]; $ny=$y+$d[1]; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $s.GetPixel($ox+$nx,$ny).A){ $edge=$true } }
      if($edge){ $list+=,@($x,$y) } } }
  foreach($p in $list){ $s.SetPixel($ox+$p[0],$p[1],$line) }
  "frame $($i+1): speck px $sp, outline px $($list.Count)" }
$s.Save([IO.Path]::GetFullPath("img\codex\bloom\final\${Id}_anim.png"))
$pv=New-Object System.Drawing.Bitmap 1536,768; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt 8;$i++){ $g.DrawImage($s,(New-Object System.Drawing.Rectangle (($i%4)*384),([math]::Floor($i/4)*384),384,384),(New-Object System.Drawing.Rectangle ($i*64),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$pv.Save([IO.Path]::GetFullPath("img\codex\bloom\final\${Id}_anim_view.png"))
