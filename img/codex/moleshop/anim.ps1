# idle loop like the frog merchant: 8 frames, everything above the feet sinks 1 point on frames 2,3,6,7
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\moleshop\mole.png'))
$split=56
$o=New-Object System.Drawing.Bitmap 512,64
for($f=0;$f -lt 8;$f++){ $down = @(2,3,6,7) -contains $f
  for($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){
    $sy = if(-not $down -or $y -gt $split){ $y } else { $y-1 }
    if($sy -ge 0){ $o.SetPixel($f*64+$x,$y,$s.GetPixel($x,$sy)) } } } }
$o.Save([IO.Path]::GetFullPath('img\p\ev_cryshop_anim.png'))
$s.Save([IO.Path]::GetFullPath('img\p\ev_cryshop.png'))
# preview: still and sunk frame, 5x
$pv=New-Object System.Drawing.Bitmap 660,330; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($k in 0,1){ $g.DrawImage($o,(New-Object System.Drawing.Rectangle (5+$k*330),5,320,320),(New-Object System.Drawing.Rectangle ($k*128),0,64,64),[System.Drawing.GraphicsUnit]::Pixel) }
$pv.Save([IO.Path]::GetFullPath('img\codex\moleshop\anim_preview.png'))
