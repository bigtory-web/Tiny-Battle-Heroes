# golem rage icon, stage 1: the art grid of raw.png (24x26) with flat rows/columns removed to fit 22x22 inside 24x24
Add-Type -AssemblyName System.Drawing
$src = @(
 '...........o............','..........ocoo..........','.........occbbo.........','......ooooccbboooo......','......oqqocbbboqqo......',
 '....ooqqppobboppqqoo....','...oqqqppppopppppqqqo...','..oqqpppppoopppppppqqo..','..opppppppoppppppppppo..','..oppppppopppppppppppo..',
 '.oooqqqoooppppoooqqqooo.','.oqqqppqqooppooqqppqqqo.','.opppppppqoppoqpppppppo.','.oorpppppppopppppppproo.','..orrooopppoppppooorro..',
 '..oooeeeoppppppoeeeooo..','.ooqooEEeeoppoeeEEooqoo.','oqqpppooooppppoooopppqoo','oppppppoppppppppopppppqo','oppppppoppppppppoppppppo',
 'opppppopprrrrrrppopppppo','.oppporrrrrrrrrrrropppo.','.oorrorrrrrrrrrrrrorroo.','..oooorrrrrrrrrrrroooo..','.....oorrrrrrrrrroo.....','......oooooooooooo......')
$dropRow = 9,13,19,22; $dropCol = 5,18
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #3F1A00','q #A6B0BE','p #6C7482','r #4A515C','b #0864F4','c #4AA0FC','e #FFB406','E #FFFA00'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$b=New-Object System.Drawing.Bitmap 24,24; $y=1
for($j=0;$j -lt $src.Count;$j++){ if($dropRow -contains $j){continue}; $x=1
  for($i=0;$i -lt 24;$i++){ if($dropCol -contains $i){continue}; $k=[string]$src[$j][$i]; if($k -cne '.'){ $b.SetPixel($x,$y,[System.Drawing.ColorTranslator]::FromHtml($pal[$k])) }; $x++ }; $y++ }
$b.Save([IO.Path]::GetFullPath('img\codex\golemfoe\ui_golemfoe1.png'))
