# 얼굴 도장: 36x36 영웅 그림의 눈·눈썹·입을 정해진 크기·간격의 도장으로 바꿔 찍어요.
# 사용: facestamp.ps1 -Src img/p/rain_t.png -Out img/p/rain_f.png -Eye sharp -Brow flat -Mouth line -Pupil 5A1A08
#  -Eye   round | sparkle | sharp | half | smile
#  -Brow  none | flat | angry | sad
#  -Mouth line | smile | open | fang | none
#  -Pupil 눈동자 색(속성 색을 어둡게), 기본 210C0A
#  -Sheet <out.png> : 도장 전체 목록 그림만 만들어요
# 눈 한 쪽 = 가로 3 x 세로 5(눈꺼풀 1줄 + 4줄), 두 눈 사이 3칸. 위치는 기존 흰자를 찾아 그 가운데에 맞춰요.
#  -AtX / -AtBottom : 자동으로 못 찾을 때 왼쪽 눈 시작 열과 눈 아래 줄을 직접 지정
#  -Iris / -Iris2 : 눈동자 아래쪽 색(홍채)과 밝은 홍채색 (qa·qb·qc 눈에서 사용)
#  -Lash  : 눈꼬리 속눈썹 1칸   -Blush : 눈 아래 볼터치 2칸
param([string]$Src, [string]$Out, [string]$Eye = 'round', [string]$Brow = 'none', [string]$Mouth = 'line', [string]$Pupil = '210C0A', [string]$Sheet = '', [int]$AtX = -1, [int]$AtBottom = -1,
  [string]$Iris = '6B3A2A', [string]$Iris2 = 'A86A40', [switch]$Lash, [switch]$Blush)
Add-Type -AssemblyName System.Drawing
$COL = @{ L = [System.Drawing.Color]::FromArgb(255, 0x3C, 0x1A, 0x13); W = [System.Drawing.Color]::FromArgb(255, 0xFB, 0xFB, 0xFA)
        H = [System.Drawing.Color]::FromArgb(255, 0xFF, 0xFF, 0xFF); R = [System.Drawing.Color]::FromArgb(255, 0xC0, 0x45, 0x40) }
$COL.P = [System.Drawing.ColorTranslator]::FromHtml('#' + $Pupil)
$COL.I = [System.Drawing.ColorTranslator]::FromHtml('#' + $Iris); $COL.K = [System.Drawing.ColorTranslator]::FromHtml('#' + $Iris2)
$COL.B = [System.Drawing.Color]::FromArgb(255, 0xF0, 0x96, 0x8C)

# 도장 모양: 글자 = L 외곽선, W 흰자, P 눈동자, H 반짝이, R 입속, S 피부(지움), . 그대로 둠
$EYES = @{
  round   = @('LLL', 'WPP', 'WPP', 'WPP', 'WPP')
  sparkle = @('LLL', 'WHP', 'WPP', 'WPP', 'WPP')
  sharp   = @('SSS', 'LLL', 'WPP', 'WPP', 'SPP')
  half    = @('SSS', 'SSS', 'LLL', 'WPP', 'WPP')
  smile   = @('SSS', 'SLS', 'LSL', 'SSS', 'SSS')
  qa      = @('LLL', 'WHP', 'WPP', 'WIP', 'WII')   # 품질 A: 반짝이 1 + 아래 홍채색
  qb      = @('LLL', 'WHP', 'WPP', 'WIK', 'WKH')   # 품질 B: 반짝이 2 + 밝은 홍채 (큰 반짝 눈)
  qc      = @('SLL', 'SHP', 'SPP', 'SPI', 'SII')   # 품질 C: 흰자 없는 동그란 눈
  # 눈 모양 세트 v2 (홍채·반짝이 포함). 오른쪽 눈이 다르면 $EYESR에 따로
  e_round  = @('LLL', 'WHP', 'WPP', 'WIP', 'WII')  # 동글: 기본·순함
  e_shine  = @('LLL', 'WHP', 'WPP', 'WIK', 'WKH')  # 반짝 큰 눈: 어린·밝음
  e_sharp  = @('LSS', 'LLL', 'WHP', 'WIP', 'SSS')  # 날카로운: 눈꼬리 올라감, 키 작음
  e_sleepy = @('SSS', 'SSS', 'LLL', 'WHP', 'WII')  # 졸린 반쯤 감은 눈: 마법사·냉정
  e_droopy = @('SSS', 'SLL', 'LHP', 'WPP', 'WII')  # 처진 눈: 순함·소심
  e_cat    = @('LLL', 'KPK', 'IPI', 'IPI', 'SIS')  # 고양이 세로 동공: 수인·야성
  e_dot    = @('SSS', 'SLL', 'SHP', 'SPP', 'SII')  # 흰자 없는 동그란 점 눈: 단순·귀여움
  e_smile  = @('SSS', 'SLS', 'LSL', 'LSL', 'SSS')  # 웃는 눈 ^^: 힐러·밝음
  e_closed = @('SSS', 'SSS', 'SSS', 'LLL', 'SSS') } # 감은 눈 —: 평온·성자
