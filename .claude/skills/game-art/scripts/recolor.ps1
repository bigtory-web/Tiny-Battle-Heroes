# day -> dusk (purple) / night (red): same pixels, only colours change. Crystals = saturated colours, rock = greyish ones.
param($In, $OutDusk, $OutNight)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing;
public static class Re {
  static double Cl(double v){ return v<0?0:v>1?1:v; }
  static Color Hsl(int a, double h, double s, double l){ s=Cl(s); l=Cl(l); h=((h%360)+360)%360;
    double c=(1-Math.Abs(2*l-1))*s, x=c*(1-Math.Abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
    if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
    return Color.FromArgb(a,(int)((r+m)*255),(int)((g+m)*255),(int)((b+m)*255)); }
  public static void Run(string src, string dst, bool night){
    var s=new Bitmap(src); int w=s.Width,h=s.Height; var glow=new bool[w,h]; var o=new Bitmap(w,h);
    for(int y=0;y<h;y++) for(int x=0;x<w;x++){ var p=s.GetPixel(x,y); int mx=Math.Max(p.R,Math.Max(p.G,p.B)), mn=Math.Min(p.R,Math.Min(p.G,p.B)); glow[x,y]=p.A>0 && mx-mn>95; }
    for(int y=0;y<h;y++) for(int x=0;x<w;x++){ var p=s.GetPixel(x,y); if(p.A==0) continue;
      int mx=Math.Max(p.R,Math.Max(p.G,p.B)), mn=Math.Min(p.R,Math.Min(p.G,p.B)); double l=(mx+mn)/510.0, sat=p.GetSaturation(), t=Cl((mx-mn-65)/35.0);
      // light spilled by crystals onto nearby rock, two banded steps in 2x2 pixels
      int near=0; if(t<1) foreach(int d in new[]{4,10}){ bool hit=false; for(int a=0;a<12 && !hit;a++){ int qx=(x/2*2)+(int)Math.Round(d*Math.Cos(a*Math.PI/6)), qy=(y/2*2)+(int)Math.Round(d*Math.Sin(a*Math.PI/6)); if(qx>=0&&qy>=0&&qx<w&&qy<h&&glow[qx,qy]) hit=true; } if(hit) near++; }
      Color rock, cry;
      if(!night){ rock=Hsl(p.A, 262+near*8, sat*0.95+near*0.07, l*0.93+near*0.035); cry=Hsl(p.A, 268+Cl((l-0.45)*3)*24, sat*0.9, l*0.98); }
      else { rock=Hsl(p.A, 352+near*7, 0.30+near*0.14, l*0.84+near*0.05); cry=Hsl(p.A, 354+Cl((l-0.35)*2.2)*44, 0.92, l<0.6 ? l*0.86 : l*0.95); }
      o.SetPixel(x,y,Color.FromArgb(p.A,(int)(rock.R+(cry.R-rock.R)*t),(int)(rock.G+(cry.G-rock.G)*t),(int)(rock.B+(cry.B-rock.B)*t))); }
    o.Save(dst); }
}
"@
[Re]::Run([IO.Path]::GetFullPath($In), [IO.Path]::GetFullPath($OutDusk), $false)
[Re]::Run([IO.Path]::GetFullPath($In), [IO.Path]::GetFullPath($OutNight), $true)
