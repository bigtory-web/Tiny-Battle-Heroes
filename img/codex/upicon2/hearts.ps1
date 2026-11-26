Add-Type -AssemblyName System.Drawing
# three separate hearts filling the 24px square, colours and outline taken from the set
$small = '.xx...xx.','xxxx.xxxx','xxxxxxxxx','xxxxxxxxx','.xxxxxxx.','..xxxxx..','...xxx...','....x....'
$big = '..xx....xx..','.xxxx..xxxx.','xxxxxxxxxxxx','xxxxxxxxxxxx','xxxxxxxxxxxx','.xxxxxxxxxx.','..xxxxxxxx..','...xxxxxx...','....xxxx....','.....xx.....'
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$b = New-Object System.Drawing.Bitmap 24,24
function Heart($m,$x,$y){ $h=$m.Count; $w=$m[0].Length
  function On($i,$j){ $j -ge 0 -and $j -lt $h -and $i -ge 0 -and $i -lt $w -and $m[$j][$i] -eq 'x' }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){
    foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ if(-not (On ($i+$d[0]) ($j+$d[1]))){ $b.SetPixel($x+$i+$d[0],$y+$j+$d[1],(C '#2e0c06')) } } } } }
  for($j=0;$j -lt $h;$j++){ for($i=0;$i -lt $w;$i++){ if(On $i $j){
    $shade = $j -ge 2 -and (-not (On ($i+2) $j) -or -not (On $i ($j+2)))
    $b.SetPixel($x+$i,$y+$j,(C $(if($shade){'#b40808'}else{'#f41410'}))) } } }
  foreach($p in @(@(1,1),@(2,1),@(1,2),@(2,2))){ $b.SetPixel($x+$p[0],$y+$p[1],(C '#fa7274')) } }
Heart $small 1 2
Heart $small 14 2
Heart $big 6 13
$b.Save([IO.Path]::GetFullPath('img\codex\upicon2\up_t_hp.png'))
