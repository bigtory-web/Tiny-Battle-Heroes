# hair width outside the face (left / right) at eye..chin rows, and height above the face
Add-Type -AssemblyName System.Drawing
$list=@(); $list+=,@('style2','img/codex/hairset/h2_f.png',29,39); $list+=,@('style2fix','img/codex/hairset/h2c_f.png',29,39); $list+=,@('style6','img/codex/hairset/h6_f.png',29,39)
foreach($it in $list){ $n,$p,$ex,$ey=$it; if(-not $ex){continue}
 $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $L=$ex-2; $R=$ex+9; $ls=@(); $rs=@()
 # contiguous hair-coloured-or-outline run: measured on rows where the head is, eye top .. eye top+2
 foreach($y in $ey..($ey+2)){ $a=0; for($x=$L-1;$x -ge 0 -and $s.GetPixel($x,$y).A;$x--){$a++}; $b=0; for($x=$R+1;$x -lt $s.Width -and $s.GetPixel($x,$y).A;$x++){$b++}; $ls+=$a; $rs+=$b }
 $top=0; for($y=0;$y -lt $ey -and -not $top;$y++){ for($x=$L;$x -le $R;$x++){ if($s.GetPixel($x,$y).A){$top=$y;break} } }
 $la=($ls|measure -Average).Average; $ra=($rs|measure -Average).Average
 "{0,-8} left {1,4:n1}  right {2,4:n1}  right/left {3,4:n2}  above {4}" -f $n,$la,$ra,($ra/[math]::Max($la,0.1)),($ey-$top) }
