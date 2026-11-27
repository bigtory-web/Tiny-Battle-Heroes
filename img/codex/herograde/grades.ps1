param([string]$Fit)
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$dir='img\codex\herograde'
& $Fit -Sheet "$dir\raw.png" -Names 'hero' -OutDir "$dir\base19" -Gap 30 -Size 20
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'g #5ee04a','h #2e9c22','y #ffcb2a','Y #fff4b0'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$up = '....g....','...ggg...','..ggggh..','.gggggghh','ggggggghh','...ggh...','...ggh...','...ggh...','...ggh...'
$lv = 'YY....YY.YY','yy....yy.yy','yy....yy.yy','yy....yy.yy','yy....yy.yy','yyyyy..yyy.','yyyyy...y..'
function Compose($file, $badge, $out){
  $src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file))
  $o = New-Object System.Drawing.Bitmap 24,24
  $x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }
  for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-$x0,$y-$y0,$c) } } }
  $m=$badge; $h=$m.Count; $w=$m[0].Length; $ox=23-$w; $oy=23-$h
  function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
    if($near){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C $pal[[string]$m[$j][$i]])) } } }
  $o.Save([IO.Path]::GetFullPath($out)) }
Compose "$dir\base19\up_hero.png" $up "$dir\up_heroGrade.png"
Compose "$dir\base19\up_hero.png" $lv "$dir\up_heroLv.png"
Compose 'img\codex\upicon3\base19\up_gobcoin.png' $up "$dir\up_grollGrade.png"
Compose 'img\codex\upicon3\base19\up_mgirl.png' $up "$dir\up_merchHeroGrade.png"
# preview: each new icon next to the one it shares today
$pairs = @('campfire','heroGrade'),@('groll','grollGrade'),@('merchHero','merchHeroGrade'),@('t_atk','heroLv')
$z=3; $t=62*$z; $s = New-Object System.Drawing.Bitmap (4*($t*2+30)+16), ($t+16+90); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($file,$px,$py,$k,$b){
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
  $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file)); $g.DrawImage($im,[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)); $im.Dispose() }
$i=0; foreach($pr in $pairs){ $x=16+$i*($t*2+30)
  Tile "img\p\up_$($pr[0]).png" $x 16 $z $false; Tile "$dir\up_$($pr[1]).png" ($x+$t) 16 $z $true
  Tile "img\p\up_$($pr[0]).png" $x ($t+24) 1.333 $false; Tile "$dir\up_$($pr[1]).png" ($x+80) ($t+24) 1.333 $true
  $i++ }
$s.Save([IO.Path]::GetFullPath("$dir\compare.png"))
