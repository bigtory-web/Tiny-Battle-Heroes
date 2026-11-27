# rows = flame, vine, coral; columns = knight, in game now, previous draft, new draft (same pixel scale)
Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1536,1152; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($id in 'flame','vine','coral'){ $col=0
  foreach($f in 'img\p\knight.png',"img\p\$id.png","img\codex\redo3\${id}_new6.png","img\codex\redo3\${id}_new9.png"){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
    $g.DrawImage($im,[int]($col*384+192-$im.Width*3),[int](($row+1)*384-$im.Height*6),$im.Width*6,$im.Height*6); $im.Dispose(); $col++ }
  $row++ }
$o.Save([IO.Path]::GetFullPath('img\codex\redo3\compare_final2.png'))
