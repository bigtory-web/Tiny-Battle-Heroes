# the other eight crystals: same picture as the approved ui_cry_hp, green tones swapped by brightness
Add-Type -AssemblyName System.Drawing
$base=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\ui_cry_hp.png'))
function Lum($c){ ($c.R*3+$c.G*6+$c.B)/10 }
function IsGreen($c){ $c.A -and ($c.G - $c.R) -gt 15 -and $c.G -gt 35 }
# four colours per crystal: dark, mid-dark, mid, light
$set=[ordered]@{
  def=@('#6a3f20','#8f5c30','#b07c46','#e8c598'); care=@('#b23470','#dc5896','#f783b8','#ffd6ea')
  atk=@('#a94708','#db6a10','#ff9428','#ffd8a0'); aspd=@('#0f7f92','#1fb0c0','#52dce6','#d4fcff')
  crit=@('#43207e','#6531b0','#8f52e0','#d8bcff'); energy=@('#a98000','#dcb008','#ffdc28','#fff6b0')
  move=@('#aab2c4','#d2d8e4','#eef1f7','#ffffff'); reach=@('#454d60','#6b7488','#99a2b4','#dfe5ef') }
$names=Get-Content -Encoding UTF8 img\codex\cryset\names.txt
foreach($id in $set.Keys){ $o=New-Object System.Drawing.Bitmap $base
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$base.GetPixel($x,$y); if(IsGreen $c){ $l=Lum $c
      $k = if($l -lt 130){0}elseif($l -lt 165){1}elseif($l -lt 215){2}else{3}
      $o.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml($set[$id][$k])) } } }
  # the mirror crystal also gets two slanted shine bands
  if($id -eq 'reach'){ foreach($off in 20,27){ for($y=0;$y -lt 24;$y++){ $x=$off-$y; if($x -ge 0 -and $x -lt 24 -and (IsGreen $base.GetPixel($x,$y))){ $o.SetPixel($x,$y,[System.Drawing.Color]::White) } } } }
  $o.Save([IO.Path]::GetFullPath("img\codex\cryset\ui_cry_$id.png")) }
# preview: nine crystals with names, big and at slot size
$pv=New-Object System.Drawing.Bitmap 800,480; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.TextRenderingHint='AntiAlias'
$font=New-Object System.Drawing.Font 'Malgun Gothic',12; $slot=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d'))
$ids=@('hp') + @($set.Keys)
for($i=0;$i -lt 9;$i++){ $id=$ids[$i]; $f = if($id -eq 'hp'){'img\p\ui_cry_hp.png'}else{"img\codex\cryset\ui_cry_$id.png"}
  $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $x=15+($i%5)*158; $y=15+[math]::Floor($i/5)*175
  $g.FillRectangle($slot,$x,$y,144,144); $g.DrawImage($im,($x+12),($y+12),120,120); $g.DrawString($names[$i],$font,[System.Drawing.Brushes]::White,($x+8),($y+147))
  $g.FillRectangle($slot,(15+$i*50),390,40,40); $g.DrawImage($im,(15+$i*50+8),398,24,24) }
$g.DrawString($names[9],$font,[System.Drawing.Brushes]::White,15,445)
$pv.Save([IO.Path]::GetFullPath('img\codex\cryset\compare.png'))
