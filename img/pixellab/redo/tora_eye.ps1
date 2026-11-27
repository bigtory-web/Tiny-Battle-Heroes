# Tora (draft A): viewer-right eye was 2 rows, left 3. Make both 3 rows, right one starting one row higher than the left.
Add-Type -AssemblyName System.Drawing
function Hx($h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
$p=[IO.Path]::GetFullPath('img\pixellab\redo\tora_c_64.png'); $s=New-Object System.Drawing.Bitmap $p; $o=New-Object System.Drawing.Bitmap $s; $s.Dispose()
$white=Hx '#fcf6ed'; $rows=(Hx '#3e0d09'),(Hx '#a55303'),(Hx '#e39106')
for($k=0;$k -lt 3;$k++){ $o.SetPixel(37,(37+$k),$rows[$k]); $o.SetPixel(38,(37+$k),$rows[$k]); $o.SetPixel(39,(37+$k),$white) }
$o.Save($p)
