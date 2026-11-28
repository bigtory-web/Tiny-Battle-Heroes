Add-Type -AssemblyName System.Drawing
foreach ($k in 'e_brave') { $s=[Drawing.Bitmap]::new((Resolve-Path "img/codex/gate_archer/${k}.png").Path); $o=[Drawing.Bitmap]::new(512,512); $g=[Drawing.Graphics]::FromImage($o)
 $g.Clear([Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,512,512); $o.Save((Join-Path (Get-Location) "img/codex/gate_archer/${k}_x8.png")); $s.Dispose() }
