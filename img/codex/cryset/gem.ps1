# tilted faceted crystals built from straight faces on the 24x24 grid.  variants a (single), b (+1 shard), c (+2 shards)
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$ink = C '#101826'
# palette order: tipLight, light, mid, dark
function Crystal($o, $pal, [double]$cx, [double]$cy, [double]$deg, [double]$W, [double]$body, [double]$tip){
  $a=$deg*[math]::PI/180; $sa=[math]::Sin($a); $ca=[math]::Cos($a)
  $m = New-Object 'object[,]' 24,24
  $e1=-0.3*$W; $e2=0.45*$W; $sh=$body/2; $apex=$sh+$tip
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){
    $dx=$x+0.5-$cx; $dy=$cy-($y+0.5); $u=$dx*$ca-$dy*$sa; $v=$dx*$sa+$dy*$ca
    if([math]::Abs($u) -gt $W){ continue }
    $edge=1-[math]::Abs($u)/$W
    if($v -gt $sh+$tip*$edge -or $v -lt -$sh-[math]::Min(1.6,$edge*$W*0.6)){ continue }
    $shoulder = $sh + [math]::Min(1.4, $edge*$W*0.45)
    if($v -gt $shoulder){ $k=($apex-$v)/($apex-$shoulder); $m[$x,$y] = if($u -lt $e1*$k){$pal[0]}elseif($u -gt $e2*$k){$pal[2]}else{$pal[1]} }
    else { $m[$x,$y] = if($u -lt $e1){$pal[1]}elseif($u -gt $e2){$pal[3]}else{$pal[2]}
      if($u -ge $e1 -and $u -lt $e1+1.0 -and $v -gt -$sh*0.2){ $m[$x,$y]=$pal[0] }
      if($v -gt $shoulder-1.0){ $m[$x,$y] = if($u -gt $e2){$pal[2]}else{$pal[0]} } } } }
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$m[$x,$y]; if($c){ $o.SetPixel($x,$y,$c); continue }
    foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$x+$d[0]; $j=$y+$d[1]; if($i -ge 0 -and $j -ge 0 -and $i -lt 24 -and $j -lt 24){ if($m[$i,$j]){ $o.SetPixel($x,$y,$ink); break } } } } } }
function Glint($o,$x,$y){ foreach($d in @(@(0,0),@(1,0),@(-1,0),@(0,1),@(0,-1))){ $o.SetPixel(($x+$d[0]),($y+$d[1]),[System.Drawing.Color]::White) } }
function Gem($variant, $cols){
  $pal = @($cols | ForEach-Object { C $_ })
  $o = New-Object System.Drawing.Bitmap 24,24
  if($variant -eq 'a'){ Crystal $o $pal 11.8 12.2 24 5.2 10.5 7.5; Glint $o 3 5 }
  if($variant -eq 'b'){ Crystal $o $pal 13.5 11.8 22 4.6 10.5 7.0; Crystal $o $pal 6.5 16.5 -32 2.8 5.5 3.8; Glint $o 4 5 }
  if($variant -eq 'c'){ Crystal $o $pal 12 11.3 14 4.3 10.5 7.0; Crystal $o $pal 5.8 16 -38 2.7 5.5 3.6; Crystal $o $pal 18 16.5 44 2.6 5.0 3.4; Glint $o 20 3 }
  return $o }
$green = '#eafff2','#8dffb4','#3cc470','#1f7a45'
foreach($v in 'a','b','c'){ (Gem $v $green).Save([IO.Path]::GetFullPath("img\codex\cryset\gem_$v.png")) }
$sets = $green, @('#f6dcb6','#cd9c66','#9c6a3a','#62381c'), @('#ffe4f0','#ff9cc8','#e4609c','#9c2a64'), @('#ffe6bc','#ffb050','#e87414','#953c04'), @('#e6fdff','#86eef4','#24bccc','#0c6c7e'), @('#e8d8ff','#b888f8','#7e44d4','#3c1a74'), @('#fffcd0','#ffe850','#e0b40c','#8c6a00'), @('#ffffff','#f6f8fc','#d6dce8','#9ea8be'), @('#f2f6ff','#b4bccc','#767f94','#3c4356')
$pv=New-Object System.Drawing.Bitmap 600,520; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$slot=New-Object System.Drawing.SolidBrush (C '#17141d'); $font=New-Object System.Drawing.Font 'Arial',16,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($v in 'a','b','c'){ $x=12+$i*196; $g.FillRectangle($slot,$x,12,184,184); $im=Gem $v $green; $g.DrawImage($im,($x+20),32,144,144); $g.DrawString($v.ToUpper(),$font,[System.Drawing.Brushes]::White,($x+8),18)
  $r=0; foreach($s in $sets){ $k=Gem $v $s; $px=12+$r*64; $py=215+$i*100; $g.FillRectangle($slot,$px,$py,56,56); $g.DrawImage($k,($px+4),($py+4),48,48); $g.FillRectangle($slot,($px+8),($py+62),32,32); $g.DrawImage($k,($px+12),($py+66),24,24); $r++ }
  $i++ }
$pv.Save([IO.Path]::GetFullPath('img\codex\cryset\gem_compare.png'))
# chosen: B -> the nine game icons (reach = mirror, gets two slanted shine bands)
$ids = 'hp','def','care','atk','aspd','crit','energy','move','reach'
for($n=0;$n -lt 9;$n++){ $k = Gem 'b' $sets[$n]
  if($ids[$n] -eq 'reach'){ foreach($off in 19,26){ for($y=0;$y -lt 24;$y++){ $x=$off-$y; if($x -ge 0 -and $x -lt 24){ $c=$k.GetPixel($x,$y); if($c.A -and $c.ToArgb() -ne (C '#101826').ToArgb()){ $k.SetPixel($x,$y,[System.Drawing.Color]::White) } } } } }
  $k.Save([IO.Path]::GetFullPath("img\p\ui_cry_$($ids[$n]).png")) }
$pv=New-Object System.Drawing.Bitmap 800,420; $g=[System.Drawing.Graphics]::FromImage($pv); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.TextRenderingHint='AntiAlias'
$font=New-Object System.Drawing.Font 'Malgun Gothic',12; $names=Get-Content -Encoding UTF8 img\codex\cryset\names.txt
for($i=0;$i -lt 9;$i++){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\ui_cry_$($ids[$i]).png")); $x=15+($i%5)*158; $y=15+[math]::Floor($i/5)*170
  $g.FillRectangle($slot,$x,$y,144,144); $g.DrawImage($im,($x+12),($y+12),120,120); $g.DrawString(($names[$i] -replace ' \(.*\)',''),$font,[System.Drawing.Brushes]::White,($x+8),($y+146))
  $g.FillRectangle($slot,(15+$i*50),365,40,40); $g.DrawImage($im,(15+$i*50+8),373,24,24); $im.Dispose() }
$pv.Save([IO.Path]::GetFullPath('img\codex\cryset\final.png'))
