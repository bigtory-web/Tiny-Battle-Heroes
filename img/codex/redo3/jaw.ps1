# for each eye column: eye rows, and how many skin pixels lie below it before the jaw line
Add-Type -AssemblyName System.Drawing
function IsSkin($c){ $c.A -and $c.R -gt 235 -and $c.G -gt 185 -and $c.B -gt 135 -and $c.B -lt 200 }
function IsEye($c){ $c.A -and (($c.R -gt 225 -and $c.G -gt 215 -and $c.B -gt 205) -or ($c.R -gt 100 -and $c.G -gt 50 -and $c.G -lt 170 -and $c.B -lt 45) -or ($c.R -lt 110 -and $c.G -lt 50)) }
$sets=@{ 'flame_new12'=@(@(31,32,33,41),@(37,38,39,40)); 'vine_new12'=@(@(29,30,31,41),@(36,37,38,40)); 'coral_new12'=@(@(30,31,32,42),@(36,37,38,41)) }
foreach($n in 'flame_new12','vine_new12','coral_new12'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$n.png")); $out=@()
  foreach($eye in $sets[$n]){ $bot=$eye[3]; $cnt=@(); foreach($x in $eye[0..2]){ $k=0; $y=$bot+1; while(IsSkin ($im.GetPixel($x,$y))){$k++;$y++}; $cnt+=$k }
    $rows=0; for($y=$bot;$y -gt $bot-3;$y--){ if(IsEye ($im.GetPixel($eye[1],$y))){$rows++} }
    $out+="rows $($bot-2)-$bot ($rows), skin below $($cnt -join '/')" }
  "{0}: left [{1}]  right [{2}]" -f $n,$out[0],$out[1]; $im.Dispose() }
