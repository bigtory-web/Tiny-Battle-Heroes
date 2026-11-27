# crisp pixel version: 40-colour palette (k-means), each block takes its most frequent colour, then 2x nearest
param($In='img\codex\cave\cave5b_src.png', $Out='img\codex\cave\cave_day_b_px.png', [int]$W=360, [int]$H=201, [int]$K=40)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing;
public static class Px {
  static int Near(int[][] c, Color p){ int b=0; long bd=long.MaxValue; for(int i=0;i<c.Length;i++){ long r=p.R-c[i][0], g=p.G-c[i][1], bl=p.B-c[i][2]; long d=r*r+g*g+bl*bl; if(d<bd){bd=d;b=i;} } return b; }
  public static void Run(string src, string dst, int w, int h, int k){
    var s=new Bitmap(src); var rnd=new Random(1); var c=new int[k][];
    for(int i=0;i<k;i++){ var p=s.GetPixel(rnd.Next(s.Width), rnd.Next(s.Height)); c[i]=new int[]{p.R,p.G,p.B}; }
    for(int it=0;it<12;it++){ var sum=new long[k,4]; for(int y=0;y<s.Height;y+=3) for(int x=0;x<s.Width;x+=3){ var p=s.GetPixel(x,y); int n=Near(c,p); sum[n,0]+=p.R; sum[n,1]+=p.G; sum[n,2]+=p.B; sum[n,3]++; }
      for(int i=0;i<k;i++) if(sum[i,3]>0) c[i]=new int[]{(int)(sum[i,0]/sum[i,3]),(int)(sum[i,1]/sum[i,3]),(int)(sum[i,2]/sum[i,3])}; }
    var o=new Bitmap(w*2,h*2);
    for(int j=0;j<h;j++) for(int i=0;i<w;i++){ var cnt=new int[k];
      for(int y=j*s.Height/h;y<(j+1)*s.Height/h;y++) for(int x=i*s.Width/w;x<(i+1)*s.Width/w;x++) cnt[Near(c,s.GetPixel(x,y))]++;
      int b=0; for(int n=1;n<k;n++) if(cnt[n]>cnt[b]) b=n; var col=Color.FromArgb(c[b][0],c[b][1],c[b][2]);
      for(int dy=0;dy<2;dy++) for(int dx=0;dx<2;dx++) o.SetPixel(i*2+dx,j*2+dy,col); }
    o.Save(dst); }
}
"@
[Px]::Run([IO.Path]::GetFullPath($In), [IO.Path]::GetFullPath($Out), $W, $H, $K)
