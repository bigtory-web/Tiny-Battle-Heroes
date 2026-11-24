// 사용: img/tools 에서 node fx_bubble_draw.js (결과는 ./fxout/). 보호막 방울 8프레임을 코드로 그린다. png_helper.js는 PNG 읽기·쓰기 도구.
const {dec,enc}=require('./png_helper.js');const fs=require('fs');
const F=72,C=(F-1)/2,R=34;const WHITE=[255,255,255];
function frame(k){
 const px=Buffer.alloc(F*F*4);const set=(x,y,c,al=255)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=F||y>=F)return;const q=(y*F+x)*4;px[q]=c[0];px[q+1]=c[1];px[q+2]=c[2];px[q+3]=al};
 const ang=(x,y,ox=0,oy=0)=>((Math.atan2(y-oy-C,x-ox-C)*180/Math.PI)+360)%360;const inArc=(a,s,e)=>{a=(a-s+720)%360;return a<=((e-s+720)%360)};
 const DARK=[78,160,236],MID=[120,200,255],LIGHT=[196,238,255],TINT=[150,215,255];
 // 한 점의 방울 색: dd = 바깥 가장자리에서 안쪽으로 잰 거리
 function pix(dd,a,s,withTint,full){let c=null,al=255;
  if(dd>=-0.5&&dd<1){c=DARK}else if(dd>=1&&dd<2.5){c=a>170&&a<300?LIGHT:MID}
  else if(withTint&&dd>=2.5){c=TINT;al=Math.round(14+66*Math.exp(-(dd-2.5)/4.2))}
  if(full){ // 반사광: 왼쪽 위 크게, 오른쪽 아래 작게
   if(inArc(a,205+s,255+s)&&dd>=-0.5&&dd<4.2){c=WHITE;al=255}
   if(inArc(a,222+s,242+s)&&dd>=4.2&&dd<6.2){c=WHITE;al=255}
   if(inArc(a,10-s*.5,44-s*.5)&&dd>=-0.5&&dd<3){c=WHITE;al=255}}
  return c?[c,al]:null}
 const hold=k<4;const t=k%4;
 if(hold){const rr=R+[0,.5,0,-.5][t],s=t*7;
  for(let y=0;y<F;y++)for(let x=0;x<F;x++){const d=Math.hypot(x-C,y-C);const p=pix(rr-d,ang(x,y),s,true,true);if(p)set(x,y,p[0],p[1])}
  const sp=[[C+15,C-19],[C-23,C+11],[C+5,C-26],[C+21,C+7]];[0,2].forEach(i=>set(sp[(t+i)%4][0],sp[(t+i)%4][1],WHITE));set(C-18,C-22,WHITE)}
 else if(t===0){const rr=R+1;
  for(let y=0;y<F;y++)for(let x=0;x<F;x++){const d=Math.hypot(x-C,y-C);const p=pix(rr-d,ang(x,y),0,true,true);if(p)set(x,y,p[0],p[1])}
  for(const A of [300,150,20,95,235]){for(let r=rr-10;r<=rr+1;r+=.6){const a=(A+Math.sin(r*2)*7)*Math.PI/180;set(C+r*Math.cos(a),C+r*Math.sin(a),WHITE);set(C+r*Math.cos(a)+1,C+r*Math.sin(a),LIGHT)}}}
 else if(t===1||t===2){const n=6,gap=t===1?14:24,off=t===1?4:10,arcLen=360/n-gap;
  for(let i=0;i<n;i++){const s=i*360/n+8,mid=s+arcLen/2,ox=Math.cos(mid*Math.PI/180)*off,oy=Math.sin(mid*Math.PI/180)*off;
   for(let y=0;y<F;y++)for(let x=0;x<F;x++){const d=Math.hypot(x-ox-C,y-oy-C),a=ang(x,y,ox,oy);if(!inArc(a,s,s+arcLen))continue;const dd=R+1-d;
    if(dd>=-0.5&&dd<1)set(x,y,DARK);else if(dd>=1&&dd<2.5)set(x,y,i%2?LIGHT:MID);else if(dd>=2.5&&dd<4&&i%3===0)set(x,y,WHITE)}}
  const dr=t===1?[[C-27,C-21],[C+28,C-6],[C+3,C+30]]:[[C-31,C-12],[C+31,C+8],[C-8,C+32],[C+12,C-33],[C-21,C+26]];dr.forEach(p=>{set(p[0],p[1],WHITE);set(p[0]+1,p[1],LIGHT)});if(t===2)[[C+25,C+22],[C-29,C+20]].forEach(p=>set(p[0],p[1],LIGHT))}
 else{[[C-30,C-14],[C+31,C-9],[C-10,C+32],[C+22,C+27],[C-24,C+24],[C+8,C-33]].forEach((p,i)=>{set(p[0],p[1],i%2?LIGHT:WHITE);if(i%2===0)set(p[0]+1,p[1],MID)})}
 return px}
