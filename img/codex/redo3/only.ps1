# just the three latest drafts, same pixel scale
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1500,500; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($n in 'flame','vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${n}_new9.png")); $g.DrawImage($im,($i*500+26),20,448,448); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\only_new.png'))
