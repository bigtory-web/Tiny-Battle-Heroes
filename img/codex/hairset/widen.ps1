# style 2: widen only the right-side lock by moving its outer part out and repeating the inner column
Add-Type -AssemblyName System.Drawing
$d='img/codex/hairset'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/h2_f.png").Path); $o=[Drawing.Bitmap]::new($s)
function Skin($c){ $c.R -gt 230 -and $c.G -gt 170 }
for($y=28;$y -le 47;$y++){
  $n= if($y -lt 32){1}elseif($y -lt 35){2}else{3}
  if($y -ge 45){$n=2}
  # last opaque pixel of the head/lock run that starts at x=39
  $end=39; while($end -lt 62 -and $s.GetPixel($end+1,$y).A){$end++}
  if(-not $s.GetPixel(39,$y).A){continue}
  if($y -ge 45 -and $end -gt 44){ continue }   # hand and staff side: leave
  $cut=[math]::Min(40,$end-1)
  for($x=$end;$x -gt $cut;$x--){ $o.SetPixel($x+$n,$y,$s.GetPixel($x,$y)) }
  for($i=1;$i -le $n;$i++){ $c=$s.GetPixel($cut,$y); if(Skin $c){$c=$s.GetPixel($cut+1,$y)}; $o.SetPixel($cut+$i,$y,$c) } }
# keep the outline closed
$ink=[Drawing.ColorTranslator]::FromHtml('#461205'); $add=@()
for($y=27;$y -le 48;$y++){for($x=38;$x -le 48;$x++){ if(-not $o.GetPixel($x,$y).A){ foreach($p in @(@(-1,0),@(0,-1),@(0,1))){ $c=$o.GetPixel($x+$p[0],$y+$p[1]); if($c.A -and $c.R -gt 100){ $add+=,@($x,$y); break } } } }}
foreach($p in $add){ $o.SetPixel($p[0],$p[1],$ink) }
$o.Save((Join-Path (Get-Location) "$d/h2b_f.png"))
