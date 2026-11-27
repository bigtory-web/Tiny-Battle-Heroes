# the mustard dots on the right ear -> ear browns
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png')); $b=New-Object System.Drawing.Bitmap $s; $s.Dispose()
$must=[System.Drawing.ColorTranslator]::FromHtml('#b76a22'); $rim=[System.Drawing.ColorTranslator]::FromHtml('#b04e2a'); $n=0
for($y=22;$y -le 26;$y++){ for($x=32;$x -le 42;$x++){ if($b.GetPixel($x,$y).ToArgb() -eq $must.ToArgb()){ $b.SetPixel($x,$y,$rim); $n++ } } }
"recoloured $n"; $b.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png'))
$a=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\bear64.png'))
$p=New-Object System.Drawing.Bitmap 780,400; $g=[System.Drawing.Graphics]::FromImage($p); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,0,10,384,384); $g.DrawImage($b,396,10,384,384); $p.Save([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final_view.png'))
