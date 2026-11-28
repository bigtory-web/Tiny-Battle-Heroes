# magenta fringe snapped to horn purple -> outline (edge pixels, and anything below the horns)
$ink=[System.Drawing.ColorTranslator]::FromHtml('#461205'); $fix=@()
for($y=1;$y -lt 63;$y++){ for($x=257;$x -lt 511;$x++){ $c=$sheet.GetPixel($x,$y); if($c.A -and $c.B -gt 0.55*$c.R -and $c.R -gt 80 -and $c.G -lt 60){
  $edge= -not ($sheet.GetPixel($x-1,$y).A -and $sheet.GetPixel($x+1,$y).A -and $sheet.GetPixel($x,$y-1).A -and $sheet.GetPixel($x,$y+1).A)
  if($edge -or $y -ge 36){ $fix+=,@($x,$y) } } } }
foreach($q in $fix){ $sheet.SetPixel($q[0],$q[1],$ink) }; "fringe $($fix.Count)"
