# attack frames: close the broken outline, remove the mouth dot; then install into img/p
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/anim.png").Path); $o=[Drawing.Bitmap]::new($s)
$ink=[Drawing.ColorTranslator]::FromHtml('#461205'); $n=0; $m=0
function Skin($c){ $c.A -and $c.R -gt 230 -and $c.G -gt 190 -and $c.G -lt 230 -and $c.B -lt 190 }
for($y=1;$y -lt 63;$y++){ for($x=257;$x -lt 511;$x++){ $c=$s.GetPixel($x,$y)
  if(-not $c.A){ foreach($p in @(@(-1,0),@(1,0),@(0,-1),@(0,1))){ $q=$s.GetPixel($x+$p[0],$y+$p[1]); if($q.A -and ($q.R+$q.G+$q.B) -gt 260){ $o.SetPixel($x,$y,$ink); $n++; break } } }
  elseif($c.R -lt 130 -and $c.G -lt 60 -and $y -ge 43 -and $y -le 47){
    $k=0; foreach($p in @(@(-1,0),@(1,0),@(0,-1),@(0,1))){ if(Skin $s.GetPixel($x+$p[0],$y+$p[1])){$k++} }
    if($k -ge 3){ $o.SetPixel($x,$y,$(if(Skin $s.GetPixel($x-1,$y)){$s.GetPixel($x-1,$y)}else{$s.GetPixel($x+1,$y)})); $m++ } } } }
"outline $n mouth $m"
$s.Dispose(); $o.Save((Join-Path (Get-Location) "$d/anim.png"))
$p=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($p); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($o,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$p.Save((Join-Path (Get-Location) "$d/frames.png"))
