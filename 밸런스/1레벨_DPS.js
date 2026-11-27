// 1레벨 DPS 표 만들기: node 밸런스/1레벨_DPS.js → 밸런스/1레벨_DPS.md (2026-11-27)
process.chdir(require('path').join(__dirname, '..'));
const D=require(process.cwd()+'/data.js'),E=require(process.cwd()+'/engine.js');
const dummy='knight', T=30;
const rows=[];
for(const h of D.heroes){ if(h.mob) continue;
  let dealt=0, ults=0; const N=5;
  for(let s=1;s<=N;s++){ const b=E.createBattle(D,[{id:h.id,slot:0,level:1,star:1}],[{id:dummy,slot:0,level:1,mul:{hp:1e4,atk:0}}],{seed:s}); b.E[0].def=0; b.E[0].el="none"; b.E[0].el2=null;
    while(!b.result && b.time<T) b.step(); dealt+=b.A[0].stats.dealt; ults+=b.A[0].stats.ults; }
  const u=E.createBattle(D,[{id:h.id,slot:0,level:1,star:1}],[{id:dummy,slot:0,level:1}],{seed:1}).A[0];
  rows.push({id:h.id,name:h.name,grade:h.grade||1,job:h.job,range:h.range,hp:Math.round(u.maxHp),atk:Math.round(u.atk),iv:+u.interval.toFixed(2),crit:Math.round(u.crit*100),base:Math.round(u.atk/u.interval),dps:Math.round(dealt/N/T),ults:+(ults/N).toFixed(1)});
}
rows.sort((a,b)=>a.grade-b.grade||b.dps-a.dps);
const JOB={guardian:'수호',warrior:'전사',archer:'궁수',mage:'마법',bard:'음유',assassin:'암살'};
const RG={melee:'근',mid:'중',long:'장',far:'최장'};
let md='# 영웅 1레벨 DPS (1성)\n\n- 평타 DPS = 공격력 ÷ 공격 간격(공식)\n- 실측 DPS = 혼자 30초 동안 허수아비(체력 매우 큼, 공격 0, 방어 0, 속성 없음)를 때린 피해 ÷ 30초, 5판 평균. 걸어가는 시간·궁극기·패시브·치명타 포함, 팀 시너지·유물은 없음\n\n| 등급 | 영웅 | 직업 | 사거리 | 체력 | 공격력 | 공격 간격 | 치명 | 평타 DPS | 실측 DPS | 궁극기 횟수 |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for(const r of rows) md+=`| ${r.grade} | ${r.name} | ${JOB[r.job]||r.job} | ${RG[r.range]||r.range} | ${r.hp} | ${r.atk} | ${r.iv} | ${r.crit}% | ${r.base} | ${r.dps} | ${r.ults} |\n`;
const by={};rows.forEach(r=>{(by[r.grade]=by[r.grade]||[]).push(r)});
md+='\n## 등급별 실측 DPS\n\n| 등급 | 영웅 수 | 평균 | 가장 낮음 | 가장 높음 |\n|---|---|---|---|---|\n';
for(const g in by){const L=by[g],av=Math.round(L.reduce((a,r)=>a+r.dps,0)/L.length),lo=L[L.length-1],hi=L[0];md+=`| ${g} | ${L.length} | ${av} | ${lo.name} ${lo.dps} | ${hi.name} ${hi.dps} |\n`;}
const byJ={};rows.forEach(r=>{const k=r.grade+'|'+r.job;(byJ[k]=byJ[k]||[]).push(r.dps)});
{ const REC=require('./기록.js'), v={}; rows.forEach(r=>v[r.name]={실측DPS:r.dps,평타DPS:r.base,체력:r.hp,공격력:r.atk}); const s=REC.save('1레벨_DPS',v,{초:T,판:5}); md+='\n기록: 밸런스/기록/'+s.file+'\n'+REC.compareMd(s.prev,s.rec); }
require('fs').mkdirSync('밸런스',{recursive:true});require('fs').writeFileSync('밸런스/1레벨_DPS.md',md);
console.log(md.split('## 등급별')[1]);
console.log(rows.length);
