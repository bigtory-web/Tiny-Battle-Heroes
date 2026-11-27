Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1500,750; $g=[System.Drawing.Graphics]::FromImage($o); $g.InterpolationMode='HighQualityBicubic'
$i=0; foreach($n in 'vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\sheet\${n}_atk_src.png")); $g.DrawImage($im,$i*750,0,750,750); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\sheet\both.png'))
