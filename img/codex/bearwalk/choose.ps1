Add-Type -AssemblyName System.Drawing
$o=New-Object System.Drawing.Bitmap 1170,420; $g=[System.Drawing.Graphics]::FromImage($o); $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#55607c')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$font=New-Object System.Drawing.Font 'Consolas',20,([System.Drawing.FontStyle]::Bold)
$i=0; foreach($p in @(@('now','bear64.png'),@('A','walk1_v2a.png'),@('B','walk1.png'))){ $g.DrawString($p[0],$font,[System.Drawing.Brushes]::White,($i*390+10),6); $g.DrawImage((New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath("img\codex\bearwalk\$($p[1])"))),($i*390),30,384,384); $i++ }
$o.Save([IO.Path]::GetFullPath('img\codex\bearwalk\choose.png'))
