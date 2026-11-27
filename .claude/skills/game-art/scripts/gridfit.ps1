# blocky magenta art -> its own pixel grid, flat rows/columns dropped, centred in 24x24.  -Show prints the grid to pick rows
param([Parameter(Mandatory)]$In, $Out, [Parameter(Mandatory)][double]$Block, [string]$DropRows='', [string]$DropCols='', [switch]$Show)
Add-Type -AssemblyName System.Drawing
$s=New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($In))
function IsKey($c){ $c.R -gt 170 -and $c.B -gt 170 -and $c.G -lt 90 }
$l=9999;$r=0;$t=9999;$b=0
for($y=0;$y -lt $s.Height;$y+=2){ for($x=0;$x -lt $s.Width;$x+=2){ if(-not (IsKey $s.GetPixel($x,$y))){ if($x -lt $l){$l=$x}; if($x -gt $r){$r=$x}; if($y -lt $t){$t=$y}; if($y -gt $b){$b=$y} } } }
$W=[int][math]::Round(($r-$l+2)/$Block); $H=[int][math]::Round(($b-$t+2)/$Block); "art grid ${W}x$H"
$dr=@($DropRows -split '[ ,]+' | ?{$_ -ne ''} | %{[int]$_}); $dc=@($DropCols -split '[ ,]+' | ?{$_ -ne ''} | %{[int]$_})
$rows=@(0..($H-1) | ?{ $dr -notcontains $_ }); $cols=@(0..($W-1) | ?{ $dc -notcontains $_ })
function Cell($i,$j){ $s.GetPixel([int]($l+($i+0.5)*($r-$l+2)/$W), [int]($t+($j+0.5)*($b-$t+2)/$H)) }
if($Show){ foreach($j in 0..($H-1)){ $line=''; foreach($i in 0..($W-1)){ $c=Cell $i $j; $line += if(IsKey $c){'.'}else{ if(($c.R+$c.G+$c.B) -lt 140){'#'}else{'o'} } }; "{0,2} {1}" -f $j,$line } }
if(-not $Out){ return }
"output $($cols.Count)x$($rows.Count)"
if($cols.Count -gt 24 -or $rows.Count -gt 24){ "still over 24: drop more rows or columns"; return }
$o=New-Object System.Drawing.Bitmap 24,24; $ox=[int][math]::Floor((24-$cols.Count)/2); $oy=[int][math]::Floor((24-$rows.Count)/2)
for($y=0;$y -lt $rows.Count;$y++){ for($x=0;$x -lt $cols.Count;$x++){ $c=Cell $cols[$x] $rows[$y]; if(-not (IsKey $c)){ $o.SetPixel($ox+$x,$oy+$y,$c) } } }
$o.Save([IO.Path]::GetFullPath($Out))
