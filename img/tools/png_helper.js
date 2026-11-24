const zlib=require('zlib'),fs=require('fs');
function crc(b){let c,t=crc.t||(crc.t=Array.from({length:256},(_,n)=>{c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0}));let x=0xffffffff;for(const v of b)x=t[(x^v)&255]^(x>>>8);return (x^0xffffffff)>>>0}
function dec(f){const b=fs.readFileSync(f);let p=8,w,h,ct,idat=[],pal;while(p<b.length){const l=b.readUInt32BE(p),t=b.toString('latin1',p+4,p+8),d=b.subarray(p+8,p+8+l);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9]}if(t==='IDAT')idat.push(d);p+=12+l}
 const raw=zlib.inflateSync(Buffer.concat(idat));const bpp=ct===6?4:ct===2?3:0;if(!bpp)throw'ct'+ct;const out=Buffer.alloc(w*h*4);let prev=Buffer.alloc(w*bpp),o=0;
 for(let y=0;y<h;y++){const ft=raw[o++];const line=Buffer.from(raw.subarray(o,o+w*bpp));o+=w*bpp;for(let i=0;i<line.length;i++){const a=i>=bpp?line[i-bpp]:0,u=prev[i],c=i>=bpp?prev[i-bpp]:0;let v=line[i];
 if(ft===1)v+=a;else if(ft===2)v+=u;else if(ft===3)v+=(a+u)>>1;else if(ft===4){const pp=a+u-c,pa=Math.abs(pp-a),pb=Math.abs(pp-u),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?u:c)}line[i]=v&255}
 for(let x=0;x<w;x++){const q=(y*w+x)*4;out[q]=line[x*bpp];out[q+1]=line[x*bpp+1];out[q+2]=line[x*bpp+2];out[q+3]=bpp===4?line[x*bpp+3]:255}prev=line}
 return{w,h,d:out}}
function enc(w,h,d,f){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;d.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4)}
 const ch=(t,b)=>{const l=Buffer.alloc(4);l.writeUInt32BE(b.length);const tb=Buffer.concat([Buffer.from(t),b]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(tb));return Buffer.concat([l,tb,c])};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
 fs.writeFileSync(f,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]))}
module.exports={dec,enc};
