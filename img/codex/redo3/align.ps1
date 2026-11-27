# find the offset of the new snap against coral_new14 (using everything except the forehead), then copy only the forehead
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$a=Load 'coral_new14.png'; $n=Load 'coral_new18raw.png'
$best=1e18; for($dx=-12;$dx -le 4;$dx++){ for($dy=-3;$dy -le 3;$dy++){ $s=0.0
    for($y=20;$y -lt 33;$y++){ for($x=8;$x -lt 54;$x+=1){ $p=$a.GetPixel($x,$y); $xx=$x-$dx; $yy=$y-$dy; if($xx -lt 0 -or $xx -gt 63 -or $yy -lt 0 -or $yy -gt 63){continue}; $q=$n.GetPixel($xx,$yy)
        if(($p.A -gt 0) -ne ($q.A -gt 0)){$s+=300} elseif($p.A){ $s+=[math]::Abs($p.R-$q.R)+[math]::Abs($p.B-$q.B) } } }
    if($s -lt $best){$best=$s;$bx=$dx;$by=$dy} } }
"offset $bx,$by"
$o=New-Object System.Drawing.Bitmap $a; $cnt=0
# forehead only: between the side locks, from under the top of the head to just above the brows
for($y=32;$y -le 38;$y++){ for($x=28;$x -le 39;$x++){ $q=$n.GetPixel($x-$bx,$y-$by); if($q.A -and $a.GetPixel($x,$y).A){ if($q.ToArgb() -ne $a.GetPixel($x,$y).ToArgb()){$cnt++}; $o.SetPixel($x,$y,$q) } } }
"forehead pixels changed $cnt"
$o.Save([IO.Path]::GetFullPath('coral_new18.png'))
$z=New-Object System.Drawing.Bitmap 1210,520; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,(New-Object System.Drawing.Rectangle 0,0,600,520),(New-Object System.Drawing.Rectangle 20,22,30,26),[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($o,(New-Object System.Drawing.Rectangle 610,0,600,520),(New-Object System.Drawing.Rectangle 20,22,30,26),[System.Drawing.GraphicsUnit]::Pixel)
$z.Save([IO.Path]::GetFullPath('bangs18.png'))
