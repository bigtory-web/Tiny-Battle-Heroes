param([string]$File,[int]$X,[int]$Y,[int]$W,[int]$H,[string]$Out,[int]$Z=24)
Add-Type -AssemblyName System.Drawing
$im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($File)); $o=New-Object System.Drawing.Bitmap ($W*$Z),($H*$Z); $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($im,(New-Object System.Drawing.Rectangle 0,0,($W*$Z),($H*$Z)),(New-Object System.Drawing.Rectangle $X,$Y,$W,$H),[System.Drawing.GraphicsUnit]::Pixel)
$pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60,255,255,255)),1; for($i=0;$i -le $W;$i++){ $g.DrawLine($pen,$i*$Z,0,$i*$Z,$H*$Z) }; for($j=0;$j -le $H;$j++){ $g.DrawLine($pen,0,$j*$Z,$W*$Z,$j*$Z) }
$f=New-Object System.Drawing.Font 'Consolas',8; for($i=0;$i -lt $W;$i+=2){ $g.DrawString([string]($X+$i),$f,[System.Drawing.Brushes]::White,$i*$Z,0) }; for($j=0;$j -lt $H;$j+=2){ $g.DrawString([string]($Y+$j),$f,[System.Drawing.Brushes]::White,0,$j*$Z+8) }
$o.Save([IO.Path]::GetFullPath($Out))