const frames=[...Array(8)].map((_,k)=>frame(k));
const cols=4,SW=cols*F,SH=2*F,sheet=Buffer.alloc(SW*SH*4);
frames.forEach((p,n)=>{const r=Math.floor(n/cols),c=n%cols;for(let y=0;y<F;y++)p.copy(sheet,((r*F+y)*SW+c*F)*4,y*F*4,(y*F+F)*4)});
fs.mkdirSync('fxout',{recursive:true});enc(SW,SH,sheet,'fxout/fx_bubble.png');
const json={frames:frames.map((_,n)=>{const r=Math.floor(n/cols),c=n%cols;return{filename:(n<4?'bubble hold ':'bubble break ')+(n%4),frame:{x:c*F,y:r*F,w:F,h:F},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:F,h:F},sourceSize:{w:F,h:F},duration:n<4?150:60}}),
 meta:{app:'image-session',image:'fx_bubble.png',size:{w:SW,h:SH},frameTags:[{name:'hold',from:0,to:3,direction:'pingpong'},{name:'break',from:4,to:7,direction:'forward'}]}};
fs.writeFileSync('fxout/fx_bubble.json',JSON.stringify(json,null,1));
// 미리보기: 전장색 바탕 + 기사 + 방울 (x4)
const K=dec('C:/Users/Home/Downloads/방치형RPG_테스트베드/img/p/knight.png');const sc=4,PW=SW*sc,PH=SH*sc,o=Buffer.alloc(PW*PH*4);
for(let i=0;i<PW*PH;i++){o[i*4]=0x7a;o[i*4+1]=0x8a;o[i*4+2]=0x5a;o[i*4+3]=255}
const put=(x,y,c,a)=>{const q=(y*PW+x)*4;o[q]=o[q]*(1-a/255)+c[0]*a/255;o[q+1]=o[q+1]*(1-a/255)+c[1]*a/255;o[q+2]=o[q+2]*(1-a/255)+c[2]*a/255};
for(let n=0;n<8;n++){const r=Math.floor(n/cols),c=n%cols;
 if(n<5||n===5||true){for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;if(!K.d[i+3])continue;for(let yy=0;yy<sc;yy++)for(let xx=0;xx<sc;xx++)put((c*F+4+x)*sc+xx,(r*F+8+y)*sc+yy,[K.d[i],K.d[i+1],K.d[i+2]],255)}}
 for(let y=0;y<F;y++)for(let x=0;x<F;x++){const i=((r*F+y)*SW+c*F+x)*4;if(!sheet[i+3])continue;for(let yy=0;yy<sc;yy++)for(let xx=0;xx<sc;xx++)put((c*F+x)*sc+xx,(r*F+y)*sc+yy,[sheet[i],sheet[i+1],sheet[i+2]],sheet[i+3])}}
enc(PW,PH,o,'fxout/preview_bubble.png');console.log('fx_bubble',SW+'x'+SH,'프레임 8 x',F+'x'+F);
