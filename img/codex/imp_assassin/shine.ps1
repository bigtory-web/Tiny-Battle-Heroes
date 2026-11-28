# third (light) hair tone: a band one pixel inside the upper-left edge of each spike
Add-Type -AssemblyName System.Drawing
$d='img/codex/imp_assassin'
$light=[Drawing.ColorTranslator]::FromHtml('#ff6a44')
function Hair($c){ $c.A -and $c.R -gt 200 -and $c.G -ge 30 -and $c.G -le 65 -and [math]::Abs($c.G-$c.B) -le 14 }
function Edge($c){ (-not $c.A) -or $c.R -lt 120 }
foreach($k in 'a','b'){ $s=[Drawing.Bitmap]::new((Resolve-Path "$d/$k.png").Path); $o=[Drawing.Bitmap]::new($s); $n=0
 for($y=20;$y -le 38;$y++){for($x=10;$x -le 37;$x++){ if((Hair $s.GetPixel($x,$y)) -and (Hair $s.GetPixel($x,$y-1)) -and (Edge $s.GetPixel($x,$y-2))){ $o.SetPixel($x,$y,$light); if(Hair $s.GetPixel($x+1,$y)){$o.SetPixel($x+1,$y,$light)}; $n++ } }}
 "$k light $n"; $o.Save((Join-Path (Get-Location) "$d/${k}2.png")); $s.Dispose() }
