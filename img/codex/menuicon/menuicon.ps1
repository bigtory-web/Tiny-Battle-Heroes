Add-Type -AssemblyName System.Drawing
# list button: a small parchment scroll with three list lines (24x24)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #2e0c06','L #fff4d0','P #f2d9a0','S #cfa862','R #b8863c','D #7a4a1c','r #e8503c','y #ffcb2a'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$rows = @(
 '........................',
 '..oooooooooooooooooooo..',
 '.oLLLLLLLLLLLLLLLLLLLLo.',
 '.oSSSSSSSSSSSSSSSSSSSSo.',
 '..oooooooooooooooooooo..',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLooPooooooooooPSo...',
 '...oLooPooooooooooPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLooPooooooooooPSo...',
 '...oLooPooooooooooPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLooPooooooooooPSo...',
 '...oLooPooooooooooPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '...oLPPPPPPPPPPPPPPSo...',
 '..oooooooooooooooooooo..',
 '.oLLLLLLLLLLLLLLLLLLLLo.',
 '.oSSSSSSSSSSSSSSSSSSSSo.',
 '..oooooooooooooooooooo..',
 '........................',
 '........................')
$b = New-Object System.Drawing.Bitmap 24,24
for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $k=[string]$rows[$y][$x]; if($k -ne '.'){ $b.SetPixel($x,$y,(C $pal[$k])) } } }
$b.Save([IO.Path]::GetFullPath('img\p\ui_menu.png'))
# side by side with the other UI icons on the dark purple button
$files = 'ui_book','ui_dps','ui_shop','ui_tool','ui_menu'
$z=6; $s = New-Object System.Drawing.Bitmap (($files.Count*34)*$z), (34*$z+60); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#17141d')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in $files){ $x=$i*34*$z; $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#3b3546')), $x+$z, $z, 32*$z, 32*$z)
  $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$f.png")); $g.DrawImage($im, $x+5*$z, 5*$z, 24*$z, 24*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#3b3546')), $x+$z, 34*$z+4, 32, 32); $g.DrawImage($im, $x+$z+4, 34*$z+8, 24, 24); $im.Dispose(); $i++ }
New-Item -ItemType Directory -Force img\codex\menuicon | Out-Null
$s.Save([IO.Path]::GetFullPath('img\codex\menuicon\compare.png'))
