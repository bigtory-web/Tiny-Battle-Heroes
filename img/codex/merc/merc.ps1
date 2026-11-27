param([string]$Fit)
Add-Type -AssemblyName System.Drawing
# joining hero (wandering sellsword): picture full size in the middle, mark over the bottom-right (new layout)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
& $Fit -Sheet 'img\codex\merc\raw.png' -Names 'merc' -OutDir 'img\codex\merc\base22' -Gap 30 -Size 22
$arrow = '....L....','...LLM...','..LLMMM..','.LLMMMMM.','LLMMMMMDD','..LMMMD..','..LMMMD..','..MDDDD..'
$down  = '..LMMMD..','..LMMMD..','..LMMMD..','LLMMMMMDD','.LMMMMMD.','..MMMDD..','...MDD...','....D....'
$col = @{ cost=@('#ff9a8a','#ff4a3c','#b81a12'); g2=@('#b6f5bd','#5fcf6a','#2e8f3a'); g3=@('#b9dcff','#4fa3ff','#2563b0'); g4=@('#ffe6b0','#ffb02e','#c06a08') }
function Compose($m, $c, $out){
  $src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\merc\base22\up_merc.png'))
  $o = New-Object System.Drawing.Bitmap $src
  $h=$m.Count; $w=$m[0].Length; $ox=23-$w; $oy=23-$h
  function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -ne [char]'.' }
  for($j=-1;$j -le $h;$j++){ for($i=-1;$i -le $w;$i++){ if(On $i $j){continue}; $near=$false; foreach($dx in -1,0,1){ foreach($dy in -1,0,1){ if(On ($i+$dx) ($j+$dy)){ $near=$true } } }
    if($near){ $o.SetPixel($ox+$i,$oy+$j,(C '#2e0c06')) } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){ $o.SetPixel($ox+$i,$oy+$j,(C $c['LMD'.IndexOf([string]$m[$j][$i])])) } } }
  $o.Save([IO.Path]::GetFullPath($out)) }
Compose $down $col.cost 'img\codex\merc\up_mercCost.png'
foreach($g in 2,3,4){ Compose $arrow $col["g$g"] "img\codex\merc\up_rg$g.png" }
$pairs = @('grollCost','mercCost'),@('hg2','rg2'),@('hg3','rg3'),@('hg4','rg4')
$z=3; $t=62*$z; $s = New-Object System.Drawing.Bitmap (4*$t+16), (2*$t+16+90); $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#221e2b')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
function Tile($file,$px,$py,$k,$b){
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#ffd34d'}else{'#ffffff'}))),[int]$px,[int]$py,[int](56*$k),[int](56*$k))
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C $(if($b){'#5b3a8c'}else{'#0c0a10'}))),[int]($px+2*$k),[int]($py+2*$k),[int](52*$k),[int](52*$k))
  $im = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($file)); $g.DrawImage($im,[int]($px+10*$k),[int]($py+10*$k),[int](36*$k),[int](36*$k)); $im.Dispose() }
$i=0; foreach($pr in $pairs){ Tile "img\p\up_$($pr[0]).png" (16+$i*$t) 16 $z $false; Tile "img\codex\merc\up_$($pr[1]).png" (16+$i*$t) (16+$t) $z $true
  Tile "img\codex\merc\up_$($pr[1]).png" (16+$i*80) (2*$t+24) 1.333 $true; $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\merc\compare.png'))
