# Ivy: same spiral whip, 3 px closer to the body, with only a stub of handle in the hand.  Built from vine_new12 so the face stays.
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('vine_new12.png')); $b=New-Object System.Drawing.Bitmap $src
$clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
# erase the old coil, tail, thorns and long handle (everything right of the hand)
foreach($y in 42..63){ foreach($x in 39..63){ $c=$b.GetPixel($x,$y); if(-not $c.A){continue}
    $hand = ($x -le 40 -and $y -ge 48 -and $y -le 52 -and $c.R -ge $c.G); $body = ($x -le 39 -and $y -le 47) -or ($x -le 39 -and $y -ge 53)
    if(-not ($hand -or $body)){ $b.SetPixel($x,$y,$clear) } } }
$cx=47.0; $cy=53.0; $R=7.6; $pitch=3.3; $start=-2.5
$dk=C '#450b01'; $g0=C '#b5b61c'; $g1=C '#868a14'; $g2=C '#d6d850'; $disk=@{}
foreach($y in 43..63){ foreach($x in 37..60){ $dx=$x-$cx; $dy=$y-$cy; $d=[math]::Sqrt($dx*$dx+$dy*$dy); if($d -gt $R+0.9){continue}
    $t=([math]::Atan2($dy,$dx)-$start)/(2*[math]::PI); $t-=[math]::Floor($t); if($d -gt $R-$pitch*$t+0.75){continue}
    if($x -le 40 -and $y -ge 48 -and $y -le 52){continue}   # the hand stays on top
    $rope=$false; foreach($k in 0,1,2){ $rk=$R-$pitch*($t+$k); if($rk -ge -0.2 -and $d -le $rk+0.55 -and $d -gt $rk-1.55){$rope=$true} }
    $col= if($rope){ if($dx+$dy -gt 4){$g1} elseif($dx+$dy -lt -5){$g2} else {$g0} } else {$dk}
    $b.SetPixel($x,$y,$col); $disk["$x,$y"]=1 } }
foreach($p in @(@(54,58),@(55,58),@(55,59),@(56,59),@(56,60),@(57,60))){ $q=@(($p[0]-3),$p[1]); $b.SetPixel($q[0],$q[1],$g1); $disk["$($q[0]),$($q[1])"]=1 }
foreach($p in @(@(56,61),@(57,61),@(58,61),@(57,62),@(58,62))){ $x=$p[0]-3; $b.SetPixel($x,$p[1],(C '#f25844')); $disk["$x,$($p[1])"]=1 }
foreach($p in @(@(48,44),@(56,52))){ $b.SetPixel($p[0],$p[1],(C '#f4e6c0')); $disk["$($p[0]),$($p[1])"]=1 }
# short handle: from the hand up into the start of the coil
foreach($p in @(@(41,49,'#8a3c10'),@(42,48,'#6b2a0a'))){ $b.SetPixel($p[0],$p[1],(C $p[2])); $disk["$($p[0]),$($p[1])"]=1 }
foreach($key in @($disk.Keys)){ $x,$y=[int[]]($key -split ','); foreach($ex in -1,0,1){ foreach($ey in -1,0,1){ $nx=$x+$ex; $ny=$y+$ey; if($nx -ge 0 -and $ny -ge 0 -and $nx -lt 64 -and $ny -lt 64 -and -not $disk.ContainsKey("$nx,$ny") -and -not $b.GetPixel($nx,$ny).A){ $b.SetPixel($nx,$ny,$dk) } } } }
$b.Save([IO.Path]::GetFullPath('vine_new17.png'))
# the erase also took the hair outline beside the head: put it back
foreach($y in 36..44){ foreach($x in 39..43){ $c=$src.GetPixel($x,$y); if($c.A -and -not $b.GetPixel($x,$y).A -and ($y -le 43)){ $b.SetPixel($x,$y,$c) } } }
$b.Save([IO.Path]::GetFullPath('vine_new17.png'))
