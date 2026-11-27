Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\vine_new11.png')); $h=@{}
for($y=42;$y -lt 64;$y++){ for($x=43;$x -lt 60;$x++){ $c=$im.GetPixel($x,$y); if($c.A){ $k='#{0:x2}{1:x2}{2:x2}' -f $c.R,$c.G,$c.B; $h[$k]++ } } }
$h.GetEnumerator()|Sort-Object Value -Descending|Select-Object -First 14|ForEach-Object{"$($_.Key) $($_.Value)"}
