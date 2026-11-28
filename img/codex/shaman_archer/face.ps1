Add-Type -AssemblyName System.Drawing
$d='img/codex/shaman_archer'
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/b.png" -Out "$d/tmp.png" -LeftEye '33,36' -Iris '#4c3e40,#8a7470'
# the template has two more iris shades that -Iris does not remap
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $o=[Drawing.Bitmap]::new($s)
for($y=33;$y -le 41;$y++){for($x=30;$x -le 43;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 130){ $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml($(if($c.R -lt 160){'#5c4a4c'}else{'#7a6462'}))) }}}
$o.Save((Join-Path (Get-Location) "$d/b_face.png")); $s.Dispose(); Remove-Item "$d/tmp.png"
