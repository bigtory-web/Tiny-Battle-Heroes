# Cora: right-side hair 4 px wide for volume, two-tone antlers (light from upper left), jaw like Blaze
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\coral_new11.png')); $b=New-Object System.Drawing.Bitmap $src
$light=$src.GetPixel(36,32); $blue=$src.GetPixel(37,33); $line=$src.GetPixel(39,42); $skin=$src.GetPixel(33,43)
if($blue.B -lt 150 -or $blue.R -gt 100 -or $line.R -gt 110){ throw "bad sample colours $blue $line" }
function IsLine($c){ $c.A -and $c.R -lt 110 -and $c.G -lt 50 }
# right edge of the hair per row
$edge=@{31=41;32=42;33=43;34=43;35=43;36=43;37=43;38=43;39=43;40=43;41=43;42=42}
foreach($y in 31..42){ $xr=$edge[$y]
  # start just outside the head / face line of the old picture
  $from=40; if($y -le 32){$from=39}
  for($x=$from;$x -le $xr;$x++){ $b.SetPixel($x,$y,$(if($x -eq $xr -or ($x -eq $xr-2 -and $y -ge 37 -and $y -le 40)){$blue}else{$light})) }
  $b.SetPixel($xr+1,$y,$line) }
foreach($x in 40..42){ $c=$b.GetPixel($x,43); if(-not $c.A -or (IsLine $c)){ $b.SetPixel($x,43,$line) } }
foreach($x in 36..38){ $b.SetPixel($x,29,$line) }; foreach($x in 37..39){ $b.SetPixel($x,30,$light) }; $b.SetPixel(40,30,$line); $b.SetPixel(41,30,[System.Drawing.Color]::FromArgb(0,0,0,0)); foreach($x in 38..40){ $b.SetPixel($x,31,$light) }; $b.SetPixel(41,31,$blue); $b.SetPixel(42,31,$line)
# jaw
$b.SetPixel(30,44,$skin); $b.SetPixel(36,44,$skin)
# antlers: shadow on the sides away from the light
$shade=C '#d4565a'
$snap=New-Object System.Drawing.Bitmap $b
function IsPink($c){ $c.A -and $c.R -gt 220 -and $c.G -gt 110 -and $c.G -lt 175 -and $c.B -gt 95 -and $c.B -lt 160 }
$n=0;$s=0
foreach($y in 18..31){ foreach($x in 20..44){ $c=$snap.GetPixel($x,$y); if(-not (IsPink $c)){continue}; $n++
    if(IsLine ($snap.GetPixel($x+1,$y))){ $b.SetPixel($x,$y,$shade); $s++ } } }
"antler pixels $n, shaded $s"
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\coral_new12.png'))
Copy-Item img\codex\redo3\flame_new11.png img\codex\redo3\flame_new12.png -Force
