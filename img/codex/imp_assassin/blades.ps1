# teal placeholder blades -> three palettes (dark spine, body, edge)
Add-Type -AssemblyName System.Drawing
$d='img/codex/imp_assassin'
$ramps=[ordered]@{ steel=@('6b7390','b9c3d8','f4f8ff'); ember=@('d2420c','ff8a14','ffe36a'); violet=@('2c1c3c','5a3478','d06cf0') }
$src=[Drawing.Bitmap]::new((Resolve-Path "$d/c.png").Path)
$px=@(); for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$src.GetPixel($x,$y); if($c.A -and $c.G -gt $c.R+25 -and $c.G -gt 55){$px+=,@($x,$y,[int]$c.G)}}}
$min=($px|%{$_[2]}|measure -Min).Minimum; $max=($px|%{$_[2]}|measure -Max).Maximum
foreach($k in $ramps.Keys){ $o=[Drawing.Bitmap]::new($src)
 foreach($p in $px){ $t=($p[2]-$min)/($max-$min); $i=if($t -lt 0.35){0}elseif($t -lt 0.7){1}else{2}; $o.SetPixel($p[0],$p[1],[Drawing.ColorTranslator]::FromHtml('#'+$ramps[$k][$i])) }
 # greenish dark outline -> game's dark brown
 for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$o.GetPixel($x,$y); if($c.A -and $c.R -lt 90 -and $c.G -ge 0.6*$c.R -and $c.G -le 60 -and $c.B -lt $c.G){$o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#461205'))}}}
 $o.Save((Join-Path (Get-Location) "$d/c_$k.png")) }
"blade pixels $($px.Count)"
$s=[Drawing.Bitmap]::new(1600,500); $g=[Drawing.Graphics]::FromImage($s); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('B before','b2'),@('1 steel','c_steel'),@('2 ember','c_ember'),@('3 violet (ref)','c_violet'))){ $b=[Drawing.Bitmap]::new((Resolve-Path "$d/$($it[1]).png").Path)
 $g.DrawImage($b,$i*400+8,30,384,384); $g.DrawImage($b,$i*400+170,420,64,64); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*400+10,8); $i++ }
$s.Save((Join-Path (Get-Location) "$d/compare_c.png"))
