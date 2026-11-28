# approved face with goblin skin and purple eyes
Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
$src=[Drawing.Bitmap]::new((Resolve-Path "$d/b.png").Path); $skin=$src.GetPixel(37,41); $shade=[Drawing.Color]::FromArgb(255,[int]($skin.R*0.7),[int]($skin.G*0.75),[int]($skin.B*0.6))
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/b.png" -Out "$d/tmp.png" -LeftEye '32,38' -Iris '#4a1e62,#8a44b0'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $o=[Drawing.Bitmap]::new($s)
for($y=32;$y -le 43;$y++){for($x=28;$x -le 43;$x++){ $c=$s.GetPixel($x,$y); if(-not $c.A -or $c.ToArgb() -eq $src.GetPixel($x,$y).ToArgb()){continue}
  if($c.R -gt 230 -and $c.G -gt 180 -and $c.G -lt 230 -and $c.B -lt 190){ $o.SetPixel($x,$y,$skin) }
  elseif($c.R -gt 230 -and $c.G -ge 150 -and $c.G -le 180){ $o.SetPixel($x,$y,$shade) }
  elseif($c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 150){ $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml($(if($c.R -lt 160){'#5c2878'}else{'#7a3a9c'}))) } } }
$o.Save((Join-Path (Get-Location) "$d/b_face.png")); $s.Dispose(); Remove-Item "$d/tmp.png"
