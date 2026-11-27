Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1152,384; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($p in '16','16.5','17'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("coral_p15_${p}_64.png")); $g.DrawImage($im,$i*384,0,384,384); $im.Dispose(); $i++ }
$o.Save([IO.Path]::GetFullPath('pitchsheet.png'))
