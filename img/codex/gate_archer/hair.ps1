# teal placeholder hair -> target colors by brightness
Add-Type -AssemblyName System.Drawing
$d='img/codex/gate_archer'
$ramps=@{ silver=@('8e86a0','c9c2d4','f4f0f6'); navy=@('232448','34396c','4c569a'); blonde=@('b8863c','dcb260','f4d88c'); red=@('8a0c1c','c81424','ee3a38') }
$src=[Drawing.Bitmap]::new((Resolve-Path "$d/f_brave.png").Path)
# dark greenish outline -> game's dark brown; stray hot-pink cells -> horn purple
for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$src.GetPixel($x,$y); if(!$c.A){continue}; if($c.R -lt 90 -and $c.G -ge 0.6*$c.R -and $c.G -le 60 -and $c.B -lt $c.G){$src.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#461205'))}elseif($x -le 21 -and $y -ge 36 -and $y -le 41 -and $c.R -gt 150 -and $c.B -gt 120 -and $c.G -lt 90){ $src.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#6e1260'))}}}
$src.Save((Join-Path (Get-Location) "$d/f_teal.png"))
$hair=@(); for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$src.GetPixel($x,$y); if($c.A -and $c.G -gt $c.R+25 -and $c.G -gt 55){$hair+=,@($x,$y,[int]$c.G)}}}
$min=($hair|%{$_[2]}|measure -Min).Minimum; $max=($hair|%{$_[2]}|measure -Max).Maximum
foreach($k in $ramps.Keys){ $o=[Drawing.Bitmap]::new($src)
 foreach($p in $hair){ $t=($p[2]-$min)/($max-$min); $i=if($t -lt 0.4){0}elseif($t -lt 0.75){1}else{2}; $o.SetPixel($p[0],$p[1],[Drawing.ColorTranslator]::FromHtml('#'+$ramps[$k][$i])) }
 $o.Save((Join-Path (Get-Location) "$d/f_$k.png")) }
"hair pixels $($hair.Count) G $min..$max"
$s=[Drawing.Bitmap]::new(1500,480); $g=[Drawing.Graphics]::FromImage($s); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('before (E)',"$d/e_brave.png"),@('1 silver',"$d/f_silver.png"),@('2 navy',"$d/f_navy.png"),@('3 blonde',"$d/f_blonde.png"),@('4 teal',"$d/f_teal.png"))){
 $b=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $g.DrawImage($b,[Drawing.Rectangle]::new($i*300,40,300,300),7,14,50,50,'Pixel'); $g.DrawImage($b,$i*300+120,380,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*300+10,8); $i++ }
$s.Save((Join-Path (Get-Location) "$d/compare3.png"))
