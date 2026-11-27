# removes the two lower floor puddles of bg_cave (they sat right on top of the fg_cave crystals); run after pixelize.ps1
Add-Type -AssemblyName System.Drawing
$p=[IO.Path]::GetFullPath('img\p\bg_cave.png'); $s=New-Object System.Drawing.Bitmap $p; $o=New-Object System.Drawing.Bitmap $s
foreach($box in @(@(5,315,100,358,95),@(630,312,715,355,-90))){ $x0,$y0,$x1,$y1,$from=$box
  $wet=@(); for($y=$y0;$y -le $y1;$y+=2){ for($x=$x0;$x -le $x1;$x+=2){ $c=$s.GetPixel($x,$y); if(($c.B - $c.R) -gt 100){ $wet+=,@($x,$y) } } }
  if(-not $wet.Count){ "no puddle in $x0..$x1"; continue }
  $xs=$wet | %{$_[0]}; $ys=$wet | %{$_[1]}; $m=@($xs | Measure-Object -Min -Max), @($ys | Measure-Object -Min -Max)
  "puddle x $($m[0].Minimum)..$($m[0].Maximum) y $($m[1].Minimum)..$($m[1].Maximum)"
  # cover the water and its dark rim (6px around) with plain floor taken from the same rows
  $done=@{}; foreach($w in $wet){ for($dy=-6;$dy -le 6;$dy+=2){ for($dx=-8;$dx -le 8;$dx+=2){ $x=$w[0]+$dx; $y=$w[1]+$dy; $k="$x,$y"; if($done[$k] -or $x -lt 0 -or $x -gt 718 -or $y -gt 400){continue}; $done[$k]=1
        $c=$s.GetPixel($x+$from,$y); foreach($a in 0,1){ foreach($b in 0,1){ $o.SetPixel($x+$a,$y+$b,$c) } } } } } }
$s.Dispose(); $o.Save($p)
