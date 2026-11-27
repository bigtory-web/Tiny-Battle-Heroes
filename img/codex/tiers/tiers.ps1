Add-Type -AssemblyName System.Drawing
# 5 branches x 3 grades: branch picture (top-left) + a big up arrow in the grade colour (data.js heroGrades)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$base = [ordered]@{ hg='img\codex\herograde\base19\up_hero.png'; mg='img\codex\upicon3\base19\up_mgirl.png'; sg='img\codex\upicon3\base19\up_gem.png'; lg='img\codex\upicon3\base19\up_chesto.png'; gg='img\codex\upicon3\base19\up_gobcoin.png' }
$tier = @{ 2=@('#b6f5bd','#5fcf6a','#2e8f3a'); 3=@('#b9dcff','#4fa3ff','#2563b0'); 4=@('#ffe6b0','#ffb02e','#c06a08') }
$m = '.....L.....','....LLL....','...LLMMM...','..LLMMMMM..','.LLMMMMMMM.','LLMMMMMMMDD','...LMMMD...','...LMMMD...','...LMMMD...','...MDDDD...'
$h=$m.Count; $w=11; $ox=12; $oy=13
function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
New-Item -ItemType Directory -Force img\codex\tiers | Out-Null
foreach($k in $base.Keys){
  $src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($base[$k]))
  $x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }
  foreach($g in 2,3,4){
    $o = New-Object System.Drawing.Bitmap 24,24
    for($y=$y0;$y -lt 24;$y++){ for($x=$x0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if($c.A){ $o.SetPixel($x-$x0,$y-$y0,$c) } } }
    for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
      if($near -and $ox+$i -lt 24 -and $oy+$j -lt 24){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
    for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $n = 'LMD'.IndexOf([string]$m[$j][$i]); $o.SetPixel($ox+$i,$oy+$j,(C $tier[$g][$n])) } } }
    $o.Save([IO.Path]::GetFullPath("img\codex\tiers\up_$k$g.png")) } }
# preview: rows = branches, columns = 2,3,4 ; in tiles, plus a small row at screen size
$z=2; $t=62*$z; $s = New-Object System.Drawing.Bitmap (6*$t+80), (5*$t+16); $gx=[System.Drawing.Graphics]::FromImage($s); $gx.Clear((C '#221e2b')); $gx.InterpolationMode='NearestNeighbor'; $gx.PixelOffsetMode='Half'
$r=0; foreach($k in $base.Keys){ $c=0; foreach($b in $false,$true){ foreach($g in 2,3,4){
    $px = 16+$c*$t + $(if($b){24}else{0}); $py = 16+$r*$t
    $gx.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),$px,$py,56*$z,56*$z)
    $gx.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),$px+2*$z,$py+2*$z,52*$z,52*$z)
    $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\tiers\up_$k$g.png")); $gx.DrawImage($im,$px+10*$z,$py+10*$z,36*$z,36*$z); $im.Dispose(); $c++ } }; $r++ }
$s.Save([IO.Path]::GetFullPath('img\codex\tiers\compare.png'))
