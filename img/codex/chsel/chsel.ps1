param([string]$Fit)
Add-Type -AssemblyName System.Drawing
$dir = 'img\codex\chsel'
& $Fit -Sheet "$dir\medal_raw.png" -Names 'easy,normal,hard' -OutDir $dir -Size 22
# card art -> 204x230, dominant colour per cell
$s = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("$dir\card1_raw.png"))
$o = New-Object System.Drawing.Bitmap 204,230
$kx = $s.Width/204.0; $ky = $s.Height/230.0
for($j=0;$j -lt 230;$j++){ for($i=0;$i -lt 204;$i++){ $cnt=@{}; $col=@{}
  foreach($fy in 0.2,0.4,0.6,0.8){ foreach($fx in 0.2,0.4,0.6,0.8){ $c=$s.GetPixel([int][math]::Min($s.Width-1,($i+$fx)*$kx),[int][math]::Min($s.Height-1,($j+$fy)*$ky)); $k="$($c.R -shr 3),$($c.G -shr 3),$($c.B -shr 3)"; $cnt[$k]++; $col[$k]=$c } }
  $best=($cnt.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key; $o.SetPixel($i,$j,$col[$best]) } }
$o.Save([IO.Path]::GetFullPath("$dir\ch_card1.png"))
# preview as the stage screen draws it: card 220x290, art 204x230 on top, name below, medals top-left at 36
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
function Br($h){ New-Object System.Drawing.SolidBrush (C $h) }
$old = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_field.png'))
$z=2; $cv = New-Object System.Drawing.Bitmap (480*$z), (306*$z); $g=[System.Drawing.Graphics]::FromImage($cv); $g.Clear((C '#120e20')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($art in $null,$o){ $x=(12+$i*236)*$z; $y=8*$z
  $g.FillRectangle((Br '#5d5470'),$x,$y,220*$z,290*$z); $g.FillRectangle((Br '#2a2144'),$x+6*$z,$y+6*$z,208*$z,278*$z)
  $dst = New-Object System.Drawing.Rectangle(($x+8*$z),($y+8*$z),(204*$z),(230*$z))
  if($art){ $g.DrawImage($art,$dst) } else { $k=230.0/402; $sw=204/$k; $g.DrawImage($old,$dst,[int]((720-$sw)/2),0,[int]$sw,402,'Pixel') }
  $m=0; foreach($t in 'easy','normal','hard'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("$dir\up_$t.png")); $g.DrawImage($im,$x+(10+$m*38)*$z,$y+10*$z,36*$z,36*$z); $im.Dispose(); $m++ }
  $g.DrawString((Get-Content "$dir\name.txt" -Encoding UTF8), (New-Object System.Drawing.Font('Malgun Gothic',26,[System.Drawing.FontStyle]::Bold)), (Br '#f3e6c4'), [single]($x+66*$z), [single]($y+248*$z)); $i++ }
$cv.Save([IO.Path]::GetFullPath("$dir\compare.png"))
