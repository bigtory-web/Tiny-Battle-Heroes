Add-Type -AssemblyName System.Drawing
foreach($p in 'img/p/flame.png','img/p/knight.png','img/p/gate.png','img/codex/gate_archer/a_f.png','img/codex/gate_archer/b_f.png','img/codex/gate_archer/c_f.png'){
 $s=[Drawing.Bitmap]::new((Resolve-Path $p).Path); $t=999;$btm=0;$l=999;$r=0
 for($y=0;$y -lt $s.Height;$y++){for($x=0;$x -lt $s.Width;$x++){if($s.GetPixel($x,$y).A -gt 0){if($y -lt $t){$t=$y};if($y -gt $btm){$btm=$y};if($x -lt $l){$l=$x};if($x -gt $r){$r=$x}}}}
 "$p canvas $($s.Width) height $($btm-$t+1) width $($r-$l+1) bottom $btm"; $s.Dispose() }
