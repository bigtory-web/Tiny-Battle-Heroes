Add-Type -AssemblyName System.Drawing
foreach ($n in 'shaman','flame') { $s=[Drawing.Bitmap]::new((Resolve-Path "img/p/$n.png").Path); $o=[Drawing.Bitmap]::new(512,512); $g=[Drawing.Graphics]::FromImage($o)
 $g.Clear([Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,$s.Width*8,$s.Height*8); $o.Save((Join-Path (Get-Location) "img/codex/shaman_archer/${n}_x8.png")); $s.Dispose() }
