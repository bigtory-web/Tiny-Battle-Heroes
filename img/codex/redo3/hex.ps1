Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\coral_new18.png'))
for($y=34;$y -le 38;$y++){ $l="$y "; for($x=28;$x -le 39;$x++){ $c=$im.GetPixel($x,$y); $l+= if($c.A){ '{0:x2}{1:x2}{2:x2} ' -f $c.R,$c.G,$c.B } else {'...... '} }; $l }