$EYESR = @{
  e_sharp  = @('SSL', 'LLL', 'WHP', 'WIP', 'SSS')
  e_droopy = @('SSS', 'LLS', 'WHL', 'WPP', 'WII') }
$BROWS = @{ none = @('...'); flat = @('LLL'); angry = @('LL.', '..L'); sad = @('..L', 'LL.') }  # 왼쪽 눈 기준, 오른쪽 눈은 좌우 뒤집음
$MOUTHS = @{ line = @('LL'); smile = @('L.L', '.L.'); open = @('LL', 'RR'); fang = @('LLL', '.W.'); none = @() }

function Put($bm, $x, $y, $ch, $skin) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $bm.Width -or $y -ge $bm.Height -or $ch -eq '.') { return }
  if ($ch -eq 'S') { $bm.SetPixel($x, $y, $skin) } else { $bm.SetPixel($x, $y, $COL["$ch"]) }
}
function Stamp($bm, $rows, $x0, $y0, $skin, [switch]$Flip) {
  for ($r = 0; $r -lt $rows.Count; $r++) { $line = $rows[$r]; if ($Flip) { $a = $line.ToCharArray(); [array]::Reverse($a); $line = -join $a }
    for ($c = 0; $c -lt $line.Length; $c++) { Put $bm ($x0 + $c) ($y0 + $r) $line[$c] $skin } }
}
function DrawFace($bm, $ls, $bot, $skin) {
  $rs = $ls + 6
  Stamp $bm $EYES[$Eye] $ls ($bot - 4) $skin
  $re = if ($EYESR.ContainsKey($Eye)) { $EYESR[$Eye] } else { $EYES[$Eye] }
  Stamp $bm $re $rs ($bot - 4) $skin
  $top = $bot - 4; if ($EYES[$Eye][0] -match '^S+$') { $top++ }; if ($EYES[$Eye][1] -match '^S+$') { $top++ }
  if ($Lash) { Put $bm ($ls - 1) $top 'L' $skin; Put $bm ($rs + 3) $top 'L' $skin }
  if ($Blush) { foreach ($xx in ($ls - 1), $ls, ($rs + 2), ($rs + 3)) { Put $bm $xx ($bot + 1) 'B' $skin } }
  $b = $BROWS[$Brow]; if ($Brow -ne 'none') { $by = $bot - 4 - 1 - $b.Count; Stamp $bm $b $ls $by $skin; Stamp $bm $b $rs $by $skin -Flip }
  $m = $MOUTHS[$Mouth]; if ($m.Count) { $mx = $ls + 4 + [int][Math]::Floor((3 - $m[0].Length) / 2) + 1; Stamp $bm $m $mx ($bot + 2) $skin }
}

