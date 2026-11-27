# 11A (brows 1 px lower) + one more brow pixel in front of the eye on both sides, continuing the slant
Add-Type -AssemblyName System.Drawing
function Load($p){ $b=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($p)); $c=New-Object System.Drawing.Bitmap $b; $b.Dispose(); $c }
$L=[System.Drawing.ColorTranslator]::FromHtml('#500e09'); $S=[System.Drawing.ColorTranslator]::FromHtml('#fdd3a8')
$a=Load 'img\codex\eyes\eye11A_low.png'; $b=Load 'img\codex\eyes\eye11A_low.png'
$b.SetPixel(30,36,$L); $b.SetPixel(40,35,$L)
# clear the hair outline around the new left tip, otherwise it is invisible (same dark colour)
$H=$a.GetPixel(30,33); if($H.R -lt 150){ $H=[System.Drawing.ColorTranslator]::FromHtml("#e53a16") }
$b.SetPixel(30,35,$H); $b.SetPixel(29,36,$H); $b.SetPixel(29,37,$H); $b.SetPixel(30,37,$S); $b.SetPixel(29,35,$H)
# keep the new right tip apart from the face outline so it reads
$b.SetPixel(40,36,$S)
$b.Save([IO.Path]::GetFullPath('img\codex\eyes\eye11A_front.png'))
$o=New-Object System.Drawing.Bitmap 900,360; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($im in $a,$b){ $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*460+5),5,440,286),(New-Object System.Drawing.Rectangle 23,30,20,13),[System.Drawing.GraphicsUnit]::Pixel); $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*460+180),295,72,60),(New-Object System.Drawing.Rectangle 23,28,24,20),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\eyes\brow11a.png'))
