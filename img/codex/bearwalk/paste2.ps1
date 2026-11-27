# paste the current face (eyes, skin, jaw) onto the walk frame, aligned by the best match of the eye pixels
param([string]$Frame='walk2_b_c.png',[string]$Out='walk2.png')
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$s=Load 'bear64.png'; $f=Load $Frame
$eye=@(); for($y=37;$y -le 41;$y++){ for($x=28;$x -le 41;$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $eye+=,@($x,$y,$c) } } }
$best=1e18; for($dx=-6;$dx -le 8;$dx++){ for($dy=-4;$dy -le 4;$dy++){ $d=0.0; foreach($p in $eye){ $c=$f.GetPixel($p[0]+$dx,$p[1]+$dy); if(-not $c.A){$d+=600}else{$d+=[math]::Abs($c.R-$p[2].R)+[math]::Abs($c.G-$p[2].G)+[math]::Abs($c.B-$p[2].B)} }; if($d -lt $best){$best=$d;$bx=$dx;$by=$dy} } }
"face offset $bx,$by"
# face box of the still: eye lines down to the chin
for($y=37;$y -le 44;$y++){ for($x=29;$x -le 41;$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $skinOrEye = ($c.R -gt 200 -and $c.G -gt 150) -or ($y -le 40) -or ($c.R -lt 110 -and $c.G -lt 40); if($skinOrEye){ $f.SetPixel($x+$bx,$y+$by,$c) } } } }
$f.Save([IO.Path]::GetFullPath($Out))
$o=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($s,0,10,384,384); $g.DrawImage($f,396,10,384,384); $o.Save([IO.Path]::GetFullPath('walk2_view.png'))
