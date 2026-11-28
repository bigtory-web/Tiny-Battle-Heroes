# sleepy face template := the approved "eyes up 1" shape (brow, then 2 eye rows)
Add-Type -AssemblyName System.Drawing
$p=(Resolve-Path .claude/skills/game-art-hero/references/face/face_sleepy.png).Path
$s=[Drawing.Bitmap]::new($p); $o=[Drawing.Bitmap]::new($s); $s.Dispose()
$skin=$o.GetPixel(5,3); $line=$o.GetPixel(8,2)
function C($h){[Drawing.ColorTranslator]::FromHtml("#$h")}
$w=C 'fcfcfa'; $dk=C '782e07'; $lt=C 'd67d0e'
foreach($x in 2,3,4){ $o.SetPixel($x,2,$line) }
$o.SetPixel(2,3,$w); $o.SetPixel(2,4,$w); foreach($x in 3,4){ $o.SetPixel($x,3,$dk); $o.SetPixel($x,4,$lt) }
foreach($x in 8,9,10){ $o.SetPixel($x,1,$line) }
$o.SetPixel(10,2,$w); $o.SetPixel(10,3,$w); foreach($x in 8,9){ $o.SetPixel($x,2,$dk); $o.SetPixel($x,3,$lt) }
foreach($x in 8,9,10){ $o.SetPixel($x,4,$skin) }
$o.Save($p); $o.Dispose()
# check: stamping the new template on e.png must match the approved up1.png eyes
$d='img/codex/shaman_archer'
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target "$d/e.png" -Out "$d/still.png" -LeftEye '34,36' -Style sleepy -Iris '#4c3e40,#8a7470'
$a=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path); $b=[Drawing.Bitmap]::new((Resolve-Path "$d/up1.png").Path)
$diff=@(); for($y=34;$y -le 39;$y++){for($x=34;$x -le 42;$x++){$p1=$a.GetPixel($x,$y); $p2=$b.GetPixel($x,$y); if([math]::Abs($p1.R-$p2.R)+[math]::Abs($p1.G-$p2.G)+[math]::Abs($p1.B-$p2.B) -gt 20){$diff+="$x,$y"}}}
"eye diff: $($diff.Count) $($diff -join ' ')"
$a.Dispose(); Copy-Item "$d/up1.png" "$d/still.png" -Force
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path); $o=[Drawing.Bitmap]::new(512,512); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::White); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,512,512); $o.Save((Join-Path (Get-Location) "$d/still_x8.png"))
