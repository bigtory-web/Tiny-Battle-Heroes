Add-Type -AssemblyName System.Drawing
# all marked upgrade icons: main picture centred at full size, mark laid over the bottom-right corner
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$out='img\codex\center\all'; New-Item -ItemType Directory -Force $out | Out-Null
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'r #f41410','R #fa7274','d #b40808','w #f4f4f8','s #aab0c0','y #ffcb2a','Y #fff06a','b #8a4a1c','B #3f86e8','n #1f4fb0','c #5fe8ff','g #5ee04a','h #2e9c22','f #f8c890','q #c8860e'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$badge = @{
 heart = '.rr...rr.','rRRr.rrrr','rRrrrrrrd','rrrrrrrdd','.rrrrrdd.','..rrrdd..','...rdd...','....d....'
 sword = '......www','.....wwws','....wwws.','y..wwws..','yywwws...','.yyws....','.byyy....','bbb.yy...','bb.......'
 shield= 'yyyyyyyyy','yBBByBBny','yBBByBBny','yyyyyyyyy','yBBByBBny','yBBByBBny','.yBByBny.','..yByny..','...yyy...'
 bolt  = '....YYY','...YYy.','..YYy..','.YYYYYy','....Yy.','...Yy..','..Yy...','.Yy....','.y.....'
 reset = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
 up    = '....g....','...ggg...','..ggggh..','.gggggghh','ggggggghh','...ggh...','...ggh...','...ggh...','...ggh...'
 person= '...fff...','..fffff..','..fffff..','...fff...','.........','..BBBBn..','.BBBBBBn.','BBBBBBBnn','BBBBBBBnn'
 floor = '....y....','...yyy...','..yyyyy..','.yyyyyyy.','...yyq...','...yyq...','.........','wwwwwwwww','sssssssss'
 lv    = 'YY....YY.YY','yy....yy.yy','yy....yy.yy','yy....yy.yy','yy....yy.yy','yyyyy..yyy.','yyyyy...y..' }
# arrows drawn with L/M/D and coloured per use
$arrowUp = '....L....','...LLM...','..LLMMM..','.LLMMMMM.','LLMMMMMDD','..LMMMD..','..LMMMD..','..MDDDD..'
$arrowDn = '..LMMMD..','..LMMMD..','..LMMMD..','LLMMMMMDD','.LMMMMMD.','..MMMDD..','...MDD...','....D....'
$tier = @{ cost=@('#ff9a8a','#ff4a3c','#b81a12'); 2=@('#b6f5bd','#5fcf6a','#2e8f3a'); 3=@('#b9dcff','#4fa3ff','#2563b0'); 4=@('#ffe6b0','#ffb02e','#c06a08') }
$crown = 'Y...Y...Y','yy.yYy.yy','yyyyyyyyy','yryyByyry','qqqqqqqqq'
function Load($p){ New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)) }
function Base($n){ if($n -eq 'hero'){ Load 'img\codex\center\base22\up_hero.png' } else { Load "img\codex\upicon3\base22\up_$n.png" } }
# draw a pixel map with a 1px dark outline at (ox,oy)
function Stamp($b,$m,$ox,$oy,$cols){ $h=$m.Count; $w=$m[0].Length
  function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
    $px=$ox+$i; $py=$oy+$j; if($near -and $px -ge 0 -and $py -ge 0 -and $px -lt 24 -and $py -lt 24){ $b.SetPixel($px,$py,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $ch=[string]$m[$j][$i]; $hex = if($cols){ $cols['LMD'.IndexOf($ch)] } else { $pal[$ch] }; $b.SetPixel($ox+$i,$oy+$j,(C $hex)) } } } }
function Mark($b,$m,$cols){ Stamp $b $m (23-$m[0].Length) (23-$m.Count) $cols; return }
function Save($b,$id){ $b.Save([IO.Path]::GetFullPath("$out\up_$id.png")) }
$n=0
# picture + mark
$plain = 'shopReset:stall+reset','merchHero:mgirl+person','shopGrade:gem+up','lootReset:roulette+reset','lootGrade:chesto+up','campfire:start+person','eventReset:start+reset','fairyReset:fairy+reset','daisReset:carpet+reset',
  'g_hp:helmet+heart','g_def:helmet+shield','w_atk:axe+sword','w_hp:axe+heart','a_atk:hood+sword','a_crit:hood+bolt','r_atk:bow+sword','r_crit:bow+bolt','m_atk:hat+sword','m_hp:hat+heart','b_hp:lute+heart','b_def:lute+shield',
  'heroGrade:hero+up','heroLv:hero+lv','grollGrade:gobcoin+up','merchHeroGrade:mgirl+up'
