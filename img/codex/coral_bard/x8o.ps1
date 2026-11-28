Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
foreach($k in 'o1','o2','o3'){ $s=[Drawing.Bitmap]::new((Resolve-Path "$d/$k.png").Path); $o=[Drawing.Bitmap]::new(512,512); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,512,512); $o.Save((Join-Path (Get-Location) "$d/${k}_x8.png")); $s.Dispose() }
