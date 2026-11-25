// 컷 전환: 장면 A → 픽셀 칸(타일)이 대각선으로 화면을 덮음 → 같은 방향으로 칸이 걷히며 장면 B.
// 사용: node 컷전환만들기.js <A이미지> <B이미지> <출력.mp4>   (이미지는 1920x1080. 없으면 채팅·포인트 프레임으로 시험)
// 칸 수: 가로 16 × 세로 9 (덮개 그림과 맞춤). ffmpeg가 PATH에 있어야 함
const {execFileSync}=require('child_process'),path=require('path');
const D=__dirname;
const A=process.argv[2]||path.join(D,'채팅/프레임310.png'), B=process.argv[3]||path.join(D,'포인트/프레임10.png'), OUT=process.argv[4]||path.join(D,'컷전환샘플.mp4');
const COVER=path.join(D,'컷전환/덮개_'+(process.env.COVER||'검정')+'.png'); // COVER=검정(기본) / 보라(게임 UI 타일)
const HOLD=1.2, T=0.5, MID=0.15;                       // 전환 전 머무름 / 덮는 시간 / 다 덮인 채 머무름
const expr="if(gte(1-P,(floor(X/W*16)+floor(Y/H*9))/23),B,A)"; // xfade의 P는 1에서 0으로 줄어드는 값이라 1-P를 씀. 칸 (가로+세로 번호)가 작은 것부터 바뀜 = 왼쪽 위에서 오른쪽 아래로 번지는 대각선
const norm=(i)=>`[${i}:v]scale=1920:1080,format=yuv420p,fps=30,setsar=1`;
const fc=[`${norm(0)}[a]`,`${norm(1)}[c]`,`${norm(2)}[b]`,
 `[a][c]xfade=transition=custom:duration=${T}:offset=${HOLD}:expr='${expr}'[ac]`,
 `[ac][b]xfade=transition=custom:duration=${T}:offset=${(HOLD+T+MID).toFixed(2)}:expr='${expr}'[out]`].join(';');
execFileSync('ffmpeg',['-y','-v','error','-loop','1','-t',String(HOLD+T+0.1),'-i',A,'-loop','1','-t',String(T+MID+T+0.1),'-i',COVER,'-loop','1','-t',String(HOLD+0.2),'-i',B,'-filter_complex',fc,'-map','[out]','-c:v','libx264','-pix_fmt','yuv420p',OUT],{stdio:'inherit'});
console.log('ok',OUT);