foreach($item in $plain){ $id,$spec = $item -split ':'; $base,$bd = $spec -split '\+'
  $o = New-Object System.Drawing.Bitmap (Base $base); Mark $o $badge[$bd] $null; Save $o $id; $n++ }
$o = New-Object System.Drawing.Bitmap (Base 'gobcoin'); Mark $o $arrowDn $tier.cost; Save $o 'grollCost'; $n++
# grade chance nodes
$br = [ordered]@{ hg='hero'; mg='mgirl'; sg='gem'; lg='chesto'; gg='gobcoin' }
foreach($k in $br.Keys){ foreach($g in 2,3,4){ $o = New-Object System.Drawing.Bitmap (Base $br[$k]); Mark $o $arrowUp $tier[$g]; Save $o "$k$g"; $n++ } }
# merchant minimum discount: green tag
$src = Base 'tag'; $o = New-Object System.Drawing.Bitmap $src
for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$o.GetPixel($x,$y); if(-not $c.A){continue}
  if(($c.R - $c.G) -gt 60 -and ($c.G -lt 60 -or ($c.G -lt 150 -and $c.B -gt 70))){ $o.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(255,[int]($c.G*0.6),[int]($c.R*0.72),[int]($c.B*0.5+10))) } } }
Mark $o $badge.floor $null; Save $o 'merchOffMin'; $n++
# blue / crown mimic
function Mimic($ramp,$king){ $src = Base 'mimicbox'
  $top=24;$bot=0; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($y -lt $top){$top=$y}; if($y -gt $bot){$bot=$y} } } }
  $dy = if($king){ [math]::Min(23-$bot, [math]::Max(0, 4-$top)) } else { 0 }
  $o = New-Object System.Drawing.Bitmap 24,24
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if(-not $c.A -or $y+$dy -gt 23){continue}
    if($c.R -gt 70 -and $c.G -gt $c.R*0.24 -and $c.G -lt $c.R*0.72 -and $c.B -lt $c.G*0.7){ $k = if($c.R -ge 185){0}elseif($c.R -ge 145){1}elseif($c.R -ge 105){2}else{3}; $c = C $ramp[$k] }
    $o.SetPixel($x,$y+$dy,$c) } }
  if($king){ Stamp $o $crown 7 1 $null }
  Mark $o $badge.up $null; return $o }
Save (Mimic @('#8cc0ff','#4f86e0','#33609f','#24457a') $false) 'mBlueUp'; $n++
Save (Mimic @('#cf94ff','#9a52e0','#6e2cb4','#4a1c80') $true) 'mKingUp'; $n++
"made $n"
# before/after sheet: 4 pairs per row, each pair = old tile + new tile
$ids = Get-ChildItem $out -Filter up_*.png | ForEach-Object { $_.BaseName.Substring(3) }
$z=1.5; $t=[int](58*$z); $cols=6; $pw=2*$t+18; $rows=[math]::Ceiling($ids.Count/$cols)
$s = New-Object System.Drawing.Bitmap ($cols*$pw+12), ($rows*($t+8)+12); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($file,$px,$py,$b){
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$z),[int](56*$z))
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$z),[int]($py+2*$z),[int](52*$z),[int](52*$z))
  $im = Load $file; $g.DrawImage($im,[int]($px+10*$z),[int]($py+10*$z),[int](36*$z),[int](36*$z)); $im.Dispose() }
$i=0; foreach($id in $ids){ $x=12+($i % $cols)*$pw; $y=12+[math]::Floor($i/$cols)*($t+8); Tile "img\p\up_$id.png" $x $y $false; Tile "$out\up_$id.png" ($x+$t) $y $true; $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\center\all_compare.png'))
