// 1화 뼈대 영상: 장면 mp4를 대본 v3 순서로 잇고 컷 전환(로고판)을 끼운 뒤 길이 확인용 음성을 얹음. 사용: node 뼈대만들기.js
const {execFileSync:x}=require('child_process'),fs=require('fs'),p=require('path');
const D=__dirname,W=p.join(D,'뼈대'),S=n=>p.join(D,n+'.mp4'),Z=n=>p.join(W,'장면',n+'.mp4');
const dur=f=>+x('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f]).toString();
const ff=(...a)=>x('ffmpeg',['-y','-v','error',...a],{stdio:'inherit'});
// [파일, 음성[{wav,시작초(장면 안)}]]
// 영상 장면 = 앞(영상, a) + 뒤(POINT 별도 화면, b). 음성은 a 시작부터 이어짐
const P=(n,v)=>[['s'+n+'a',Z('s'+n+'a'),[[v,0]]],['s'+n+'b',Z('s'+n+'b'),[]]];
const SC=[['훅',S('훅3샘플'),[]],...P('02','s02'),...P('03','s03'),['키포인트',S('키포인트샘플'),[['s04',0.3]]],
 ...P('05','s05'),...P('06','s06'),['채팅',S('채팅샘플'),[['s07a',0.3],['s07b',null]]],
 ...P('08','s08'),...P('09','s09'),['정리',S('정리샘플'),[['s10',0.5]]]];
const J=new Set(['훅','s03b','키포인트','s05b','s06b','채팅','s09b','정리']); // 이 장면 뒤에 전환
const fr=(m,f,t)=>ff(...(t==='last'?['-sseof','-0.05']:[]),'-i',m,'-frames:v','1',f);
const parts=[],au=[];let t=0;
SC.forEach(([n,m,a],i)=>{
  const d=dur(m);a.forEach(([w,o])=>au.push([p.join(W,'음성',w+'.wav'),o===null?t+d-2.7:t+(o<0?d+o:o)]));
  parts.push(m);t+=d;
  if(J.has(n)){const nx=SC[i+1]?SC[i+1][1]:null,A=p.join(W,'a.png'),B=p.join(W,'b.png'),o=p.join(W,'j_'+n+'.mp4');
    fr(m,A,'last');if(nx)fr(nx,B,'first');else fs.copyFileSync(A,B);
    x('node',[p.join(D,'컷전환만들기.js'),A,B,o],{env:{...process.env,HOLD:'0.05'},stdio:'ignore'});
    const jd=dur(o);parts.push(o);t+=jd}
});
const inp=parts.flatMap(f=>['-i',f]);
const fc=parts.map((_,i)=>`[${i}:v]scale=1920:1080,fps=30,setsar=1,format=yuv420p[v${i}]`).join(';')+';'+parts.map((_,i)=>`[v${i}]`).join('')+`concat=n=${parts.length}:v=1:a=0[v]`;
ff(...inp,'-filter_complex',fc,'-map','[v]','-c:v','libx264','-pix_fmt','yuv420p',p.join(W,'_v.mp4'));
const ai=au.flatMap(([w])=>['-i',w]),af=au.map(([,s],i)=>`[${i+1}:a]adelay=${Math.round(s*1000)}|${Math.round(s*1000)}[a${i}]`).join(';')+';'+au.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${au.length}:normalize=0[a]`;
ff('-i',p.join(W,'_v.mp4'),...ai,'-filter_complex',af,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-shortest',p.join(D,'1화뼈대.mp4'));
console.log('총',t.toFixed(1),'초');
