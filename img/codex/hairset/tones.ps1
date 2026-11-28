# same hair shape, 3 / 4 / 5 gradient tones. Light from the upper left: mix of the original shading and position.
Add-Type -AssemblyName System.Drawing
$d='img/codex/hairset'
$ramps=@{ 3=@('6e240a','a4471a','dc8034'); 4=@('621e08','8c3410','bc5a20','e68e3a'); 5=@('581a08','7a2a0c','a24418','c86a2a','eea246') }
$share=@{ 3=@(0.30,0.45,0.25); 4=@(0.22,0.31,0.29,0.18); 5=@(0.16,0.23,0.26,0.22,0.13) }
$eye='782e07','d67d0e','873706','c2670c'
$out=@{}
foreach($k in 2,6){
 $s=[Drawing.Bitmap]::new((Resolve-Path "$d/h${k}_f.png").Path)
 $px=@(); for($y=0;$y -lt 58;$y++){for($x=0;$x -lt 64;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.R -ge 88 -and $c.G -lt 155 -and $c.B -lt 80 -and ($c.R-$c.B) -gt 55){
   $hex='{0:x2}{1:x2}{2:x2}' -f $c.R,$c.G,$c.B
   if($eye -contains $hex){continue}
   if($c.G -gt 120 -and $c.B -lt 40){continue}
   $lum=0.5*$c.R+0.5*$c.G; $px+=,@($x,$y,($lum - 1.3*($y-30) - 0.7*($x-30))) }}}
 $sorted=@($px | Sort-Object { $_[2] })
 foreach($n in 3,4,5){ $o=[Drawing.Bitmap]::new($s); $i=0
  for($t=0;$t -lt $n;$t++){ $end= if($t -eq $n-1){$sorted.Count}else{ $i+[int]($share[$n][$t]*$sorted.Count) }
   $col=[Drawing.ColorTranslator]::FromHtml('#'+$ramps[$n][$t]); for(;$i -lt $end -and $i -lt $sorted.Count;$i++){ $o.SetPixel($sorted[$i][0],$sorted[$i][1],$col) } }
  $o.Save((Join-Path (Get-Location) "$d/t${k}_$n.png")) }
 "style $k hair pixels $($px.Count)" }
$sh=[Drawing.Bitmap]::new(1200,860); $g=[Drawing.Graphics]::FromImage($sh); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $row=0
foreach($k in 2,6){ $col=0; foreach($n in 3,4,5){ $b=[Drawing.Bitmap]::new((Resolve-Path "$d/t${k}_$n.png").Path)
  $g.DrawImage($b,[Drawing.Rectangle]::new($col*400+40,$row*430+30,320,320),16,24,32,32,'Pixel'); $g.DrawImage($b,$col*400+170,$row*430+350,64,64); $g.DrawString("style $k - $n colors",$f,[Drawing.Brushes]::White,$col*400+10,$row*430+6); $col++ }; $row++ }
$sh.Save((Join-Path (Get-Location) "$d/tones.png"))
