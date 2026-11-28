Add-Type -AssemblyName System.Drawing
$d='img/codex/gate_archer'
$o=[Drawing.Bitmap]::new(1500,830); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in @(@('blaze','img/p/flame.png'),@('now','img/p/gate.png'),@('E aim + brave eyes',"$d/e_brave.png"),@('D raised + brave eyes',"$d/d2_brave.png"))){
 $s=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path); $x=$i*375+188-$s.Width*3; $g.DrawImage($s,[int]$x,[int](420-$s.Height*6),$s.Width*6,$s.Height*6); $g.DrawImage($s,$i*375+156,430,$s.Width,$s.Height); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*375+10,8); $i++ }
$i=0
foreach($it in @(@('1 sparkle','sparkle'),@('2 lashes','lashes'),@('3 sleepy','sleepy'),@('4 brave','brave'))){
 $s=[Drawing.Bitmap]::new((Resolve-Path "$d/e_$($it[1]).png").Path); $g.DrawImage($s,[Drawing.Rectangle]::new($i*375+43,540,288,264),24,30,24,22,'Pixel'); $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*375+10,505); $i++ }
$o.Save((Join-Path (Get-Location) "$d/compare2.png"))
