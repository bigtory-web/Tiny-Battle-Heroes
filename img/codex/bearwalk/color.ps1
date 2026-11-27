# snap colours to the current Roxy palette; compare: current / 18px grid / 19.6px grid
param([string]$A='walk1_new.png',[string]$B='walk1_b.png')
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$ref=Load 'bear64.png'; $pal=@{}; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$ref.GetPixel($x,$y); if($c.A){$pal[$c.ToArgb()]=$c} } }
$cache=@{}
$o=New-Object System.Drawing.Bitmap 1170,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($ref,0,10,384,384); $i=1
foreach($f in $A,$B){ $im=Load $f; for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$im.GetPixel($x,$y); if(-not $c.A){continue}; $k=$c.ToArgb(); if(-not $cache.ContainsKey($k)){ $best=1e9; foreach($p in $pal.Values){ $d=2*($c.R-$p.R)*($c.R-$p.R)+4*($c.G-$p.G)*($c.G-$p.G)+3*($c.B-$p.B)*($c.B-$p.B); if($d -lt $best){$best=$d;$cache[$k]=$p} } }; $im.SetPixel($x,$y,$cache[$k]) } }
  $im.Save([IO.Path]::GetFullPath(($f -replace '\.png$','_c.png'))); $g.DrawImage($im,($i*390),10,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('cmp2.png'))
