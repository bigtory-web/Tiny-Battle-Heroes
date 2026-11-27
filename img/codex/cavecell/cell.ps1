# raw.png (two tiles on magenta) -> 94x62 tiles (47x31 grid, 2x), plus grey "off" versions and sign variants
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\cavecell\raw.png'))
function IsKey($c){ $c.R -gt 150 -and $c.B -gt 150 -and $c.G -lt 90 }
$half=[int]($s.Width/2)
$box=@(); foreach($x0 in 0,$half){ $l=9999;$r=0;$t=9999;$b=0
  for($y=0;$y -lt $s.Height;$y+=2){ for($x=$x0;$x -lt $x0+$half;$x+=2){ if(-not (IsKey $s.GetPixel($x,$y))){ if($x -lt $l){$l=$x}; if($x -gt $r){$r=$x}; if($y -lt $t){$t=$y}; if($y -gt $b){$b=$y} } } }
  $box+=,@($l,$r,$t,$b) }
$cw=($box[0][1]-$box[0][0]+2)/45.0; $ch=($box[0][3]-$box[0][2]+2)/26.0
$n=0; foreach($name in 'm','p'){ $l,$r,$t,$b=$box[$n]; $top=$b+2-26*$ch
  $o=New-Object System.Drawing.Bitmap 94,62
  for($j=0;$j -lt 31;$j++){ for($i=0;$i -lt 47;$i++){ $cnt=@{}; $col=@{}; $mag=0
      foreach($fy in 0.3,0.5,0.7){ foreach($fx in 0.3,0.5,0.7){ $x=[int]($l+($i-1+$fx)*$cw); $y=[int]($top+($j-3+$fy)*$ch)
          if($x -lt 0 -or $y -lt 0 -or $x -ge $s.Width -or $y -ge $s.Height){ $mag++; continue }
          $c=$s.GetPixel($x,$y); if(IsKey $c){ $mag++; continue }
          $k="$($c.R -shr 4),$($c.G -shr 4),$($c.B -shr 4)"; $cnt[$k]++; $col[$k]=$c } }
      if($mag -ge 5){ continue }
      $best=($cnt.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key; $c=$col[$best]
      if($c.R -gt 100 -and $c.B -gt 100 -and $c.G -lt 70){ $c=[System.Drawing.ColorTranslator]::FromHtml('#162038') }
      foreach($a in 0,1){ foreach($d in 0,1){ $o.SetPixel($i*2+$a,$j*2+$d,$c) } } } }
  $o.Save([IO.Path]::GetFullPath("img\codex\cavecell\cry_cell_$name.png"))
  # off = same picture with the green drained out
  $off=New-Object System.Drawing.Bitmap $o
  for($y=0;$y -lt 62;$y++){ for($x=0;$x -lt 94;$x++){ $c=$off.GetPixel($x,$y); if($c.A -and ($c.G - $c.R) -gt 40){ $v=[int](($c.R*3+$c.G*6+$c.B)/10*0.75); $off.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($c.A,$v,[int]($v*1.04),[int]([math]::Min(255,$v*1.2)))) } } }
  $off.Save([IO.Path]::GetFullPath("img\codex\cavecell\cry_cell_${name}_off.png"))
  # sign variant: the same minus / plus mark the placeholder had
  $sg=New-Object System.Drawing.Bitmap $o; $g=[System.Drawing.Graphics]::FromImage($sg)
  $dk=New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#17141d')); $w=[System.Drawing.Brushes]::White
  $g.FillRectangle($dk,38,44,18,10); if($name -eq 'p'){ $g.FillRectangle($dk,42,40,10,18) }
  $g.FillRectangle($w,40,46,14,6); if($name -eq 'p'){ $g.FillRectangle($w,44,42,6,14) }
  $g.Dispose(); $sg.Save([IO.Path]::GetFullPath("img\codex\cavecell\cry_cell_${name}_sign.png"))
  $n++ }
# preview: day / night floor, columns = plain, sign, off
$pv=New-Object System.Drawing.Bitmap 1200,540; $g=[System.Drawing.Graphics]::FromImage($pv); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($v in '','_night'){ $bg=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\bg_cave$v.png"))
  $g.DrawImage($bg,(New-Object System.Drawing.Rectangle 0,($row*270),1200,270),(New-Object System.Drawing.Rectangle 60,240,500,112),[System.Drawing.GraphicsUnit]::Pixel)
  $col=0; foreach($suf in '','_sign','_off'){ $k=0; foreach($nm in 'm','p'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\cavecell\cry_cell_$nm$suf.png")); $g.DrawImage($im,(20+$col*400+$k*180),($row*270+70),188,124); $im.Dispose(); $k++ }; $col++ }
  $row++ }
$pv.Save([IO.Path]::GetFullPath('img\codex\cavecell\compare.png'))
