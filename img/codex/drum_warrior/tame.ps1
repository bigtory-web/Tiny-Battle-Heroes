# bright purple/pink hair is too close to the magenta key (and neon): darken it before gridsnap
Add-Type -AssemblyName System.Drawing
$d='img/codex/drum_warrior'
$k=$args[0]; if(-not $k){$k='a'}
$s=[Drawing.Bitmap]::new((Resolve-Path "$d/${k}_src.png").Path); $b=$s.Clone([Drawing.Rectangle]::new(0,0,$s.Width,$s.Height),'Format32bppArgb')
$r=[Drawing.Rectangle]::new(0,0,$b.Width,$b.Height); $bd=$b.LockBits($r,'ReadWrite','Format32bppArgb'); $buf=New-Object byte[] ($b.Width*$b.Height*4); [Runtime.InteropServices.Marshal]::Copy($bd.Scan0,$buf,0,$buf.Length)
for($i=0;$i -lt $buf.Length;$i+=4){ $bl=$buf[$i]; $g=$buf[$i+1]; $rd=$buf[$i+2]
  if($rd -gt 225 -and $bl -gt 225 -and $g -lt 30){continue}          # background
  if($rd -gt 120 -and $bl -gt 120 -and $g -lt 140 -and ($rd-$g) -gt 60){ $buf[$i+2]=[byte]($rd*0.68); $buf[$i+1]=[byte]([math]::Min(255,$g*0.85+8)); $buf[$i]=[byte]($bl*0.78) } }
[Runtime.InteropServices.Marshal]::Copy($buf,0,$bd.Scan0,$buf.Length); $b.UnlockBits($bd); $b.Save((Join-Path (Get-Location) "$d/${k}_tamed.png"))
