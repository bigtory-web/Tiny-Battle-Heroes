# golem rage icons: stage 1 blue (approved), 2 purple + fangs, 3 red + side spikes + big jaws; _blink = closed eyes
Add-Type -AssemblyName System.Drawing
$base = @(
 '...........oo...........','..........oWoo..........','.........oWWcoo.........','........oWWcccco........','........occcccdo..o.....','....ooo.occccmdo.odo....',
 '...ocWo.occmmmdooccco...','...occcoccmmmmmdocWco...','...occmocmmmmmddoccmo...','..oocmmoommmmmdoocmmoo..','..omommmommmmddmmmmomo..','..odcccmmommddommcccdo..',
 '..oddmmccccddccccmmddo..','...odmmmmccooccmmmmdo...','...odoommmmccmmmmoodo...','..oooeeeommcmmdoeeeooo..','.ooccooeeooddooeeooccoo.','.occcmmooommmmooommccco.',
 '.oommmodmddddddmmommmoo.','..odmmdmmddddddmmdmmdo..','...ooddddddddddddddoo...','.....ooddddddddddoo.....','.......oooooooooo.......','........................')
function Put($rows,$y,$x,$s){ $rows[$y] = $rows[$y].Substring(0,$x) + $s + $rows[$y].Substring($x+$s.Length) }
function Mirror($s){ $a=$s.ToCharArray(); [array]::Reverse($a); return -join $a }
function Stage($n){
  $r = [string[]]$base.Clone()
  if($n -eq 2){ Put $r 18 6 'oooooooooooo'; Put $r 19 6 'oWWooooooWWo'; Put $r 20 6 'ooWooooooWoo' }
  if($n -eq 3){
    Put $r 17 6 'oooooooooooo'; Put $r 18 6 'oWWoWooWoWWo'; Put $r 19 6 'ooWooooooWoo'; Put $r 20 6 'oooooooooooo'; Put $r 21 6 'oWooWooWooWo'
    $y=5; foreach($s in '.o..','oWo.','ocmo','omcm','.omd','..od'){ Put $r $y 0 $s; Put $r $y 20 (Mirror $s); $y++ } }
  return ,$r }
$pals = @{ 1=@{ W='#F8FCFF'; c='#6CC4FC'; m='#087CFC'; d='#0044D2' }; 2=@{ W='#FBF2FF'; c='#D08CF4'; m='#9A34D8'; d='#5E149C' }; 3=@{ W='#FFF1EC'; c='#FF8A6A'; m='#E8301C'; d='#9C100C' } }
foreach($n in 1,2,3){ foreach($blink in $false,$true){
  $r = Stage $n
  if($blink){ foreach($y in 15,16){ $r[$y] = $r[$y].Replace('e','m') }; Put $r 16 5 'oooo'; Put $r 16 15 'oooo' }
  $b=New-Object System.Drawing.Bitmap 24,24
  for($y=0;$y -lt 24;$y++){ for($x=0;$x -lt 24;$x++){ $k=[string]$r[$y][$x]; if($k -ceq '.'){continue}
    $hex = if($k -ceq 'o'){'#401800'} elseif($k -ceq 'e'){'#FFF800'} else { $pals[$n][$k] }
    if($k -ceq 'W'){ $hex=$pals[$n]['W'] }
    $b.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml($hex)) } }
  $name = "ui_golemfoe$n" + $(if($blink){'_blink'}else{''}) + '.png'
  $b.Save([IO.Path]::GetFullPath("img\codex\golemfoe\$name")); $b.Save([IO.Path]::GetFullPath("img\p\$name")) } }
# preview: stages 1-3, open and blink, next to the other chapters
$o=New-Object System.Drawing.Bitmap 620,830; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#2a2533')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$row=0; foreach($set in @('ui_golemfoe#',''),@('ui_golemfoe#','_blink'),@('ui_foe#',''),@('ui_swampfoe#','')){ $col=0; foreach($n in 1,2,3){ $f = $set[0].Replace('#',"$n") + $set[1]
    $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\p\$f.png")); $g.DrawImage($im,(20+$col*200),(15+$row*205),180,180); $col++ }; $row++ }
$o.Save([IO.Path]::GetFullPath('img\codex\golemfoe\stages.png'))
