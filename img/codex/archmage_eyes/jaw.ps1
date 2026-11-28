# one jaw shape on the still and all 8 frames: 2 skin rows under the left eye, 3/2/1 under the right eye (Blaze's jaw). Run from project root.
Add-Type -AssemblyName System.Drawing
function Load($p){ $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $c=$s.Clone([Drawing.Rectangle]::new(0,0,$s.Width,$s.Height),'Format32bppArgb'); $b=[Drawing.Bitmap]::new($c); $s.Dispose(); $c.Dispose(); $b }
$still=Load img/p/archmage.png; $anim=Load img/p/archmage_anim.png
# x=26..35 ; s = skin, o = outline
$rows=@{ 39='osssssssso'; 40='ossssssso o'; 41=' oooooooo ' }
$rows[40]='osssssssoo'
$ink0=$still.GetPixel(30,41)
function Put($b,$ox,$oy){ $skin=$b.GetPixel(31+$ox,39+$oy); $ink=$script:ink0
  foreach($y in $rows.Keys){ for($i=0;$i -lt 10;$i++){ $ch=$rows[$y][$i]; if($ch -eq 's'){ $b.SetPixel(26+$i+$ox,$y+$oy,$skin) } elseif($ch -eq 'o'){ $b.SetPixel(26+$i+$ox,$y+$oy,$ink) } } } }
Put $still 0 0
foreach($f in 0..7){ Put $anim ($f*64+2) -1
  # left face edge: frames had skin at x=26 on some rows/frames only -> outline everywhere, like the still
  foreach($y in 36..38){ $anim.SetPixel(26+$f*64+2,$y-1,$ink0) }
  # right edge: some frames had one extra skin pixel at x=36
  foreach($y in 36..39){ $c=$anim.GetPixel(36+$f*64+2,$y-1); if($c.R -gt 235 -and $c.G -gt 180 -and $c.G -lt 235 -and $c.B -lt 205){ $anim.SetPixel(36+$f*64+2,$y-1,$ink0) } }
}
$still.Save((Join-Path (Get-Location) 'img/p/archmage.png')); $anim.Save((Join-Path (Get-Location) 'img/p/archmage_anim.png'))
$o=[Drawing.Bitmap]::new(1200,480); $g=[Drawing.Graphics]::FromImage($o); $g.Clear([Drawing.Color]::FromArgb(86,96,122)); $g.InterpolationMode='NearestNeighbor'; $g.PixelOffsetMode='Half'
$g.DrawImage($still,[Drawing.Rectangle]::new(0,0,240,240),18,24,24,24,'Pixel')
foreach($f in 0..7){ $g.DrawImage($anim,[Drawing.Rectangle]::new((1+($f%4))*240,[math]::Floor($f/4)*240,240,240),($f*64+20),23,24,24,'Pixel') }
$o.Save((Join-Path (Get-Location) 'img/codex/archmage_eyes/jaw.png'))
