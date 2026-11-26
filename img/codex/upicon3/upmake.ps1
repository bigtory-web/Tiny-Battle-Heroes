param([string]$Fit)
# build the 31 icons: fitted base art + optional hand-drawn badge in the bottom-right corner
Add-Type -AssemblyName System.Drawing
$w = 'img\codex\upicon3'
$sheets = @{
  A = 'relic,potion,bundle,frogpot,mgirl,tag,gem,heart,flag,roulette'
  B = 'fairy,carpet,gobcoin,mimicbox,chestc,chesto,helmet,axe,hood,bow'
  C = 'hat,lute,swords' }
foreach($k in $sheets.Keys){ foreach($size in 22,19){ & $Fit -Sheet "$w\sheet_$k.png" -Names $sheets[$k] -OutDir "$w\base$size" -Gap 20 -Size $size } }
# shop stall and campfire come from the approved set (shrunk the same way for badged versions)
foreach($size in 22,19){ & $Fit -Sheet 'img\codex\upicon2\sheet_raw.png' -Names 'start,bag,stall,pouch,hearts' -OutDir "$w\base$size" -Size $size }

$col = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'r #f41410','R #fa7274','d #b40808','w #f4f4f8','s #aab0c0','y #ffcb2a','Y #fff06a','b #8a4a1c','B #3f86e8','n #1f4fb0','c #5fe8ff','g #5ee04a','h #2e9c22','f #f8c890'){ $k,$v=$p -split ' '; $col[$k]=$v }
$badge = @{
 heart = '.rr...rr.','rRRr.rrrr','rRrrrrrrd','rrrrrrrdd','.rrrrrdd.','..rrrdd..','...rdd...','....d....'
 sword = '......www','.....wwws','....wwws.','y..wwws..','yywwws...','.yyws....','.byyy....','bbb.yy...','bb.......'
 shield= 'yyyyyyyyy','yBBByBBny','yBBByBBny','yyyyyyyyy','yBBByBBny','yBBByBBny','.yBByBny.','..yByny..','...yyy...'
 bolt  = '....YYY','...YYy.','..YYy..','.YYYYYy','....Yy.','...Yy..','..Yy...','.Yy....','.y.....'
 reset = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
 up    = '....g....','...ggg...','..ggggh..','.gggggghh'.Substring(0,9),'ggggggghh','...ggh...','...ggh...','...ggh...','...ggh...'
 person= '...fff...','..fffff..','..fffff..','...fff...','.........','..BBBBn..','.BBBBBBn.','BBBBBBBnn','BBBBBBBnn' }
$final = 'relic:relic,potion:potion,shopReset:stall+reset,merchSlot:bundle,swampSlot:frogpot,merchHero:mgirl+person,merchOff:tag,shopGrade:gem+up,life:heart,clearGold:flag,lootReset:roulette+reset,lootGrade:chesto+up,campfire:start+person,eventReset:fairy+reset,daisReset:carpet+reset,groll:gobcoin,mimic:mimicbox,chest:chestc,g_hp:helmet+heart,g_def:helmet+shield,w_atk:axe+sword,w_hp:axe+heart,a_atk:hood+sword,a_crit:hood+bolt,r_atk:bow+sword,r_crit:bow+bolt,m_atk:hat+sword,m_hp:hat+heart,b_hp:lute+heart,b_def:lute+shield,t_atk:swords'
$ink = [System.Drawing.Color]::FromArgb(46,12,6)
New-Item -ItemType Directory -Force "$w\out" | Out-Null
$n=0
foreach($item in $final -split ','){
  $id,$spec = $item -split ':'; $base,$bd = $spec -split '\+'
  $o = New-Object System.Drawing.Bitmap 24,24
  $file = "$w\base" + $(if($bd){19}else{22}) + "\up_$base.png"
  $src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file))
  $dx=0; $dy=0
  if($bd){ # push the base to the top-left corner so the badge covers as little as possible
    $x0=24;$y0=24; for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ if($src.GetPixel($x,$y).A){ if($x -lt $x0){$x0=$x}; if($y -lt $y0){$y0=$y} } } }; $dx=-$x0; $dy=-$y0 }
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $c=$src.GetPixel($x,$y); if($c.A -and $x+$dx -ge 0 -and $y+$dy -ge 0){ $o.SetPixel($x+$dx,$y+$dy,$c) } } }
  $src.Dispose()
  if($bd){ $m=$badge[$bd]; $h=$m.Count; $bw=$m[0].Length; $ox=23-$bw; $oy=23-$h
    $on = { param($i,$j) $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $bw -and $m[$j][$i] -ne [char]'.' }
    for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $bw;$i++){ if(-not (& $on $i $j)){ $near = (& $on ($i+1) $j) -or (& $on ($i-1) $j) -or (& $on $i ($j+1)) -or (& $on $i ($j-1)) -or (& $on ($i+1) ($j+1)) -or (& $on ($i-1) ($j-1)) -or (& $on ($i+1) ($j-1)) -or (& $on ($i-1) ($j+1))
          if($near){ $o.SetPixel($ox+$i,$oy+$j,$ink) } } } }
    for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $bw;$i++){ if(& $on $i $j){ $o.SetPixel($ox+$i,$oy+$j,[System.Drawing.ColorTranslator]::FromHtml($col[[string]$m[$j][$i]])) } } } }
  $o.Save([IO.Path]::GetFullPath("$w\out\up_$id.png")); $n++ }
"made $n icons"

# one sheet: all 36 icons inside upgrade tiles (56 tile, icon at 36), 6 per row, alternating unbought / bought
$all = @('start','bag','shopSlot','startGold','t_hp') + @($final -split ',' | ForEach-Object { ($_ -split ':')[0] })
$z=2; $t=64*$z; $cols=6;
$lab = @(Get-Content "$w\labels.txt" -Encoding UTF8); $font = New-Object System.Drawing.Font('Malgun Gothic', 10); $rows=[math]::Ceiling($all.Count/$cols)
$s = New-Object System.Drawing.Bitmap ($cols*$t+16), ($rows*$t+16); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
for($i=0;$i -lt $all.Count;$i++){ $x=16+($i % $cols)*$t; $y=16+[math]::Floor($i/$cols)*$t; $b = $i % 2 -eq 1
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($(if($b){'#ffd34d'}else{'#ffffff'})))), $x, $y, 56*$z, 56*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($(if($b){'#5b3a8c'}else{'#0c0a10'})))), $x+2*$z, $y+2*$z, 52*$z, 52*$z)
  $p = if($i -lt 5){"img\p\up_$($all[$i]).png"}else{"$w\out\up_$($all[$i]).png"}
  $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $g.DrawImage($im, $x+10*$z, $y+10*$z, 36*$z, 36*$z); $im.Dispose(); $g.DrawString($lab[$i], $font, [System.Drawing.Brushes]::White, [single]($x-2), [single]($y+56*$z+1)) }
$s.Save([IO.Path]::GetFullPath("$w\all36.png"))
