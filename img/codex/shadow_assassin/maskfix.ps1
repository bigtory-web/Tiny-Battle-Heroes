# the mask's top edge rose in the middle: make it level (row 42, x37..40 -> skin)
Add-Type -AssemblyName System.Drawing
$d='img/codex/shadow_assassin'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/still.png").Path); $o=[Drawing.Bitmap]::new($s); $skin=$s.GetPixel(35,42)
for($x=37;$x -le 40;$x++){ $o.SetPixel($x,42,$skin) }
$s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/still.png"))
