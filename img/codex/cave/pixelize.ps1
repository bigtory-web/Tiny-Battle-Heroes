# crisp pixel version: 40-colour palette (k-means), each block takes its most frequent colour, then 2x nearest.
# Thin dark lines (outlines) are found separately on the source so they stay unbroken after shrinking.
param($In='img\codex\cave\cave5b_src.png', $Out='img\codex\cave\cave_day_b_px.png', [int]$W=360, [int]$H=201, [int]$K=40,
      [int]$Reach=6, [int]$Dark=7, [double]$Share=0.2)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing;
public static class Px {
  static int Near(int[][] c, int r, int g, int bl){ int b=0; long bd=long.MaxValue; for(int i=0;i<c.Length;i++){ long x=r-c[i][0], y=g-c[i][1], z=bl-c[i][2]; long d=x*x+y*y+z*z; if(d<bd){bd=d;b=i;} } return b; }
  public static void Run(string src, string dst, int w, int h, int k, int reach, int dark, double share){
    var s=new Bitmap(src); int sw=s.Width, sh=s.Height; var rnd=new Random(1); var c=new int[k][];
    var px=new Color[sw,sh]; var L=new int[sw,sh];
    for(int y=0;y<sh;y++) for(int x=0;x<sw;x++){ var p=s.GetPixel(x,y); px[x,y]=p; L[x,y]=(p.R*3+p.G*6+p.B)/10; }
    for(int i=0;i<k;i++){ var p=px[rnd.Next(sw), rnd.Next(sh)]; c[i]=new int[]{p.R,p.G,p.B}; }
    for(int it=0;it<12;it++){ var sum=new long[k,4]; for(int y=0;y<sh;y+=3) for(int x=0;x<sw;x+=3){ var p=px[x,y]; int n=Near(c,p.R,p.G,p.B); sum[n,0]+=p.R; sum[n,1]+=p.G; sum[n,2]+=p.B; sum[n,3]++; }
      for(int i=0;i<k;i++) if(sum[i,3]>0) c[i]=new int[]{(int)(sum[i,0]/sum[i,3]),(int)(sum[i,1]/sum[i,3]),(int)(sum[i,2]/sum[i,3])}; }
    // a line pixel is darker than both sides along some direction
    var line=new bool[sw,sh]; int[][] dirs={ new[]{1,0}, new[]{0,1}, new[]{1,1}, new[]{1,-1} };
    for(int y=0;y<sh;y++) for(int x=0;x<sw;x++) foreach(var d in dirs){
      int ax=x+d[0]*reach, ay=y+d[1]*reach, bx=x-d[0]*reach, by=y-d[1]*reach;
      if(ax<0||ay<0||bx<0||by<0||ax>=sw||bx>=sw||ay>=sh||by>=sh) continue;
      int need=Math.Max(dark, Math.Min(L[ax,ay],L[bx,by])*14/100); if(L[ax,ay]-L[x,y]>=need && L[bx,by]-L[x,y]>=need){ line[x,y]=true; break; } }
    var cell=new int[w,h]; var isLine=new bool[w,h]; var lineCol=new Color[w,h];
    for(int j=0;j<h;j++) for(int i=0;i<w;i++){ var cnt=new int[k]; int n=0, ln=0; long r=0,g=0,bl=0;
      for(int y=j*sh/h;y<(j+1)*sh/h;y++) for(int x=i*sw/w;x<(i+1)*sw/w;x++){ var p=px[x,y]; n++; cnt[Near(c,p.R,p.G,p.B)]++; if(line[x,y]){ ln++; r+=p.R; g+=p.G; bl+=p.B; } }
      int b=0; for(int q=1;q<k;q++) if(cnt[q]>cnt[b]) b=q; cell[i,j]=b;
      if(ln>=n*share){ isLine[i,j]=true; int q=Near(c,(int)(r/ln),(int)(g/ln),(int)(bl/ln)); lineCol[i,j]=Color.FromArgb(c[q][0]*82/100,c[q][1]*82/100,c[q][2]*85/100); } }
    // thin L-shaped doubles: drop a corner whose two line neighbours already touch diagonally
    for(int j=1;j<h-1;j++) for(int i=1;i<w-1;i++){ if(!isLine[i,j]) continue;
      bool u=isLine[i,j-1], d=isLine[i,j+1], lf=isLine[i-1,j], rt=isLine[i+1,j];
      if((u&&lf&&!d&&!rt&&!isLine[i+1,j+1])||(u&&rt&&!d&&!lf&&!isLine[i-1,j+1])||(d&&lf&&!u&&!rt&&!isLine[i+1,j-1])||(d&&rt&&!u&&!lf&&!isLine[i-1,j-1])) isLine[i,j]=false; }
    // drop lone specks
    var keep=(bool[,])isLine.Clone();
    for(int j=0;j<h;j++) for(int i=0;i<w;i++){ if(!isLine[i,j]) continue; int nb=0;
      for(int y=Math.Max(0,j-1);y<=Math.Min(h-1,j+1);y++) for(int x=Math.Max(0,i-1);x<=Math.Min(w-1,i+1);x++) if((x!=i||y!=j)&&isLine[x,y]) nb++;
      if(nb==0) keep[i,j]=false; }
    var o=new Bitmap(w*2,h*2);
    for(int j=0;j<h;j++) for(int i=0;i<w;i++){ var col= keep[i,j] ? lineCol[i,j] : Color.FromArgb(c[cell[i,j]][0],c[cell[i,j]][1],c[cell[i,j]][2]);
      for(int dy=0;dy<2;dy++) for(int dx=0;dx<2;dx++) o.SetPixel(i*2+dx,j*2+dy,col); }
    o.Save(dst); }
}
"@
[Px]::Run([IO.Path]::GetFullPath($In), [IO.Path]::GetFullPath($Out), $W, $H, $K, $Reach, $Dark, $Share)
