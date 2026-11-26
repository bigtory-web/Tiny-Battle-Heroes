param([string]$Sheet, [string]$Names, [string]$OutDir, [int]$Gap=6)
# magenta sheet of icons in a row (or rows) -> one 24x24 pixel icon per name
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Collections.Generic;
public static class UpFit {
  static bool Key(Color c){ return (c.R - c.G) > 90 && (c.B - c.G) > 90; }
  // opaque blobs -> bounding boxes, merged when closer than gap
  public static List<Rectangle> Boxes(Bitmap s, int gap){
    var list = new List<Rectangle>(); int W=s.Width, H=s.Height; var seen=new bool[W,H];
    for(int y=0;y<H;y+=4) for(int x=0;x<W;x+=4){ if(seen[x,y]||Key(s.GetPixel(x,y))) continue;
      int x0=x,x1=x,y0=y,y1=y,n=0; var q=new Queue<Point>(); q.Enqueue(new Point(x,y)); seen[x,y]=true;
      while(q.Count>0){ var p=q.Dequeue(); n++; x0=Math.Min(x0,p.X); x1=Math.Max(x1,p.X); y0=Math.Min(y0,p.Y); y1=Math.Max(y1,p.Y);
        for(int d=0;d<4;d++){ int i=p.X+(d==0?4:d==1?-4:0), j=p.Y+(d==2?4:d==3?-4:0); if(i<0||j<0||i>=W||j>=H||seen[i,j]||Key(s.GetPixel(i,j))) continue; seen[i,j]=true; q.Enqueue(new Point(i,j)); } }
      if(n>20) list.Add(Rectangle.FromLTRB(x0,y0,x1+4,y1+4)); }
    for(bool again=true;again;){ again=false; for(int a=0;a<list.Count&&!again;a++) for(int b=a+1;b<list.Count;b++){ var g=list[a]; g.Inflate(gap,gap); if(g.IntersectsWith(list[b])){ list[a]=Rectangle.Union(list[a],list[b]); list.RemoveAt(b); again=true; break; } } }
    return list; }
  public static Bitmap Cell(Bitmap s, Rectangle r, double pitch){
    int w=(int)Math.Round(r.Width/pitch), h=(int)Math.Round(r.Height/pitch); if(w>24) w=24; if(h>24) h=24;
    double kx=(double)r.Width/w, ky=(double)r.Height/h; var o=new Bitmap(24,24); int ox=(24-w)/2, oy=(24-h)/2;
    for(int j=0;j<h;j++) for(int i=0;i<w;i++){
      var cnt=new Dictionary<int,int>(); var col=new Dictionary<int,Color>(); int mag=0, tot=0;
      for(double fy=0.25;fy<0.8;fy+=0.1) for(double fx=0.25;fx<0.8;fx+=0.1){ int px=Math.Min(s.Width-1,(int)(r.X+(i+fx)*kx)), py=Math.Min(s.Height-1,(int)(r.Y+(j+fy)*ky)); var c=s.GetPixel(px,py); tot++;
        if(Key(c)){ mag++; continue; } int k=((c.R>>4)<<8)|((c.G>>4)<<4)|(c.B>>4); int v; cnt.TryGetValue(k,out v); cnt[k]=v+1; col[k]=c; }
      if(mag*2>tot) continue; int best=0,bn=-1; foreach(var kv in cnt) if(kv.Value>bn){ bn=kv.Value; best=kv.Key; }
      var m=col[best]; if(m.R<95 && m.G<45) m=Color.FromArgb(46,12,6); // one outline colour for the whole set
      o.SetPixel(i+ox,j+oy,Color.FromArgb(255,m.R,m.G,m.B)); }
    return o; }
}
"@
$s = New-Object System.Drawing.Bitmap ([IO.Path]::GetFullPath($Sheet))
$list = $Names -split '[ ,]+'
$boxes = [UpFit]::Boxes($s, $Gap) | Where-Object { $_.Width -gt 60 -and $_.Height -gt 60 }
# reading order: rows first, then left to right
$boxes = @($boxes | Sort-Object { [int](($_.Y + $_.Height/2) / ($s.Height/ [math]::Max(1,[math]::Ceiling($list.Count/5)))) }, X)
"found $($boxes.Count) icons: " + (($boxes | ForEach-Object { "$($_.Width)x$($_.Height)" }) -join ' ')
if($boxes.Count -ne $list.Count){ return }
$pitch = [math]::Max(($boxes | Measure-Object Height -Maximum).Maximum, ($boxes | Measure-Object Width -Maximum).Maximum) / 22.0
New-Item -ItemType Directory -Force $OutDir | Out-Null
for($i=0;$i -lt $list.Count;$i++){ [UpFit]::Cell($s, $boxes[$i], $pitch).Save([IO.Path]::GetFullPath("$OutDir\up_$($list[$i]).png")) }
