Add-Type -AssemblyName System.Drawing
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
New-Item -ItemType Directory -Force img\codex\goldicon | Out-Null
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #2e0c06','H #fff6c0','L #ffe566','Y #ffbf14','D #d9820a','K #8a4a06'){ $k,$v=$p -split ' '; $pal[$k]=$v }
# coin body: 1px dark outline, lit rim top-left, shaded rim bottom-right
function Coin {
  $b = New-Object System.Drawing.Bitmap 16,16
  for($y=0;$y -lt 16;$y++){ for($x=0;$x -lt 16;$x++){ $dx=$x-7.5; $dy=$y-7.5; $d=[math]::Sqrt($dx*$dx+$dy*$dy)
    if($d -gt 7.9){continue}
    $k = if($d -gt 6.7){'o'} elseif($d -gt 4.9){ if($dx+$dy -lt -1){'L'}elseif($dx+$dy -gt 1){'D'}else{'Y'} } else {'Y'}
    $b.SetPixel($x,$y,(C $pal[$k])) } }
  return $b }
function Stamp($b,$x0,$y0,$rows){ for($j=0;$j -lt $rows.Count;$j++){ for($i=0;$i -lt $rows[$j].Length;$i++){ $k=[string]$rows[$j][$i]; if($k -ne '.'){ $b.SetPixel($x0+$i,$y0+$j,(C $pal[$k])) } } } }
$shine = 'HH','H.'
# A: square hole (same coin as the "start gold" upgrade icon)
$a = Coin; Stamp $a 5 5 'KKKKKD','KooooL','KooooL','KooooL','KooooL','DLLLLL'; Stamp $a 3 3 $shine
# B: star stamped in the middle
$star = '...XX...','...XX...','XXXXXXXX','.XXXXXX.','..XXXX..','..XXXX..','.XX..XX.'
$bb = Coin; Stamp $bb 4 5 @($star | ForEach-Object { $_.Replace('X','H') }); Stamp $bb 3 3 'H'
# C: raised inner ring with a bar mark
$c = Coin; Stamp $c 5 4 '.KKKK.','KHHYDK','KHHYDK','KHHYDK','KHHYDK','KHHYDK','KHHYDK','.KKKK.'; Stamp $c 3 3 $shine
$a.Save([IO.Path]::GetFullPath('img\codex\goldicon\gold_A.png')); $bb.Save([IO.Path]::GetFullPath('img\codex\goldicon\gold_B.png')); $c.Save([IO.Path]::GetFullPath('img\codex\goldicon\gold_C.png'))
$cur = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\hud_gold.png'))
# preview: big, then on the HUD bar and on a yellow price button with a number
$z=10; $s = New-Object System.Drawing.Bitmap (4*220+20), 420; $g=[System.Drawing.Graphics]::FromImage($s); $g.Clear((C '#17141d')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.TextRenderingHint='AntiAlias'
$font = New-Object System.Drawing.Font('Malgun Gothic', 28, [System.Drawing.FontStyle]::Bold)
$i=0; foreach($im in $cur,$a,$bb,$c){ $x=20+$i*220
  $g.DrawImage($im,$x+10,10,16*$z,16*$z)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#2a2533')),$x,190,190,70); $g.DrawImage($im,$x+14,201,48,48); $g.DrawString('130',$font,[System.Drawing.Brushes]::White,$x+72,198)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#ffc933')),$x,280,190,70); $g.DrawImage($im,$x+22,291,48,48); $g.DrawString('60',$font,(New-Object System.Drawing.SolidBrush (C '#4a2a08')),$x+84,288)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#2a2533')),$x,370,190,40); $g.DrawImage($im,$x+60,374,32,32); $g.DrawImage($im,$x+110,382,16,16)
  $i++ }
$s.Save([IO.Path]::GetFullPath('img\codex\goldicon\compare.png'))
