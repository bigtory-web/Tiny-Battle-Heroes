# top row of: left antler, right antler, left shell/tie, right shell/tie, left curl bottom, right curl bottom
param([string]$Name,[int]$Shift=0)
Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\$Name.png"))
function Cream($c){ $c.A -and $c.R -gt 230 -and $c.G -gt 215 -and $c.B -gt 180 -and $c.B -lt 235 }
function Coral($c){ $c.A -and $c.R -gt 215 -and $c.G -gt 70 -and $c.G -lt 175 -and $c.B -lt 160 }
function Blue($c){ $c.A -and $c.B -gt ($c.R+30) }
function Top($f,$xa,$xb,$ya,$yb){ for($y=$ya;$y -le $yb;$y++){ for($x=$xa;$x -le $xb;$x++){ $xx=$x+$Shift; if($xx -ge 0 -and $xx -lt 64 -and (& $f ($im.GetPixel($xx,$y)))){ return $y } } }; return -1 }
function Bot($f,$xa,$xb,$ya,$yb){ for($y=$yb;$y -ge $ya;$y--){ for($x=$xa;$x -le $xb;$x++){ $xx=$x+$Shift; if($xx -ge 0 -and $xx -lt 64 -and (& $f ($im.GetPixel($xx,$y)))){ return $y } } }; return -1 }
"{0}: antler L {1} R {2} | shell L {3} R {4} | curl top L {5} R {6} | curl bottom L {7} R {8}" -f $Name,(Top ${function:Coral} 16 28 18 30),(Top ${function:Coral} 32 46 18 30),(Top ${function:Cream} 16 24 28 40),(Top ${function:Cream} 40 48 28 40),(Top ${function:Blue} 8 18 28 50),(Top ${function:Blue} 46 54 28 50),(Bot ${function:Blue} 8 18 28 52),(Bot ${function:Blue} 44 54 28 52)
