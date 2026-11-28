# conch body: skin-like peach -> gray (3 tones). Face, fingers and the red lip stay.
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$rows=@{42=@(46,48);43=@(43,48);44=@(41,46);45=@(38,46);46=@(36,46);47=@(33,45);48=@(33,45);49=@(34,45);50=@(42,45);51=@(44,46)}
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/still_peach.png").Path); $o=[Drawing.Bitmap]::new($s); $n=0
foreach($y in $rows.Keys){ for($x=$rows[$y][0];$x -le $rows[$y][1];$x++){ $c=$s.GetPixel($x,$y)
  if($c.A -and $c.R -gt 230 -and $c.G -gt 100 -and $c.B -lt 200){
    $h= if($c.G -lt 170){'7c8394'} elseif($c.G -lt 205 -or $y -ge 49){'9aa2b2'} else {'c6ccd8'}
    $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml("#$h")); $n++ } } }
"gray $n"; $s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/still.png"))
