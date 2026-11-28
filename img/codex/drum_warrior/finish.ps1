# pink fringe on attack-frame edges -> outline, then install into img/p
Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/anim.png").Path); $o=[Drawing.Bitmap]::new($s); $n=0
for($y=1;$y -lt 63;$y++){for($x=257;$x -lt 511;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.R -gt 90 -and $c.B -gt 90 -and $c.G -lt 40){
  if(-not ($s.GetPixel($x-1,$y).A -and $s.GetPixel($x+1,$y).A -and $s.GetPixel($x,$y-1).A -and $s.GetPixel($x,$y+1).A)){ $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#461205')); $n++ } }}}
"fringe $n"
$s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/anim.png"))
$o.Save((Join-Path (Get-Location) 'img/p/drum_anim.png'))
$o.Clone([Drawing.Rectangle]::new(384,0,64,64),$o.PixelFormat).Save((Join-Path (Get-Location) 'img/p/drum_atk.png'))
Copy-Item "$d/still.png" img/p/drum.png -Force
