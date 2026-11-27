# golem rage icon, stage 1 (crystal): the art grid of raw2.png (24x26) with flat rows/columns removed to fit inside 24x24
Add-Type -AssemblyName System.Drawing
$src = @(
 '...........oo...........','..........oWoo..........','.........oWWcoo.........','........oWWcccco........','........oWccccco........',
 '....o...occcccdo..oo....','...ocoo.occccmdo.odco...','..occWo.occmmmdooccWco..','..ocWccoccmmmmmdocWcco..','..occcmocmmmmmddoccmmo..',
 '.ooccmmoommmmmdoocmmmoo.','.omoommmommmmddmmmmmomo.','.odccccmmommddommccccdo.','.odddmmccccddccccmmdddo.','..oddmmmmccooccmmmmddo..',
 '..oddoommmmccmmmmooddo..','.ooooeeeommcmmdoeeooooo.','oocccooeeooddooeeoocccoo','occcmmmooommmmooommmccco','occmmmmommmmmmmmommmmcco',
 'oommmmodmddddddmmommmmoo','.odmmmdmmddddddmmdmmmdo.','..ooddddddddddddddddoo..','....ooddddddddddddoo....','.....ooddddddddddoo.....','.......oooooooooo.......')
$dropRow = 4,19,23; $dropCol = 4,19
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #401800','W #F8FCFF','c #6CC4FC','m #087CFC','d #0044D2','e #FFF800'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$b=New-Object System.Drawing.Bitmap 24,24; $y=0
for($j=0;$j -lt $src.Count;$j++){ if($dropRow -contains $j){continue}; $x=1
  for($i=0;$i -lt 24;$i++){ if($dropCol -contains $i){continue}; $k=[string]$src[$j][$i]; if($k -cne '.'){ $b.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml($pal[$k])) }; $x++ }; $y++ }
$b.Save([IO.Path]::GetFullPath('img\codex\golemfoe\ui_golemfoe1.png'))
