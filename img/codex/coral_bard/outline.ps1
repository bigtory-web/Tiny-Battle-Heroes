# continuous dark outline around the conch (gray body + red lip), on img/p still and all 8 frames. Run from project root.
Add-Type -AssemblyName System.Drawing
$d='img/codex/coral_bard'
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $b=[Drawing.Bitmap]::new($s); $s.Dispose(); $b }
$ink=[Drawing.ColorTranslator]::FromHtml('#461205')
$gray=@(0x7c8394,0x9aa2b2,0xc6ccd8)
function IsGray($c){ $c.A -and ($gray -contains (([int]$c.R -shl 16) -bor ([int]$c.G -shl 8) -bor [int]$c.B)) }
function Fix($b){ $src=[Drawing.Bitmap]::new($b); $w=$b.Width
  for($f=0;$f -lt $w/64;$f++){
    $x0=99;$x1=-1;$y0=99;$y1=-1
    for($y=0;$y -lt 64;$y++){for($x=0;$x -lt 64;$x++){ if(IsGray $src.GetPixel($f*64+$x,$y)){ if($x -lt $x0){$x0=$x}; if($x -gt $x1){$x1=$x}; if($y -lt $y0){$y0=$y}; if($y -gt $y1){$y1=$y} } }}
    # conch = gray, plus the red/pink lip next to it (right part of the gray box)
    function IsConch($x,$y){ if($x -lt 0 -or $x -gt 63 -or $y -lt 0 -or $y -gt 63){return $false}; $c=$src.GetPixel($f*64+$x,$y); if(IsGray $c){return $true}
      $c.A -and $c.R -gt 190 -and $c.G -gt 40 -and $c.G -lt 170 -and $c.B -gt 35 -and $c.B -lt 160 -and $x -ge ($x1-4) -and $x -le ($x1+8) -and $y -ge ($y0-1) -and $y -le ($y1+1) }
    for($y=[math]::Max(0,$y0-2);$y -le [math]::Min(63,$y1+2);$y++){ for($x=[math]::Max(0,$x0-1);$x -lt 64;$x++){
      if(IsConch $x $y){continue}
      if(-not ((IsConch ($x-1) $y) -or (IsConch ($x+1) $y) -or (IsConch $x ($y-1)) -or (IsConch $x ($y+1)))){continue}
      $c=$src.GetPixel($f*64+$x,$y)
      if(-not $c.A -or ([int]$c.R+$c.G+$c.B) -gt 200){ $b.SetPixel($f*64+$x,$y,$ink); $script:n++ } } } }
  $src.Dispose() }
foreach($p in 'img/p/coral.png','img/p/coral_anim.png'){ $script:n=0; $b=Load $p; Fix $b; $b.Save((Join-Path (Get-Location) $p)); "$p outlined $script:n" }
$a=Load img/p/coral_anim.png
$o=[Drawing.Bitmap]::new(1536,768); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach($row in 0,1){ $g.DrawImage($a,[Drawing.Rectangle]::new(0,($row*384),1536,384),[Drawing.Rectangle]::new(($row*256),0,256,64),'Pixel') }
$o.Save((Join-Path (Get-Location) "$d/frames.png"))
# 12x close-up of one idle and one attack conch
$z=[Drawing.Bitmap]::new(768,288); $g=[Drawing.Graphics]::FromImage($z); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($a,[Drawing.Rectangle]::new(0,0,384,288),[Drawing.Rectangle]::new(32,40,32,24),'Pixel'); $g.DrawImage($a,[Drawing.Rectangle]::new(384,0,384,288),[Drawing.Rectangle]::new((384+28),34,32,24),'Pixel')
$z.Save((Join-Path (Get-Location) "$d/zoom_conch.png"))