if ($Sheet) {  # 도장 목록: 줄마다 눈 종류, 칸마다 입·눈썹 조합 예시
  $skin = [System.Drawing.Color]::FromArgb(255, 0xFA, 0xC4, 0xA2)
  $keys = 'round', 'sparkle', 'sharp', 'half', 'smile'; $combos = @(@('none', 'line'), @('flat', 'smile'), @('angry', 'open'), @('sad', 'fang'))
  $tile = 16; $bm = New-Object System.Drawing.Bitmap ($tile * $combos.Count), ($tile * $keys.Count)
  for ($i = 0; $i -lt $keys.Count; $i++) { for ($j = 0; $j -lt $combos.Count; $j++) {
    for ($y = 0; $y -lt $tile; $y++) { for ($x = 0; $x -lt $tile; $x++) { $bm.SetPixel($j * $tile + $x, $i * $tile + $y, $skin) } }
    $script:Eye = $keys[$i]; $script:Brow = $combos[$j][0]; $script:Mouth = $combos[$j][1]
    DrawFace $bm ($j * $tile + 3) ($i * $tile + 9) $skin } }
  $big = New-Object System.Drawing.Bitmap ($bm.Width * 8), ($bm.Height * 8); $g = [System.Drawing.Graphics]::FromImage($big)
  $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'; $g.DrawImage($bm, 0, 0, $big.Width, $big.Height); $g.Dispose()
  $big.Save($Sheet); $big.Dispose(); $bm.Dispose(); "sheet -> $Sheet"; return
}

$orig = [System.Drawing.Image]::FromFile((Resolve-Path $Src).Path); $bm = New-Object System.Drawing.Bitmap 36, 36; $gg = [System.Drawing.Graphics]::FromImage($bm); $gg.DrawImage($orig, 0, 0, 36, 36); $gg.Dispose(); $orig.Dispose()
function IsWhite($c) { $c.A -gt 128 -and $c.R -gt 225 -and $c.G -gt 225 -and $c.B -gt 225 }
function IsSkin($c) { $c.A -gt 128 -and $c.R -gt 225 -and $c.G -ge 165 -and $c.G -le 220 -and $c.B -ge 135 -and $c.B -le 190 }
# 1) 흰자 찾기 (12~26줄; 모자 위 장식 눈은 제외)
function IsDark($c) { $c.A -gt 128 -and (0.3 * $c.R + 0.59 * $c.G + 0.11 * $c.B) -lt 80 }
# 흰자 = 바로 옆(좌우)에 어두운 눈동자가 있고 세로로 2칸 이상인 흰 점 (흰 머리·갑옷 반짝이 제외)
$pts = @(); for ($y = 12; $y -le 26; $y++) { for ($x = 6; $x -le 30; $x++) { if (-not (IsWhite $bm.GetPixel($x, $y))) { continue }
  if (-not ((IsDark $bm.GetPixel($x + 1, $y)) -or (IsDark $bm.GetPixel($x - 1, $y)))) { continue }
  if ((IsWhite $bm.GetPixel($x, $y - 1)) -or (IsWhite $bm.GetPixel($x, $y + 1))) { $pts += , @($x, $y) } } }  # 흰자는 세로로 2칸 이상
