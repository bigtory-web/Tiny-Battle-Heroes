// 사용: node 조립_포인트.js → 포인트샘플.mp4 (포인트/프레임NN.png를 길이.json대로 이어 붙임)
const {execFileSync}=require('child_process'),fs=require('fs');
const dur=JSON.parse(fs.readFileSync('포인트/길이.json','utf8'));
const a=[];let f='';
dur.forEach((d,i)=>{a.push('-loop','1','-t',String(d),'-i',`포인트/프레임${String(i+1).padStart(2,'0')}.png`);f+=`[${i}:v]scale=1920:1080,format=yuv420p,fps=30[v${i}];`});
f+=dur.map((_,i)=>`[v${i}]`).join('')+`concat=n=${dur.length}:v=1:a=0[out]`;
execFileSync('ffmpeg',['-y','-v','error',...a,'-filter_complex',f,'-map','[out]','-c:v','libx264','-pix_fmt','yuv420p','포인트샘플.mp4'],{stdio:'inherit'});
console.log('ok',dur.reduce((a,b)=>a+b,0)+'s');
