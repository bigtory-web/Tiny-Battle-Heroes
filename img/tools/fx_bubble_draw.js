// 사용: img/tools 에서 node fx_bubble_draw.js (결과는 ./fxout/). 보호막 돔 방울 8프레임을 코드로 그린다. png_helper.js는 PNG 읽기·쓰기 도구.
// 보호막 방울(아래가 일자): 72x72 프레임 8장 (유지 0~3, 깨짐 4~7). 사용: node bubble2.js
const {dec,enc}=require('./png_helper.js');const fs=require('fs');
const F=72,CX=35.5,CY=40,R=35,CUT=22,YB=CY+CUT; // YB = 평평한 바닥 줄(약 y 68)
const WHITE=[255,255,255],DARK=[78,160,236],MID=[120,200,255],LIGHT=[196,238,255],TINT=[150,215,255];
function frame(k){
 const px=Buffer.alloc(F*F*4);const set=(x,y,c,al=255)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=F||y>=F)return;const q=(y*F+x)*4;px[q]=c[0];px[q+1]=c[1];px[q+2]=c[2];px[q+3]=al};
 const ang=(x,y,ox=0,oy=0)=>((Math.atan2(y-oy-CY,x-ox-CX)*180/Math.PI)+360)%360;const inArc=(a,s,e)=>{a=(a-s+720)%360;return a<=((e-s+720)%360)};
 // 한 점의 색: ddc=원 가장자리에서 안쪽 거리, ddf=평평한 바닥에서 위쪽 거리
 function pix(ddc,ddf,a,s,full){const dd=Math.min(ddc,ddf);let c=null,al=255;
  if(dd>=-0.5&&dd<1){c=DARK}else if(dd>=1&&dd<2.5){c=(ddf<ddc)?MID:(a>170&&a<300?LIGHT:MID)}
  else if(dd>=2.5){c=TINT;al=Math.round(12+62*Math.exp(-(ddc-2.5)/4.2)*(ddf<10?ddf/10:1))}
  if(full){
   if(inArc(a,205+s,255+s)&&ddc>=-0.5&&ddc<4.2){c=WHITE;al=255}
   if(inArc(a,222+s,242+s)&&ddc>=4.2&&ddc<6.2){c=WHITE;al=255}
   if(inArc(a,350-s*.5,24-s*.5)&&ddc>=-0.5&&ddc<3){c=WHITE;al=255}}
  return c?[c,al]:null}
 const hold=k<4,t=k%4;
 if(hold||t===0){const rr=R+(hold?[0,.5,0,-.5][t]:1),s=hold?t*7:0;
  for(let y=0;y<F;y++)for(let x=0;x<F;x++){const d=Math.hypot(x-CX,y-CY);const ddf=YB-y+0.5;if(ddf<-0.5)continue;const p=pix(rr-d,ddf,ang(x,y),s,true);if(p)set(x,y,p[0],p[1])}
  if(hold){const sp=[[CX+15,CY-19],[CX-23,CY+11],[CX+5,CY-26],[CX+21,CY+7]];[0,2].forEach(i=>set(sp[(t+i)%4][0],sp[(t+i)%4][1],WHITE));set(CX-18,CY-22,WHITE)}
  else for(const A of [300,150,20,95,235]){for(let r=rr-10;r<=rr+1;r+=.6){const a=(A+Math.sin(r*2)*7)*Math.PI/180,x=CX+r*Math.cos(a),y=CY+r*Math.sin(a);if(y<=YB){set(x,y,WHITE);set(x+1,y,LIGHT)}}}}
 else if(t===1||t===2){const n=5,gap=t===1?14:24,off=t===1?4:10,arcLen=258/n-gap;
  for(let i=0;i<n;i++){const s=141+i*258/n+gap/2,mid=s+arcLen/2,ox=Math.cos(mid*Math.PI/180)*off,oy=Math.sin(mid*Math.PI/180)*off;
   for(let y=0;y<F;y++)for(let x=0;x<F;x++){const d=Math.hypot(x-ox-CX,y-oy-CY),a=ang(x,y,ox,oy);if(!inArc(a,s,s+arcLen))continue;if(y-oy>YB+0.5)continue;const dd=Math.min(R+1-d,YB-(y-oy)+0.5);
    if(dd>=-0.5&&dd<1)set(x,y,DARK);else if(dd>=1&&dd<2.5)set(x,y,i%2?LIGHT:MID);else if(dd>=2.5&&dd<4&&i%3===0)set(x,y,WHITE)}}
  // 바닥 줄도 조각: 아래로 처지며 끊어짐
  const by=YB+(t===1?2:5);for(let x=CX-26;x<=CX+26;x++){if(t===2&&Math.round(x)%4>1)continue;set(x,by,DARK);set(x,by-1,MID)}
  const dr=t===1?[[CX-28,CY-21],[CX+29,CY-6],[CX+3,CY+25]]:[[CX-32,CY-12],[CX+32,CY+8],[CX-18,CY+27],[CX+12,CY-34],[CX+26,CY+22]];dr.forEach(p=>{set(p[0],p[1],WHITE);set(p[0]+1,p[1],LIGHT)});if(t===2)[[CX+30,CY+18],[CX-30,CY+20]].forEach(p=>set(p[0],p[1],LIGHT))}
 else{[[CX-31,CY-14],[CX+32,CY-9],[CX-12,CY+24],[CX+22,CY+23],[CX-26,CY+18],[CX+8,CY-34]].forEach((p,i)=>{set(p[0],p[1],i%2?LIGHT:WHITE);if(i%2===0)set(p[0]+1,p[1],MID)})}
 return px}
