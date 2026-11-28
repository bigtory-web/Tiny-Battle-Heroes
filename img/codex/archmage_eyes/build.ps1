# eyes+brows only from the approved face styles onto Tethys; jaw, hair, hat untouched. Run from project root.
Add-Type -AssemblyName System.Drawing
$d = 'img/codex/archmage_eyes'
$styles = 'basic','sparkle','lashes','sleepy','brave'
$orig = [Drawing.Bitmap]::new((Resolve-Path img/p/archmage.png).Path)
$skin = $orig.GetPixel(31,38); $line = $orig.GetPixel(27,35)
$sheet = [Drawing.Bitmap]::new(3*300, 2*290); $g = [Drawing.Graphics]::FromImage($sheet)
$g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
$font = [Drawing.Font]::new('Arial', 16, [Drawing.FontStyle]::Bold)
$n = 0
foreach ($s in @('now') + $styles) {
  $out = $orig
  if ($s -ne 'now') {
    & .claude/skills/game-art-hero/scripts/stamp_face.ps1 -Target img/p/archmage.png -Out "$d/tmp.png" -LeftEye '27,36' -Style $s
    $st = [Drawing.Bitmap]::new((Resolve-Path "$d/tmp.png").Path); $out = [Drawing.Bitmap]::new($orig)
    for ($y = 33; $y -le 39; $y++) { for ($x = 26; $x -le 35; $x++) {
      $c = $st.GetPixel($x, $y); if ($c.ToArgb() -eq $orig.GetPixel($x, $y).ToArgb()) { continue }
      if ($c.R -gt 230 -and $c.G -gt 180 -and $c.G -lt 230 -and $c.B -lt 190) { $c = $skin }
      elseif ($c.R -lt 100 -and $c.G -lt 30) { $c = $line }
      if ($x -eq 26 -and $c -ne $line) { continue }
      $out.SetPixel($x, $y, $c) } }
    $st.Dispose(); $out.Save((Join-Path (Resolve-Path $d) "$s.png"))
  }
  $cx = ($n % 3) * 300; $cy = [math]::Floor($n / 3) * 290
  $g.DrawImage($out, [Drawing.Rectangle]::new($cx + 10, $cy + 30, 240, 240), 18, 24, 24, 24, 'Pixel')
  $g.DrawImage($out, $cx + 236, $cy + 200, 61, 61)
  $label = if ($n -eq 0) { 'now' } else { "$n $s" }
  $g.DrawString($label, $font, [Drawing.Brushes]::White, $cx + 10, $cy + 4)
  $n++
}
$sheet.Save((Join-Path (Resolve-Path $d) 'compare.png')); Remove-Item "$d/tmp.png"
