# Stamp the approved face (eyes, brows, jaw line) onto a 64x64 hero.  Run from the project root.
#   stamp_face.ps1 -Target a.png -Out b.png -LeftEye '31,39' [-Iris '#782e07,#d67d0e'] [-Frame 0]
# -LeftEye: where the top white pixel of the left-of-picture eye must land.  -Iris: dark,light eye colours.
# -Frame: frame number (0..7) when Target is a 512x64 animation strip.
# -Style: basic (default), sleepy, sparkle, lashes  (references/face/styles.png shows them left to right).
param([Parameter(Mandatory)][string]$Target, [Parameter(Mandatory)][string]$Out, [Parameter(Mandatory)][string]$LeftEye, [string]$Iris = '', [int]$Frame = 0, [ValidateSet('basic','sleepy','sparkle','lashes')][string]$Style = 'basic')
Add-Type -AssemblyName System.Drawing
$file = if ($Style -eq 'basic') { 'face.png' } else { "face_$Style.png" }
$face = New-Object System.Drawing.Bitmap (Join-Path $PSScriptRoot "..\references\face\$file")
$src = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($Target)); $b = New-Object System.Drawing.Bitmap $src; $src.Dispose()
$lx, $ly = [int[]]($LeftEye -split ',')
$dark = [System.Drawing.ColorTranslator]::FromHtml('#782e07'); $light = [System.Drawing.ColorTranslator]::FromHtml('#d67d0e')
$new = if ($Iris) { $Iris -split ',' | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) } }
function Near($a, $c) { [math]::Abs($a.R - $c.R) + [math]::Abs($a.G - $c.G) + [math]::Abs($a.B - $c.B) -le 6 }
for ($y = 0; $y -lt $face.Height; $y++) { for ($x = 0; $x -lt $face.Width; $x++) {
  $c = $face.GetPixel($x, $y); if (-not $c.A) { continue }
  if ($new) { if (Near $c $dark) { $c = $new[0] } elseif (Near $c $light) { $c = $new[1] } }
  $b.SetPixel($Frame * 64 + $lx - 2 + $x, $ly - 2 + $y, $c) } }   # the left eye's top white is at (2,2) inside face.png
$b.Save([IO.Path]::GetFullPath($Out))