const frames=[...Array(8)].map((_,k)=>frame(k));
const cols=4,SW=cols*F,SH=2*F,sheet=Buffer.alloc(SW*SH*4);
frames.forEach((p,n)=>{const r=Math.floor(n/cols),c=n%cols;for(let y=0;y<F;y++)p.copy(sheet,((r*F+y)*SW+c*F)*4,y*F*4,(y*F+F)*4)});
fs.mkdirSync('fxout',{recursive:true});enc(SW,SH,sheet,'fxout/fx_bubble.png');
const json={frames:frames.map((_,n)=>{const r=Math.floor(n/cols),c=n%cols;return{filename:(n<4?'bubble hold ':'bubble break ')+(n%4),frame:{x:c*F,y:r*F,w:F,h:F},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:F,h:F},sourceSize:{w:F,h:F},duration:n<4?150:60}}),
 meta:{app:'image-session',image:'fx_bubble.png',size:{w:SW,h:SH},anchor:{x:36,y:Math.round(YB)+1,note:'기준점 = 평평한 바닥 줄(영웅 발 밑)'},frameTags:[{name:'hold',from:0,to:3,direction:'pingpong'},{name:'break',from:4,to:7,direction:'forward'}]}};
fs.writeFileSync('fxout/fx_bubble.json',JSON.stringify(json,null,1));
// 미리보기: 기사 발이 평평한 바닥 줄(YB)에 오게
const Kn=dec(process.env.KNIGHT||'C:/Users/Home/Downloads/방치형RPG_테스트베드/img/p/knight.png');const sc=4,PW=SW*sc,PH=SH*sc,o=Buffer.alloc(PW*PH*4);
for(let i=0;i<PW*PH;i++){o[i*4]=0x7a;o[i*4+1]=0x8a;o[i*4+2]=0x5a;o[i*4+3]=255}
const put=(x,y,c,a)=>{const q=(y*PW+x)*4;o[q]=o[q]*(1-a/255)+c[0]*a/255;o[q+1]=o[q+1]*(1-a/255)+c[1]*a/255;o[q+2]=o[q+2]*(1-a/255)+c[2]*a/255};
for(let n=0;n<8;n++){const r=Math.floor(n/cols),c=n%cols;const ky=Math.round(YB)-63;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;if(!Kn.d[i+3])continue;for(let yy=0;yy<sc;yy++)for(let xx=0;xx<sc;xx++)put((c*F+4+x)*sc+xx,(r*F+ky+y)*sc+yy,[Kn.d[i],Kn.d[i+1],Kn.d[i+2]],255)}
 for(let y=0;y<F;y++)for(let x=0;x<F;x++){const i=((r*F+y)*SW+c*F+x)*4;if(!sheet[i+3])continue;for(let yy=0;yy<sc;yy++)for(let xx=0;xx<sc;xx++)put((c*F+x)*sc+xx,(r*F+y)*sc+yy,[sheet[i],sheet[i+1],sheet[i+2]],sheet[i+3])}}
enc(PW,PH,o,'fxout/preview_bubble.png');console.log('fx_bubble',SW+'x'+SH,'평평한 바닥 줄 y',Math.round(YB));
