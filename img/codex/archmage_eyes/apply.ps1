# Put the chosen eyes (4 = sleepy) on img/p/archmage.png and all 8 anim frames. Run once from project root.
Add-Type -AssemblyName System.Drawing
function Load($p) { $s = [Drawing.Bitmap]::new((Resolve-Path $p).Path); $c = $s.Clone([Drawing.Rectangle]::new(0,0,$s.Width,$s.Height), 'Format32bppArgb'); $b = [Drawing.Bitmap]::new($c); $s.Dispose(); $c.Dispose(); $b }
$d = 'img/codex/archmage_eyes'
$still = Load img/p/archmage.png; $anim = Load img/p/archmage_anim.png
$skin = $still.GetPixel(31,38); $line = $still.GetPixel(27,35)
& .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target img/p/archmage.png -Out "$d/tmp.png" -LeftEye '27,36' -Style sleepy
$st = Load "$d/tmp.png"
# changed pixels, same rules as build.ps1
$px = @()
for ($y = 33; $y -le 39; $y++) { for ($x = 26; $x -le 35; $x++) {
  $c = $st.GetPixel($x, $y); if ($c.ToArgb() -eq $still.GetPixel($x, $y).ToArgb()) { continue }
  if ($c.R -gt 230 -and $c.G -gt 180 -and $c.G -lt 230 -and $c.B -lt 190) { $c = $skin }
  elseif ($c.R -lt 100 -and $c.G -lt 30) { $c = $line }
  if ($x -eq 26 -and $c -ne $line) { continue }
  $px += ,@($x, $y, $c) } }
# find the face in each frame
$offs = foreach ($f in 0..7) {
  $best = 1e9
  foreach ($dy in -6..8) { foreach ($dx in -8..8) {
    $sum = 0
    for ($y = 34; $y -le 41 -and $sum -lt $best; $y++) { for ($x = 26; $x -le 36; $x++) {
      $a = $still.GetPixel($x, $y); $b = $anim.GetPixel($f*64 + $x + $dx, $y + $dy)
      $sum += [math]::Abs($a.R-$b.R) + [math]::Abs($a.G-$b.G) + [math]::Abs($a.B-$b.B) } }
    if ($sum -lt $best) { $best = $sum; $o = @(($f*64 + $dx), $dy) } } }
  Write-Host "frame $f offset $($o[0] - $f*64),$($o[1]) diff $best"
  ,$o }
# anim has a paler skin and one extra face column on the left (old eye white) -> use its own skin there
$askin = $anim.GetPixel(32,37)
foreach ($p in $px) { $still.SetPixel($p[0], $p[1], $p[2]); $c = if ($p[2] -eq $skin) { $askin } else { $p[2] }; foreach ($o in $offs) { $anim.SetPixel($p[0] + $o[0], $p[1] + $o[1], $c) } }
foreach ($o in $offs) { foreach ($y in 36..38) { $q = $anim.GetPixel(26 + $o[0], $y + $o[1]); if ($q.G -gt 225) { $anim.SetPixel(26 + $o[0], $y + $o[1], $askin) } } }
$still.Save((Join-Path (Get-Location) 'img/p/archmage.png')); $anim.Save((Join-Path (Get-Location) 'img/p/archmage_anim.png'))
Remove-Item "$d/tmp.png"
# 8x check strip: still faces + frames
$o2 = [Drawing.Bitmap]::new(4*240, 2*240); $g = [Drawing.Graphics]::FromImage($o2); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
foreach ($f in 0..7) { $g.DrawImage($anim, [Drawing.Rectangle]::new(($f%4)*240, [math]::Floor($f/4)*240, 240, 240), (18 + $offs[$f][0]), (24 + $offs[$f][1]), 24, 24, 'Pixel') }
$o2.Save((Join-Path (Get-Location) "$d/frames.png"))
