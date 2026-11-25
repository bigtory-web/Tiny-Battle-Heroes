// 사용: node 조립.js  → 뼈대_채팅.mp4 (훅 카드 → 하지만 → 채팅 프레임들 → 끝 카드). ffmpeg가 PATH에 있어야 함
const {execFileSync}=require('child_process'),fs=require('fs');
const dur=JSON.parse(fs.readFileSync('채팅/길이.json','utf8'));
const S=[['카드_훅.png',4,1],['카드_하지만.png',2,1],...dur.map((d,k)=>[`채팅/프레임${String(k+1).padStart(2,'0')}.png`,+d.toFixed(2),0]),['카드_끝.png',5,1]];
const a=[];let f='';
S.forEach(([p,d,fade],i)=>{a.push('-loop','1','-t',String(d),'-i',p);f+=`[${i}:v]scale=1920:1080,format=yuv420p,fps=30${fade?`,fade=t=in:st=0:d=0.3,fade=t=out:st=${(d-0.3).toFixed(2)}:d=0.3`:''}[v${i}];`});
f+=S.map((_,i)=>`[v${i}]`).join('')+`concat=n=${S.length}:v=1:a=0[out]`;
execFileSync('ffmpeg',['-y','-v','error',...a,'-filter_complex',f,'-map','[out]','-c:v','libx264','-pix_fmt','yuv420p','뼈대_채팅.mp4'],{stdio:'inherit'});
console.log('ok',S.reduce((t,x)=>t+x[1],0).toFixed(1)+'s');
