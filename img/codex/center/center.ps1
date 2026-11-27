param([string]$Fit)
Add-Type -AssemblyName System.Drawing
# sample: main picture full size in the middle, small mark laid over the bottom-right corner
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
New-Item -ItemType Directory -Force img\codex\center | Out-Null
& $Fit -Sheet 'img\codex\herograde\raw.png' -Names 'hero' -OutDir 'img\codex\center\base22' -Gap 30 -Size 22
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'r #f41410','R #fa7274','d #b40808','c #5fe8ff','L #b6f5bd','M #5fcf6a','D #2e8f3a'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$heart = '.rr...rr.','rRRr.rrrr','rRrrrrrrd','rrrrrrrdd','.rrrrrdd.','..rrrdd..','...rdd...','....d....'
$reset = '..cccc..c','.cccccccc','cc....ccc','cc...cccc','cc.......','cc.....cc','.cc...cc.','..ccccc..'
$arrow = '....L....','...LLM...','..LLMMM..','.LLMMMMM.','LLMMMMMDD','..LMMMD..','..LMMMD..','..MDDDD..'
function Compose($file, $m, $out){
  $src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file))
  $o = New-Object System.Drawing.Bitmap $src   # base stays where upfit centred it
  $h=$m.Count; $w=$m[0].Length; $ox=23-$w; $oy=23-$h
  function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
    if($near){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C $pal[[string]$m[$j][$i]])) } } }
  $o.Save([IO.Path]::GetFullPath($out)) }
Compose 'img\codex\upicon3\base22\up_helmet.png' $heart 'img\codex\center\up_g_hp.png'
Compose 'img\codex\upicon3\base22\up_stall.png' $reset 'img\codex\center\up_shopReset.png'
Compose 'img\codex\center\base22\up_hero.png' $arrow 'img\codex\center\up_hg2.png'
$ids = 'g_hp','shopReset','hg2'
$z=4; $t=62*$z; $s = New-Object System.Drawing.Bitmap (3*$t+16), (2*$t+16+90); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($file,$px,$py,$k,$b){
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
  $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file)); $g.DrawImage($im,[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)); $im.Dispose() }
$i=0; foreach($id in $ids){ Tile "img\p\up_$id.png" (16+$i*$t) 16 $z $false; Tile "img\codex\center\up_$id.png" (16+$i*$t) (16+$t) $z $true
  Tile "img\p\up_$id.png" (16+$i*160) (2*$t+24) 1.333 $false; Tile "img\codex\center\up_$id.png" (16+$i*160+78) (2*$t+24) 1.333 $true; $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\center\compare.png'))
