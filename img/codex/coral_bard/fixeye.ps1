# the conch outline nibbled the bottom row of the right eye: restore it
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/b.png").Path); $o=[Drawing.Bitmap]::new($s)
$o.SetPixel(36,42,$s.GetPixel(37,42)); $o.SetPixel(38,42,$s.GetPixel(38,41)); $s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/b_fix.png"))
