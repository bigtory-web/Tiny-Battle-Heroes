// 로컬 확인용 정적 서버 (127.0.0.1만)
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.json':'application/json','.css':'text/css'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p=process.argv[3]||'/index.html'; /* 3번째 인자: 첫 화면(개발일지 8767은 /devlog/index.html) */const f=path.join(root,p);
if(!f.startsWith(root))return r.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e)return r.writeHead(404).end();r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});r.end(d);});}).listen(+process.argv[2]||8765,'127.0.0.1'); // 포트를 주면 그 포트(QA는 8766: 저장 데이터가 8765와 따로)
