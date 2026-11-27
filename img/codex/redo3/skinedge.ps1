# hair-coloured pixels that touch face skin (should be the brown line), for flame and vine
Add-Type -AssemblyName System.Drawing
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 200 }
foreach($n in 'flame_new9','vine_new9'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$n.png")); $list=@()
  for($y=22;$y -lt 46;$y++){ for($x=1;$x -lt 63;$x++){ $c=$im.GetPixel($x,$y); if(-not $c.A){continue}
      # hair = saturated orange/brown that is not the dark line, skin, white or amber iris
      if(-not ($c.R -ge 115 -and $c.G -lt 120 -and $c.B -lt 60)){continue}
      foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(IsSkin ($im.GetPixel($x+$d[0],$y+$d[1]))){ $list+=("({0},{1} #{2:x2}{3:x2}{4:x2})" -f $x,$y,$c.R,$c.G,$c.B); break } } } }
  "$n : $($list.Count)  $($list -join ' ')"; $im.Dispose() }
