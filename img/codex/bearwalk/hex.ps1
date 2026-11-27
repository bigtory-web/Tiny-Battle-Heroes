Add-Type -AssemblyName System.Drawing
$b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\bearwalk\walk1_final.png'))
for($y=22;$y -le 25;$y++){ $l="$y "; for($x=33;$x -le 40;$x++){ $c=$b.GetPixel($x,$y); $l+= if($c.A){'{0:x2}{1:x2}{2:x2} ' -f $c.R,$c.G,$c.B}else{'...... '} }; $l }
