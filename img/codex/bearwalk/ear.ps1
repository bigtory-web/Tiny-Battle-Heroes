Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png')); $b=New-Object System.Drawing.Bitmap $s; $s.Dispose()
$found=@(); for($y=18;$y -le 30;$y++){ for($x=34;$x -le 50;$x++){ $c=$b.GetPixel($x,$y); if($c.A -and $c.B -lt 90 -and $c.G -gt 70 -and $c.R -lt 200 -and $c.R -le ($c.G+55)){ $found+="$x,$y #{0:x2}{1:x2}{2:x2}" -f $c.R,$c.G,$c.B } } }
"olive-like: $($found -join '  ')"
$brown=[System.Drawing.ColorTranslator]::FromHtml('#9f4624')
foreach($f in $found){ $p=$f.Split(' ')[0].Split(','); $b.SetPixel([int]$p[0],[int]$p[1],$brown) }
$b.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png'))
$a=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\bear64.png'))
$p=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,0,10,384,384); $g.DrawImage($b,396,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final_view.png'))
