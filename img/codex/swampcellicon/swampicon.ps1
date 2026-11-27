Add-Type -AssemblyName System.Drawing
# 24px swamp-tile icon, redrawn on a true grid from the Codex draft (its blocks were ~27 wide, shrinking broke the reeds)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #3f1000','M #e08c48','m #b5622a','d #8e4210','w #046954','s #03503f','h #17b49a','b #4ee6c8','g #86a504','G #c8e022','k #073c1c','C #f09a50','c #a84404','t #a8c404'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$rows = @(
 '........................',
 '........................',
 '........................',
 '........................',
 '........................',
 '.......oooooooooo.......',
 '.....ooMMMMMMMMMMoo.....',
 '...ooMMwwwwwwwwwwmmoo...',
 '..oMMwwwwwwwhhhwwwwmmo..',
 '.oMwwwwwwwwwwwwwwwwwwmo.',
 '.oMwwwwwwwwwwkkkkkwwwmo.',
 '.omwwwwwwwwwkGGgggkwwdo.',
 '.omwwwwwwwwwkGgggkkwwdo.',
 '.omwhhhhhhhwwkgggggksdo.',
 '.omwwwhhhwwwwwkkkkkssdo.',
 '.odwwwwwwwbwwwwwwwsssdo.',
 '..oddwwwwwwwwwwwwssddo..',
 '....oddwwwwbbwwssddo....',
 '......oddwwwwssddo......',
 '........oddwsddo........',
 '..........oddo..........',
 '...........oo...........',
 '........................',
 '........................')
$b = New-Object System.Drawing.Bitmap 24,24
for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $k=[string]$rows[$y][$x]; if($k -ne '.'){ $b.SetPixel($x,$y,(C $pal[$k])) } } }
function Put($x,$y,$k){ $b.SetPixel($x,$y,(C $pal[$k])) }
function Reed($x,$top,$foot){
  for($y=$top+6;$y -le $foot;$y++){ Put ($x-1) $y 'k'; Put $x $y 't'; Put ($x+1) $y 'k' }
  Put $x $top 'o'; Put ($x+1) $top 'o'
  for($y=$top+1;$y -le $top+5;$y++){ Put ($x-1) $y 'o'; Put $x $y 'C'; Put ($x+1) $y 'c'; Put ($x+2) $y 'o' }
  Put $x ($top+6) 'o'; Put ($x+1) ($top+6) 'o' }
Reed 5 1 12
Reed 9 4 12
$b.Save([IO.Path]::GetFullPath('img\codex\swampcellicon\ui_swampcell.png'))
