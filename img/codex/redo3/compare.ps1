# rows = flame, vine, coral; columns = knight, current, new.  usage (project root): compare.ps1 -Suffix new
param([string]$Suffix='new',[string]$Out='img\codex\redo3\compare.png')
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1152,1152; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($id in 'flame','vine','coral'){ $col=0
  foreach($f in 'img\p\knight.png',"img\p\$id.png","img\codex\redo3\${id}_$Suffix.png"){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
    # same game scale for every canvas: 6 screen pixels per sprite pixel, feet on the same line
    $w=$im.Width*6; $g.DrawImage($im,[int]($col*384+192-$w/2),[int](($row+1)*384-$im.Height*6),[int]$w,[int]($im.Height*6)); $im.Dispose(); $col++ }
  $row++ }
$o.Save([IO.Path]::GetFullPath($Out))
