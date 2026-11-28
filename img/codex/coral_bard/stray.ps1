# leftovers around the conch: finger-coloured pixels under the lowered conch -> outline; lone gray dots (+ their ink) -> removed
Add-Type -AssemblyName System.Drawing
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $b=[Drawing.Bitmap]::new($s); $s.Dispose(); $b }
$ink=[Drawing.ColorTranslator]::FromHtml('#461205'); $clear=[Drawing.Color]::FromArgb(0,0,0,0)
$gray=@(0x7c8394,0x9aa2b2,0xc6ccd8)
function IsGray($c){ $c.A -and ($gray -contains (([int]$c.R -shl 16) -bor ([int]$c.G -shl 8) -bor [int]$c.B)) }
function IsInk($c){ $c.A -and ([int]$c.R+$c.G+$c.B) -lt 140 }
foreach($p in 'img/p/coral.png','img/p/coral_anim.png'){
  $b=Load $p; $frames=$b.Width/64; $n=0; $m=0
  for($f=0;$f -lt [math]::Min(4,$frames);$f++){   # idle frames: lower-left edge of the lowered conch
    for($y=57;$y -le 62;$y++){ for($x=41;$x -le 45;$x++){ $c=$b.GetPixel($f*64+$x,$y); if($c.A -and $c.R -gt 230 -and $c.G -gt 120){ $b.SetPixel($f*64+$x,$y,$ink); $n++ } } } }
  for($f=4;$f -lt $frames;$f++){
    for($y=44;$y -le 56;$y++){ for($x=38;$x -le 50;$x++){ $px=$f*64+$x; if(-not (IsGray $b.GetPixel($px,$y))){continue}
      $g=0; foreach($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1))){ if(IsGray $b.GetPixel($px+$d[0],$y+$d[1])){$g++} }
      if($g){continue}
      $b.SetPixel($px,$y,$clear); $m++
      foreach($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1))){ $qx=$px+$d[0]; $qy=$y+$d[1]; if(-not (IsInk $b.GetPixel($qx,$qy))){continue}
        $solid=0; foreach($e in @(@(-1,0),@(1,0),@(0,-1),@(0,1))){ $c=$b.GetPixel($qx+$e[0],$qy+$e[1]); if($c.A -and -not (IsInk $c)){$solid++} }
        if(-not $solid){ $b.SetPixel($qx,$qy,$clear) } } } } }
  "$p fingers $n lone $m"; $b.Save((Join-Path (Get-Location) $p)) }
