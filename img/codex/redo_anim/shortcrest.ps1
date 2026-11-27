# transplant only the shorter-feather crest (rows <= 32, x <= 38) from the Codex redraw onto the approved Tora, still and 8 frames
Add-Type -AssemblyName System.Drawing
function Load($p){ $s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $o=New-Object System.Drawing.Bitmap $s; $s.Dispose(); return $o }
function Face($im,$ox){ $x0=64;$x1=0; for($y=38;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ if($im.GetPixel($ox+$x,$y).A -gt 40){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x} } } }
  $cx=($x0+$x1)/2.0; $top=-1; for($y=0;$y -lt 64 -and $top -lt 0;$y++){ $n=0; for($x=[int][math]::Round($cx-11.52);$x -le $cx+11.52;$x++){ if($x -ge 0 -and $x -lt 64 -and $im.GetPixel($ox+$x,$y).A -gt 40){$n++} }; if($n -ge 4){$top=$y} }
  $sx=0.0;$k=0; for($y=$top;$y -lt [math]::Min(64,$top+17.92);$y++){ for($x=[int][math]::Round($cx-15.36);$x -le $cx+15.36;$x++){ if($x -ge 0 -and $x -lt 64 -and $im.GetPixel($ox+$x,$y).A -gt 40){ $sx+=$x+.5; $k++ } } }
  return @(($sx/$k/64), ($top/64.0), $top) }
$old=Load 'img\p\thunderbird.png'; $sheet=Load 'img\p\thunderbird_anim.png'
foreach($v in @(@('g',1),@('h',0))){ $n,$shift=$v
  $new=Load "img\pixellab\redo\tora_${n}_64.png"
  $still=New-Object System.Drawing.Bitmap $old; $out=New-Object System.Drawing.Bitmap $sheet
  $clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
  for($y=0;$y -le 32;$y++){ for($x=0;$x -le 38;$x++){ $sx=$x+$shift; $c = if($sx -ge 0 -and $sx -lt 64){$new.GetPixel($sx,$y)}else{$clear}; $still.SetPixel($x,$y,$c) } }
  for($f=0;$f -lt 8;$f++){ $up= if($f -eq 1 -or $f -eq 2){1}else{0}
    for($y=0;$y -le 32-$up;$y++){ for($x=0;$x -le 38;$x++){ $out.SetPixel($f*64+$x,$y,$still.GetPixel($x,$y+$up)) } } }
  $still.Save([IO.Path]::GetFullPath("img\codex\redo_anim\thunderbird_short_${n}_still.png")); $out.Save([IO.Path]::GetFullPath("img\codex\redo_anim\thunderbird_short_${n}_anim.png"))
  "short $n head top row $((Face $still 0)[2])" }
# preview: current / G / H with their game icons, then the G and H frames
$pv=New-Object System.Drawing.Bitmap 1536,960; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$i=0; foreach($f in 'img\p\thunderbird.png','img\codex\redo_anim\thunderbird_short_g_still.png','img\codex\redo_anim\thunderbird_short_h_still.png'){ $im=Load $f
  $g.DrawImage($im,($i*512),0,320,320); $fc=Face $im 0; $B=160; $bx=$i*512+330; $by=90
  $g.FillRectangle($slot,$bx,$by,$B,$B); $g.SetClip((New-Object System.Drawing.Rectangle $bx,$by,$B,$B)); $g.DrawImage($im,[int]($bx+$B*.5-$fc[0]*2.05*$B),[int]($by+$B*.03-$fc[1]*2.05*$B),[int](2.05*$B),[int](2.05*$B)); $g.ResetClip(); $i++ }
$r=0; foreach($n in 'g','h'){ $s=Load "img\codex\redo_anim\thunderbird_short_${n}_anim.png"; $g.DrawImage($s,(New-Object System.Drawing.Rectangle 0,(340+$r*310),1536,192),(New-Object System.Drawing.Rectangle 0,0,512,64),[System.Drawing.GraphicsUnit]::Pixel); $r++ }
$pv.Save([IO.Path]::GetFullPath('img\codex\redo_anim\shortcrest_compare.png'))
