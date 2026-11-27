# crystal cell mark as corner pieces (94x62, middle fully clear): plus = bright upright crystals, minus = dim shards leaning in
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$V = @(@(10,3),@(36,3),@(2,15),@(44,15),@(10,28),@(36,28))
$ink = C '#141b30'
function Outline($m){ # m = 47x31 colour grid, add a 1px dark rim
  $o = $m.Clone()
  for($y=0;$y -lt 31;$y++){ for($x=0;$x -lt 47;$x++){ if($m[$x,$y]){continue}
    foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $i=$x+$d[0]; $j=$y+$d[1]; if($i -ge 0 -and $j -ge 0 -and $i -lt 47 -and $j -lt 31 -and $m[$i,$j]){ $o[$x,$y]=$ink; break } } } }
  return ,$o }
function Save($m,$name){ $b=New-Object System.Drawing.Bitmap 94,62
  for($y=0;$y -lt 31;$y++){ for($x=0;$x -lt 47;$x++){ $c=$m[$x,$y]; if($c){ foreach($a in 0,1){ foreach($d in 0,1){ $b.SetPixel(($x*2+$a),($y*2+$d),$c) } } } } }
  $b.Save([IO.Path]::GetFullPath("img\codex\cavecorner\$name.png")) }
function Make($kind,$pal,$name){
  $m = New-Object 'object[,]' 47,31; $extra=@()
  foreach($v in $V){ $vx,$vy=$v
    if($kind -eq 'p'){
      # upright crystal standing on the corner, with a small side crystal
      $map = '..W..','.WLM.','.LLMD','.LLMD','.LMMD','.LMDD','..MD.'
      $cx=[math]::Max(3,[math]::Min(43,$vx)); $by=[math]::Min(29,$vy+3)
      for($j=0;$j -lt 7;$j++){ for($i=0;$i -lt 5;$i++){ $k=[string]$map[$j][$i]; if($k -ceq '.'){continue}; $x=$cx-2+$i; $y=$by-6+$j; if($y -ge 0){ $m[$x,$y]=$pal[$k] } } }
      $side = if($vx -lt 23){-3}else{3}
      foreach($q in @(@(0,-1,'W'),@(0,0,'L'),@(0,1,'M'))){ $x=$cx+$side+$q[0]; $y=$by-1+$q[1]; if($x -ge 0 -and $x -lt 47 -and $y -ge 0){ $m[$x,$y]=$pal[$q[2]] } }
    } else {
      # the same crystal turned upside down (stuck into the floor), dim, with light leaking down from its tip
      $map = '..MD.','.LMDD','.LMMD','.LLMD','.LLMD','.WLM.','..W..'
      $cx=[math]::Max(3,[math]::Min(43,$vx)); $y0=[math]::Max(0,[math]::Min(24,$vy-3))
      for($j=0;$j -lt 7;$j++){ for($i=0;$i -lt 5;$i++){ $k=[string]$map[$j][$i]; if($k -ceq '.'){continue}; $y=$y0+$j; if($y -lt 31){ $m[($cx-2+$i),$y]=$pal[$k] } } }
      if($y0+8 -lt 31){ $extra += ,@($cx,($y0+8),$pal['W']) } } }
  $o = Outline $m
  foreach($e in $extra){ $o[$e[0],$e[1]]=$e[2] }
  if($kind -eq 'p'){ foreach($s in @(@(15,3),@(31,27),@(6,19))){ foreach($d in @(@(0,0),@(1,0),@(-1,0),@(0,1),@(0,-1))){ $o[($s[0]+$d[0]),($s[1]+$d[1])]=$pal['W'] } } }
  Save $o $name }
$lit = @{ W=(C '#eafff2'); L=(C '#8dffb4'); M=(C '#46d880'); D=(C '#1f8a52') }
$dim = @{ W=(C '#6ff0a0'); L=(C '#2f8a5c'); M=(C '#1f6044'); D=(C '#123a30') }
$offP = @{ W=(C '#c9cede'); L=(C '#98a0b8'); M=(C '#6d7690'); D=(C '#4a536c') }
$offM = @{ W=(C '#98a0b8'); L=(C '#6d7690'); M=(C '#4a536c'); D=(C '#343c55') }
Make 'p' $lit 'cry_cell_p'; Make 'p' $offP 'cry_cell_p_off'; Make 'm' $dim 'cry_cell_m'; Make 'm' $offM 'cry_cell_m_off'
# preview on the cave floor: alone / on a carpet, minus and plus, then off
$pad = Get-ChildItem img\p\pad_*.png | Select-Object -First 1
$pv=New-Object System.Drawing.Bitmap 1200,560; $g=[System.Drawing.Graphics]::FromImage($pv); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$bg=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_cave.png')); $g.DrawImage($bg,(New-Object System.Drawing.Rectangle 0,0,1200,560),(New-Object System.Drawing.Rectangle 60,250,300,140),[System.Drawing.GraphicsUnit]::Pixel)
$padB=New-Object System.Drawing.Bitmap $pad.FullName
$col=0; foreach($n in 'cry_cell_m','cry_cell_p','cry_cell_m_off','cry_cell_p_off'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\cavecorner\$n.png")); $x=20+$col*295
  $g.DrawImage($im,$x,60,282,186); $g.DrawImage($padB,$x,320,282,186); $g.DrawImage($im,$x,320,282,186); $col++ }
$pv.Save([IO.Path]::GetFullPath('img\codex\cavecorner\compare.png')); "carpet used: $($pad.Name)"
