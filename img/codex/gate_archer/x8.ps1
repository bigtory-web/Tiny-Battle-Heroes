Add-Type -AssemblyName System.Drawing
foreach ($n in 'gate','knight','flame') {
  $s=[Drawing.Bitmap]::new((Resolve-Path "img/p/$n.png").Path); $o=[Drawing.Bitmap]::new($s.Width*8,$s.Height*8); $g=[Drawing.Graphics]::FromImage($o)
  $g.Clear([Drawing.Color]::Magenta); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'; $g.DrawImage($s,0,0,$o.Width,$o.Height)
  $o.Save((Join-Path (Get-Location) "img/codex/gate_archer/${n}_x8.png")); $s.Dispose() }
