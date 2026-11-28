Add-Type -AssemblyName System.Drawing
$d='img/codex/shaman_archer'
function L($p){[Drawing.Bitmap]::new((Resolve-Path $p).Path)}
$o=[Drawing.Bitmap]::new(1536,900); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$f=[Drawing.Font]::new('Arial',18,[Drawing.FontStyle]::Bold)
$s=L img/p/shaman.png; $g.DrawImage($s,0,0,512,512); $g.DrawString('Luna now',$f,[Drawing.Brushes]::White,10,8)
$b=L img/p/flame.png; $g.DrawImage($b,512,0,512,512); $g.DrawString('blaze (size ref)',$f,[Drawing.Brushes]::White,522,8)
$g.DrawImage($s,[Drawing.Rectangle]::new(1040,20,480,460),16,22,32,30,'Pixel'); $g.DrawString('face',$f,[Drawing.Brushes]::White,1040,484)
$a=L img/p/shaman_anim.png; foreach($r in 0,1){ $g.DrawImage($a,[Drawing.Rectangle]::new(0,(516+$r*192),768,192),($r*256),0,256,64,'Pixel') }
$g.DrawString('idle (top) / attack (bottom)',$f,[Drawing.Brushes]::White,790,600)
$g.DrawImage($s,900,700,$s.Width,$s.Height); $g.DrawImage($b,980,700,$b.Width,$b.Height); $g.DrawString('real size',$f,[Drawing.Brushes]::White,900,780)
$o.Save((Join-Path (Get-Location) "$d/now.png"))
"size $($s.Width) anim $($a.Width)x$($a.Height)"
$t=999;$l=999;$r=0;$bt=0; for($y=0;$y -lt $s.Height;$y++){for($x=0;$x -lt $s.Width;$x++){if($s.GetPixel($x,$y).A){if($y -lt $t){$t=$y};if($y -gt $bt){$bt=$y};if($x -lt $l){$l=$x};if($x -gt $r){$r=$x}}}}; "w $($r-$l+1) h $($bt-$t+1)"
