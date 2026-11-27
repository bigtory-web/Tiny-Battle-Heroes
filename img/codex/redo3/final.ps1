param([string]$S='new12',[string]$Out='img\codex\redo3\final12.png')
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1536,400; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'img\p\knight.png',"img\codex\redo3\flame_$S.png","img\codex\redo3\vine_$S.png","img\codex\redo3\coral_$S.png"){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $g.DrawImage($im,$i*384,10,384,384); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath($Out))
