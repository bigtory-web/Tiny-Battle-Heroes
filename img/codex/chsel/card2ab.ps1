Add-Type -AssemblyName System.Drawing
$dir='img\codex\chsel'
function Down($p){ $s = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $o = New-Object System.Drawing.Bitmap 204,230
  $kx = $s.Width/204.0; $ky = $s.Height/230.0
  for($j=0;$j -lt 230;$j++){ for($i=0;$i -lt 204;$i++){ $cnt=@{}; $col=@{}
    foreach($fy in 0.2,0.4,0.6,0.8){ foreach($fx in 0.2,0.4,0.6,0.8){ $c=$s.GetPixel([int][math]::Min($s.Width-1,($i+$fx)*$kx),[int][math]::Min($s.Height-1,($j+$fy)*$ky)); $k="$($c.R -shr 3),$($c.G -shr 3),$($c.B -shr 3)"; $cnt[$k]++; $col[$k]=$c } }
    $best=($cnt.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key; $o.SetPixel($i,$j,$col[$best]) } }
  return $o }
$a = Down "$dir\card2A_raw.png"; $a.Save([IO.Path]::GetFullPath("$dir\ch_card2A.png"))
$b = Down "$dir\card2B_raw.png"; $b.Save([IO.Path]::GetFullPath("$dir\ch_card2B.png"))
$one = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\ch_card1.png'))
$cv = New-Object System.Drawing.Bitmap 1256,468; $g=[System.Drawing.Graphics]::FromImage($cv); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#120e20')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($one,4,4,408,460); $g.DrawImage($a,424,4,408,460); $g.DrawImage($b,844,4,408,460); $cv.Save([IO.Path]::GetFullPath("$dir\cards_ab.png"))
