Add-Type -AssemblyName System.Drawing
# difficulty sample: "hard" = three red skulls (easy would be 1 green, normal 2 yellow)
function C($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$pal = New-Object 'System.Collections.Generic.Dictionary[string,string]'
foreach($p in 'o #3f0a06','L #ff9a8a','R #f0362a','D #a81410'){ $k,$v=$p -split ' '; $pal[$k]=$v }
$skull = '..LLLLL..','.LLRRRRR.','LLRRRRRRD','LRooRooRD','LRooRooRD','RRRRoRRRD','.RRRRRRD.','..RoRoR..','..RRRRD..'
$b = New-Object System.Drawing.Bitmap 24,24
function Skull($x,$y){
  for($j=0;$j -lt 9;$j++){ for($i=0;$i -lt 9;$i++){ if($skull[$j][$i] -ne [char]'.'){
    foreach($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))){ $b.SetPixel($x+$i+$d[0],$y+$j+$d[1],(C $pal['o'])) } } } }
  for($j=0;$j -lt 9;$j++){ for($i=0;$i -lt 9;$i++){ $k=[string]$skull[$j][$i]; if($k -ne '.'){ $b.SetPixel($x+$i,$y+$j,(C $pal[$k])) } } } }
Skull 7 2
Skull 2 13
Skull 13 13
New-Item -ItemType Directory -Force img\codex\difficon | Out-Null
$b.Save([IO.Path]::GetFullPath('img\codex\difficon\ui_diff_hard.png'))
# preview: big, and at the top-left of the chapter map (under its title bar) at 36
$bg = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath('img\p\bg_swamp.png'))
$cv = New-Object System.Drawing.Bitmap 760,360; $g=[System.Drawing.Graphics]::FromImage($cv); $g.Clear((C '#120e20')); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.FillRectangle((New-Object System.Drawing.SolidBrush (C '#1b1530')),20,60,240,240); $g.DrawImage($b,20,60,240,240)
$g.DrawImage($bg,(New-Object System.Drawing.Rectangle(290,20,450,320)),135,40,450,320,'Pixel')
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(191,23,20,29))),290,20,450,48)
$g.DrawImage($b,300,76,36,36)
$cv.Save([IO.Path]::GetFullPath('img\codex\difficon\compare.png'))
