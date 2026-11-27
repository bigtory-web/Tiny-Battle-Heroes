Add-Type -AssemblyName System.Drawing
# blue / crown mimic chance: the mimic icon recoloured like the in-game variants + crown + the same green "chance up" arrow
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'g #5ee04a','h #2e9c22','y #ffcb2a','Y #fff06a','d #c8860e','r #f41410','B #3f86e8'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$up = '....g....','...ggg...','..ggggh..','.gggggghh','ggggggghh','...ggh...','...ggh...','...ggh...','...ggh...'
$crown = 'Y...Y...Y','yy.yYy.yy','yyyyyyyyy','yryyByyry','ddddddddd'
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\upicon3\base19\up_mimicbox.png'))
$x0=24;$y0=24;$x1=0; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y}; if($x -gt $x1){$x1=$x} } } }
function Stamp($b,$m,$ox,$oy){ $h=$m.Count; $w=$m[0].Length
  $on = { param($i,$j) $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(& $on $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(& $on ($i+$dx) ($j+$dy)){ $near=$true } } }
    $px=$ox+$i; $py=$oy+$j; if($near -and $px -ge 0 -and $py -ge 0 -and $px -lt 24 -and $py -lt 24){ $b.SetPixel($px,$py,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(& $on $i $j){ $b.SetPixel($ox+$i,$oy+$j,(C $pal[[string]$m[$j][$i]])) } } } }
function Make($ramp, $dy, $isKing){
  $o = New-Object System.Drawing.Bitmap 24,24
  for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if(-not $c.A -or $y-$y0+$dy -ge 24){continue}
    # wood only: tongue (low G), gold lock (high G), teeth and outline stay
    if($c.R -gt 70 -and $c.G -gt $c.R*0.24 -and $c.G -lt $c.R*0.72 -and $c.B -lt $c.G*0.7){ $k = if($c.R -ge 185){0}elseif($c.R -ge 145){1}elseif($c.R -ge 105){2}else{3}; $c = C $ramp[$k] }
    $o.SetPixel($x-$x0,$y-$y0+$dy,$c) } }
  if($isKing){ Stamp $o $crown ([int](($x1-$x0+1-9)/2)) 1 }
  Stamp $o $up 14 14
  return $o }
New-Item -ItemType Directory -Force img\codex\mimicup | Out-Null
$blue = Make @('#8cc0ff','#4f86e0','#33609f','#24457a') 1 $false
$king = Make @('#cf94ff','#9a52e0','#6e2cb4','#4a1c80') 4 $true
$blue.Save([IO.Path]::GetFullPath('img\codex\mimicup\up_mBlueUp.png')); $king.Save([IO.Path]::GetFullPath('img\codex\mimicup\up_mKingUp.png'))
$count = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\up_mimic.png'))
$z=4; $s = New-Object System.Drawing.Bitmap (3*62*$z+16), (2*62*$z+16+80); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($im,$px,$py,$k,$b){
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
  $g.DrawImage($im,[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)) }
$i=0; foreach($im in $count,$blue,$king){ Tile $im (16+$i*62*$z) 16 $z $false; Tile $im (16+$i*62*$z) (16+62*$z) $z $true; Tile $im (16+$i*70) (2*62*$z+24) 1.333 ($i -eq 1); $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\mimicup\compare.png'))
