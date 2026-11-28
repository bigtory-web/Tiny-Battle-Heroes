Add-Type -AssemblyName System.Drawing
$d='img/codex/gate_archer'
$items=@(@('blaze','img/p/flame.png'),@('now','img/p/gate.png'),@('D',"$d/d2.png"),@('E',"$d/e.png"))
$o=[Drawing.Bitmap]::new(1500,500); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold); $i=0
foreach($it in $items){ if(Test-Path $it[1]){ $s=[Drawing.Bitmap]::new((Resolve-Path $it[1]).Path)
  $x=$i*300+150-$s.Width*2.5; $g.DrawImage($s,[int]$x,[int](390-$s.Height*5),$s.Width*5,$s.Height*5); $g.DrawImage($s,$i*300+120,410,$s.Width,$s.Height)
  $g.DrawString($it[0],$f,[Drawing.Brushes]::White,$i*300+10,8) }; $i++ }
$o.Save((Join-Path (Get-Location) "$d/compare.png"))
