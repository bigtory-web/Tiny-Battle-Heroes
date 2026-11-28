# lighten the muted purple a little, then the approved face (goblin skin, purple eyes)
Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
foreach($e in @(@('h1',32,37),@('h2',33,38),@('h3',32,38),@('h4',32,38))){ $k,$x0,$y0=$e
 $in=[Drawing.Bitmap]::new((Resolve-Path "$d/$k.png").Path); $src=[Drawing.Bitmap]::new($in)
 for($y=0;$y -lt 46;$y++){for($x=0;$x -lt 46;$x++){$c=$in.GetPixel($x,$y); if($c.A -and $c.B -gt $c.G+30 -and $c.R -gt $c.G+10 -and $c.R -gt 55){ $src.SetPixel($x,$y,[Drawing.Color]::FromArgb(255,[math]::Min(255,[int]($c.R*1.22+8)),[math]::Min(255,[int]($c.G*1.15+6)),[math]::Min(255,[int]($c.B*1.22+10)))) }}}
 $in.Dispose(); $src.Save((Join-Path (Get-Location) "$d/pre.png"))
 $skin=$src.GetPixel($x0+4,$y0+3)
 $shade=[Drawing.Color]::FromArgb(255,[int]($skin.R*0.7),[int]($skin.G*0.75),[int]($skin.B*0.6))
 & .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/pre.png" -Out "$d/tmp.png" -LeftEye "$x0,$y0" -Iris '#4a1e62,#8a44b0'
 $s=[Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $o=[Drawing.Bitmap]::new($s)
 for($y=$y0-6;$y -le $y0+6;$y++){for($x=$x0-4;$x -le $x0+11;$x++){ $c=$s.GetPixel($x,$y); if(-not $c.A -or $c.ToArgb() -eq $src.GetPixel($x,$y).ToArgb()){continue}
   if($c.R -gt 230 -and $c.G -gt 180 -and $c.G -lt 230 -and $c.B -lt 190){ $o.SetPixel($x,$y,$skin) }
   elseif($c.R -gt 230 -and $c.G -ge 150 -and $c.G -le 180){ $o.SetPixel($x,$y,$shade) }
   elseif($c.B -lt 30 -and $c.R -gt 100 -and $c.G -gt 40 -and $c.G -lt 150){ $o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml($(if($c.R -lt 160){'#5c2878'}else{'#7a3a9c'}))) } } }
 "$k skin $($skin.R),$($skin.G),$($skin.B)"
 $o.Save((Join-Path (Get-Location) "$d/${k}_f.png")); $s.Dispose(); $src.Dispose() }
Remove-Item "$d/tmp.png","$d/pre.png"
