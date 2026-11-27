Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 920,360; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$i=0; foreach($f in 'bear64.png','walk1_b_c.png'){ $im=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($f)); $g.DrawImage($im,(New-Object System.Drawing.Rectangle ($i*460+5),5,440,350),(New-Object System.Drawing.Rectangle 21,32,22,17),[System.Drawing.GraphicsUnit]::Pixel); $i++ }
$o.Save([IO.Path]::GetFullPath('face.png'))
