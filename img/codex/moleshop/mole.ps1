Add-Type -AssemblyName System.Drawing
$f=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\ev_swampshop.png'))
function Box($b){ $l=999;$r=0;$t=999;$bt=0; for($y=0;$y -lt $b.Height;$y++){ for($x=0;$x -lt $b.Width;$x++){ if($b.GetPixel($x,$y).A -gt 0){ if($x -lt $l){$l=$x}; if($x -gt $r){$r=$x}; if($y -lt $t){$t=$y}; if($y -gt $bt){$bt=$y} } } }; return @($l,$r,$t,$bt) }
$fb=Box $f; "frog box x $($fb[0])..$($fb[1]) y $($fb[2])..$($fb[3])"
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\moleshop\mole_src.png'))
function IsKey($c){ $c.R -gt 170 -and $c.B -gt 170 -and $c.G -lt 90 }
$l=9999;$r=0;$t=9999;$b=0
for($y=0;$y -lt $s.Height;$y+=2){ for($x=0;$x -lt $s.Width;$x+=2){ if(-not (IsKey $s.GetPixel($x,$y))){ if($x -lt $l){$l=$x}; if($x -gt $r){$r=$x}; if($y -lt $t){$t=$y}; if($y -gt $b){$b=$y} } } }
$block=19.0; $W=[int][math]::Round(($r-$l+2)/$block); $H=[int][math]::Round(($b-$t+2)/$block)
if($H -gt 58){ $block=($b-$t+2)/58.0; $W=[int][math]::Round(($r-$l+2)/$block); $H=58 }
"mole grid ${W}x$H"
$o=New-Object System.Drawing.Bitmap 64,64; $ox=[int][math]::Floor((64-$W)/2); $oy=$fb[3]-$H+1
for($j=0;$j -lt $H;$j++){ for($i=0;$i -lt $W;$i++){ $cnt=@{}; $col=@{}; $mag=0
  foreach($fy in 0.3,0.5,0.7){ foreach($fx in 0.3,0.5,0.7){ $x=[int][math]::Min($s.Width-1,$l+($i+$fx)*($r-$l+2)/$W); $y=[int][math]::Min($s.Height-1,$t+($j+$fy)*($b-$t+2)/$H); $c=$s.GetPixel($x,$y)
    if(IsKey $c){ $mag++; continue }; $k="$($c.R -shr 4),$($c.G -shr 4),$($c.B -shr 4)"; $cnt[$k]++; $col[$k]=$c } }
  if($mag -ge 5){ continue }
  $best=($cnt.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key; $c=$col[$best]
  if($c.G -lt 60 -and $c.R -gt 110 -and $c.B -gt 70){ continue }
  if($c.R -lt 100 -and $c.G -lt 45){ $c=[System.Drawing.ColorTranslator]::FromHtml('#3a1206') }
  if($oy+$j -ge 0){ $o.SetPixel($ox+$i,$oy+$j,$c) } } }
$o.Save([IO.Path]::GetFullPath('img\codex\moleshop\mole.png'))
$mb=Box $o; "mole box x $($mb[0])..$($mb[1]) y $($mb[2])..$($mb[3])"
$bg=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_cave.png'))
$pv=New-Object System.Drawing.Bitmap 900,380; $g=[System.Drawing.Graphics]::FromImage($pv); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($bg,(New-Object System.Drawing.Rectangle 0,0,900,380),(New-Object System.Drawing.Rectangle 200,190,300,127),[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($o,40,30,320,320); $g.DrawImage($f,420,30,320,320); $g.DrawImage($o,770,100,64,64); $g.DrawImage($o,750,200,128,128)
$pv.Save([IO.Path]::GetFullPath('img\codex\moleshop\compare.png'))