function FindPair($pts) {
  if ($pts.Count -lt 2) { return $null }
  # 열 묶음 → 두 눈: 아래 줄 높이 차 1 이하, 가로 거리 3~8인 쌍 중 점이 가장 많은 쌍
  $xs = $pts | % { $_[0] } | Sort-Object -Unique; $groups = @(); $cur = @($xs[0])
  for ($i = 1; $i -lt $xs.Count; $i++) { if ($xs[$i] - $xs[$i - 1] -gt 1) { $groups += , $cur; $cur = @() }; $cur += $xs[$i] }; $groups += , $cur
  $info = @($groups | % { $g = $_; $gp = @($pts | ? { $g -contains $_[0] }); [pscustomobject]@{ cx = ($g | Measure-Object -Average).Average; bot = ($gp | % { $yy = $_[1]; while ($yy -lt 35 -and (IsWhite $bm.GetPixel($_[0], $yy + 1))) { $yy++ }; $yy } | Measure-Object -Maximum).Maximum; n = $gp.Count } })
  $best = $null; for ($i = 0; $i -lt $info.Count; $i++) { for ($j = $i + 1; $j -lt $info.Count; $j++) { $a = $info[$i]; $b2 = $info[$j]; $dxp = [Math]::Abs($a.cx - $b2.cx)
    if ($dxp -ge 3 -and $dxp -le 8 -and [Math]::Abs($a.bot - $b2.bot) -le 1) { $sc = $a.n + $b2.n; if (-not $best -or $sc -gt $best.s) { $best = [pscustomobject]@{ s = $sc; cx = ($a.cx + $b2.cx) / 2; bot = [Math]::Max($a.bot, $b2.bot) } } } } }
  return $best
}
if ($AtX -ge 0) { $ls = $AtX; $bot = $AtBottom }  # 수동 위치
else {
  $best = FindPair $pts
  if (-not $best) {  # 느슨하게: 얼굴 칸 안의 흰 점 전부에서 높이가 맞는 쌍
    $loose = @(); for ($y = 12; $y -le 26; $y++) { for ($x = 8; $x -le 28; $x++) { if (IsWhite $bm.GetPixel($x, $y)) { $loose += , @($x, $y) } } }
    $best = FindPair $loose; if ($best) { Write-Host "loose-match $Src" } }
  if (-not $best) { throw "두 눈 쌍을 못 찾았어요: $Src (-AtX/-AtBottom으로 직접 지정)" }
  $bot = $best.bot; $ls = [int][Math]::Round($best.cx) - 4
}
# 2) 피부색: 눈 아래쪽에서 가장 많은 피부색
$cnt = @{}; for ($y = $bot - 4; $y -le [Math]::Min(35, $bot + 4); $y++) { for ($x = $ls; $x -le $ls + 8; $x++) { $c = $bm.GetPixel($x, $y); if (IsSkin $c) { $k = $c.ToArgb(); $cnt[$k] = 1 + $cnt[$k] } } }
$skin = if ($cnt.Count) { [System.Drawing.Color]::FromArgb(($cnt.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key) } else { [System.Drawing.Color]::FromArgb(255, 0xFA, 0xC4, 0xA2) }
# 3) 옛 눈·입 지우기: 눈 자리(눈꺼풀 아래 4줄)와 입 자리의 흰자·어두운 점을 피부로
for ($y = $bot - 3; $y -le [Math]::Min(35, $bot + 3); $y++) { for ($x = $ls - 1; $x -le $ls + 9; $x++) { $c = $bm.GetPixel($x, $y); if ($c.A -lt 128) { continue }
  $lum = 0.3 * $c.R + 0.59 * $c.G + 0.11 * $c.B
  $edge = $false; foreach ($d in @(@(-1, 0), @(1, 0), @(0, 1))) { $n = $bm.GetPixel([Math]::Max(0, [Math]::Min(35, $x + $d[0])), [Math]::Min(35, $y + $d[1])); if ($n.A -lt 128) { $edge = $true } }
  if (-not $edge -and ((IsWhite $c) -or ($lum -lt 90 -and $y -ge $bot - 3))) { $bm.SetPixel($x, $y, $skin) } } }
for ($y = $bot - 3; $y -le $bot; $y++) { for ($x = $ls + 3; $x -le $ls + 5; $x++) { $bm.SetPixel($x, $y, $skin) } }  # 두 눈 사이
# 4) 찍기
DrawFace $bm $ls $bot $skin
$bm.Save($Out); $bm.Dispose()
"face eyes@x$ls bottom$bot $Eye/$Brow/$Mouth -> $Out"
