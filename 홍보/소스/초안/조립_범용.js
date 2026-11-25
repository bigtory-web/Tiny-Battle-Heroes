// 사용: node 조립_범용.js <프레임 폴더> <출력 mp4>   (폴더의 프레임NN(N).png를 길이.json 초 단위로 이어 붙임. 번호가 2자리든 3자리든 찾아서 씀. ffmpeg가 PATH에 있어야 함)
const {execFileSync}=require('child_process'),fs=require('fs');
const [dir,out]=process.argv.slice(2);
const dur=JSON.parse(fs.readFileSync(`${dir}/길이.json`,'utf8'));
const file=i=>{for(const w of [3,2,4]){const f=`${dir}/프레임${String(i+1).padStart(w,'0')}.png`;if(fs.existsSync(f))return f}throw new Error('프레임 없음 '+(i+1))};
const a=[];let f='';
dur.forEach((d,i)=>{a.push('-framerate','30','-loop','1','-t',String(+d.toFixed(2)),'-i',file(i));f+=`[${i}:v]scale=1920:1080,format=yuv420p,fps=30[v${i}];`});
f+=dur.map((_,i)=>`[v${i}]`).join('')+`concat=n=${dur.length}:v=1:a=0[out]`;
execFileSync('ffmpeg',['-y','-v','error',...a,'-filter_complex',f,'-map','[out]','-c:v','libx264','-pix_fmt','yuv420p',out],{stdio:'inherit'});
console.log('ok',dur.reduce((x,y)=>x+y,0).toFixed(1)+'s');
