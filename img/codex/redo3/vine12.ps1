# Ivy: eyes and brows 1 px up + Blaze-like jaw (right 1-2-3 skin under the eye, left 2 then the line); whip as an "@" spiral
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\vine_new11.png')); $b=New-Object System.Drawing.Bitmap $src
$skin=$src.GetPixel(33,41); $line=$src.GetPixel(30,44)
# face: copy eye + brow up one row, fill the vacated rows with skin
foreach($x in 36..38){ foreach($y in 37..40){ $b.SetPixel($x,$y,$src.GetPixel($x,$y+1)) }; $b.SetPixel($x,41,$skin) }
foreach($x in 29..31){ foreach($y in 38..41){ $b.SetPixel($x,$y,$src.GetPixel($x,$y+1)) }; $b.SetPixel($x,42,$skin) }
$b.SetPixel(32,38,$src.GetPixel(32,39)); $b.SetPixel(32,39,$skin)
$b.SetPixel(36,43,$skin); $b.SetPixel(29,43,$skin)
# whip: erase the old coil (keep hand and handle)
foreach($y in 43..63){ foreach($x in 41..63){ $c=$b.GetPixel($x,$y); if(-not $c.A){continue}
    $handle = ($y -le 49 -and $x -le 45 -and $c.R -gt 60 -and $c.G -lt 75 -and $c.B -lt 40)
    $hand = ($x -le 42 -and $y -ge 48 -and $y -le 52 -and $c.R -ge $c.G)
    if(-not ($handle -or $hand)){ $b.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(0,0,0,0)) } } }
foreach($y in 48..58){ foreach($x in 39..42){ $c=$b.GetPixel($x,$y); if($c.A -and $c.G -ge $c.R){ $b.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(0,0,0,0)) } } }   # left-over green bits
$cx=50.0; $cy=53.0; $R=7.6; $pitch=3.3; $start=-2.5   # start angle: upper left, where the handle meets
$dk=C '#450b01'; $g0=C '#b5b61c'; $g1=C '#868a14'; $g2=C '#d6d850'
$disk=@{}
foreach($y in 43..63){ foreach($x in 40..60){ $dx=$x-$cx; $dy=$y-$cy; $d=[math]::Sqrt($dx*$dx+$dy*$dy); if($d -gt $R+0.9){continue}
    $t=([math]::Atan2($dy,$dx)-$start)/(2*[math]::PI); $t-=[math]::Floor($t)
    if($d -gt $R-$pitch*$t+0.75){continue}   # outside the outermost turn at this angle = not part of the coil
    $rope=$false; foreach($k in 0,1,2){ $rk=$R-$pitch*($t+$k); if($rk -ge -0.2 -and $d -le $rk+0.55 -and $d -gt $rk-1.55){$rope=$true} }
    $col= if($rope){ if($dx+$dy -gt 4){$g1} elseif($dx+$dy -lt -5){$g2} else {$g0} } else {$dk}
    $b.SetPixel($x,$y,$col); $disk["$x,$y"]=1 } }
# "@" tail: out of the lower right, ending in the red bud
foreach($p in @(@(54,58),@(55,58),@(55,59),@(56,59),@(56,60),@(57,60))){ $b.SetPixel($p[0],$p[1],$g1); $disk["$($p[0]),$($p[1])"]=1 }
foreach($p in @(@(56,61),@(57,61),@(58,61),@(57,62),@(58,62))){ $b.SetPixel($p[0],$p[1],(C '#f25844')); $disk["$($p[0]),$($p[1])"]=1 }
# thorns
foreach($p in @(@(51,44),@(59,52))){ $b.SetPixel($p[0],$p[1],(C '#f4e6c0')); $disk["$($p[0]),$($p[1])"]=1 }
# dark outline around everything new
foreach($key in @($disk.Keys)){ $x,$y=[int[]]($key -split ','); foreach($ex in -1,0,1){ foreach($ey in -1,0,1){ $nx=$x+$ex; $ny=$y+$ey; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $disk.ContainsKey("$nx,$ny") -and -not $b.GetPixel($nx,$ny).A){ $b.SetPixel($nx,$ny,$dk) } } } }
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_new12.png'))
# stray dark-olive dots left beside the hand
foreach($y in 49..59){ foreach($x in 39..43){ $c=$b.GetPixel($x,$y); if($c.A -and $c.R -lt 70 -and $c.G -ge 30 -and $c.B -lt 20){ $b.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(0,0,0,0)) } } }
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\vine_new12.png'))
