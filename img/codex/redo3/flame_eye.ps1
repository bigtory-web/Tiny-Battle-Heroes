# Blaze: the left eye had a 3-wide white blob. Make it the mirror of the right eye (white on the outer side), 1 px lower.
Add-Type -AssemblyName System.Drawing
$b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\codex\redo3\flame_new2.png'))
$skin=$b.GetPixel(34,40); $glint=$b.GetPixel(39,38); $amber=$b.GetPixel(37,40)
$b.SetPixel(29,40,$skin); $b.SetPixel(30,40,$skin); $b.SetPixel(30,41,$skin)
$b.SetPixel(31,39,$glint); $b.SetPixel(32,41,$amber); $b.SetPixel(33,41,$amber)
$b.Save([IO.Path]::GetFullPath('img\codex\redo3\flame_new3.png'))
