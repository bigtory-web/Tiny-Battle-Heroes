# remove one leg row (60) and let everything above come down 1 px: legs 6 -> 5, and the contact pose sits 1 px lower
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\walk2.png')); $o=New-Object System.Drawing.Bitmap 64,64
for($y=0;$y -lt 64;$y++){ $to= if($y -lt 60){$y+1}elseif($y -eq 60){-1}else{$y}; if($to -lt 0){continue}; for($x=0;$x -lt 64;$x++){ $c=$s.GetPixel($x,$y); if($c.A){ $o.SetPixel($x,$to,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png'))
$b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\bear64.png'))
$p=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($b,0,10,384,384); $g.DrawImage($o,396,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final_view.png'))
$z=New-Object System.Drawing.Bitmap 920,300; $g=[System.Drawing.Graphics]::FromImage($z); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($b,(New-Object System.Drawing.Rectangle 0,0,450,225),(New-Object System.Drawing.Rectangle 12,44,40,20),[System.Drawing.GraphicsUnit]::Pixel); $g.DrawImage($o,(New-Object System.Drawing.Rectangle 460,0,450,225),(New-Object System.Drawing.Rectangle 12,44,40,20),[System.Drawing.GraphicsUnit]::Pixel); $z.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final_legs.png'))
# olive dots the colour snap put on the right ear
$o2=New-Object System.Drawing.Bitmap $o; $br=$o2.GetPixel(24,26); if(-not ($br.A -and $br.R -gt $br.G+40)){ $br=[System.Drawing.ColorTranslator]::FromHtml('#9a4524') }
$n=0; for($y=18;$y -le 30;$y++){ for($x=30;$x -le 48;$x++){ $c=$o2.GetPixel($x,$y); if($c.A -and $c.G -ge ($c.R-25) -and $c.G -gt 60 -and $c.B -lt 80){ $o2.SetPixel($x,$y,$br); $n++ } } }
"ear pixels fixed $n"; $o2.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png'))
$p=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($b,0,10,384,384); $g.DrawImage($o2,396,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final_view.png'))
