# swap the rounded crystal of up_crystalSlot for the faceted tilted shape approved for the crystal icons
Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$src=[IO.File]::ReadAllText([IO.Path]::GetFullPath('img\codex\cryset\gem.ps1'))
$fn=$src.Substring($src.IndexOf('function Crystal('), $src.IndexOf('function Glint(')-$src.IndexOf('function Crystal('))
$ink = C '#2e0c06'
Invoke-Expression $fn
$p=[IO.Path]::GetFullPath('img\codex\shopups\up_crystalSlot.png'); $s=New-Object System.Drawing.Bitmap $p; $o=New-Object System.Drawing.Bitmap $s; $s.Dispose()
$clear=[System.Drawing.Color]::FromArgb(0,0,0,0)
for($y=0;$y -lt 24;$y++){ for($x=14;$x -lt 24;$x++){ $o.SetPixel($x,$y,$clear) } }
$pal = @((C '#eafff2'),(C '#8dffb4'),(C '#3cc470'),(C '#1f7a45'))
Crystal $o $pal 17.5 11.5 18 3.3 9 5
$o.Save($p)
