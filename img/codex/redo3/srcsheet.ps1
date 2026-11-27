# the three raw Codex results side by side
param([string]$Suffix='src')
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1500,500; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.Color]::Black); $g.InterpolationMode='HighQualityBicubic'
$i=0; foreach($id in 'flame','vine','coral'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\redo3\${id}_$Suffix.png")); "$id $($im.Width)x$($im.Height)"; $g.DrawImage($im,$i*500,0,500,500); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath("img\codex\redo3\sheet_$Suffix.png"))
