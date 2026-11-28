# final still: pale-green leftovers on the blades -> steel white, then the approved face with red eyes
Add-Type -AssemblyName System.Drawing
$d='img/codex/imp_assassin'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/c_steel.png").Path); $o=[Drawing.Bitmap]::new($s); $n=0
for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){$c=$s.GetPixel($x,$y); if($c.A -and $c.G -gt $c.R+8 -and $c.G -gt 200){$o.SetPixel($x,$y,[Drawing.ColorTranslator]::FromHtml('#f4f8ff')); $n++}}}
"green fixed $n"; $o.Save((Join-Path (Get-Location) "$d/pre.png")); $s.Dispose()
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/pre.png" -Out "$d/still.png" -LeftEye '34,38' -Iris '#a00c10,#e82418'
