# eye zoom with a pixel grid.  usage: eyegrid.ps1 -Files a.png,b.png -Out z.png
param([string]$Files,[string]$Out)
Add-Type -AssemblyName System.Drawing
$list=$Files -split ','; $Z=30; $W=18; $H=11
$o=New-Object System.Drawing.Bitmap ($W*$Z+20),($list.Count*($H*$Z+20)); $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#222222'))
$pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90,0,0,0)),1
$row=0; foreach($f in $list){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f))
  # the iris = amber pixels in the middle band; the window is centred on them
  $xs=@(); $ys=@(); for($y=[int]($im.Height*0.45);$y -lt [int]($im.Height*0.78);$y++){ for($x=0;$x -lt $im.Width;$x++){ $c=$im.GetPixel($x,$y); if($c.A -and $c.R -gt 170 -and $c.R -lt 240 -and $c.G -gt 95 -and $c.G -lt 170 -and $c.B -lt 40){
        $s=0; foreach($d in @(@(0,-1),@(0,-2),@(1,-1),@(-1,-1))){ $n=$im.GetPixel($x+$d[0],$y+$d[1]); if($n.R -lt 160 -and $n.G -lt 80){$s++} }; if($s){$xs+=$x;$ys+=$y} } } }
  $cx=[int][math]::Floor((($xs|Measure-Object -Minimum -Maximum).Minimum+($xs|Measure-Object -Maximum).Maximum)/2); $cy=[int][math]::Floor(($ys|Measure-Object -Average).Average)
  for($j=0;$j -lt $H;$j++){ for($i=0;$i -lt $W;$i++){ $c=$im.GetPixel($cx-8+$i,$cy-6+$j); if($c.A){ $g.FillRectangle((New-Object System.Drawing.SolidBrush $c),10+$i*$Z,10+$row*($H*$Z+20)+$j*$Z,$Z,$Z) }; $g.DrawRectangle($pen,10+$i*$Z,10+$row*($H*$Z+20)+$j*$Z,$Z,$Z) } }
  "$f  window x $($cx-8) y $($cy-6)"; $im.Dispose(); $row++ }
$o.Save([IO.Path]::GetFullPath($Out))
