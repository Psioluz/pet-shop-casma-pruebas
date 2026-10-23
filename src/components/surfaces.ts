import * as THREE from 'three';
import { woodPhotoData } from '@/lib/visual-assets';
const cache=new Map<string,THREE.CanvasTexture>();
export function surface(kind:'roble'|'nogal'|'stone'|'fabric'){
  if(cache.has(kind))return cache.get(kind)!;
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const ctx=c.getContext('2d')!;
  let seed=319;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  if(kind==='roble'||kind==='nogal'){
    ctx.fillStyle=kind==='nogal'?'#927052':'#c8ad82';ctx.fillRect(0,0,1024,1024);
    for(let i=0;i<1250;i++){
      const y=random()*1024;ctx.beginPath();ctx.moveTo(0,y);
      for(let x=0;x<=1024;x+=12)ctx.lineTo(x,y+Math.sin(x*.007+i*.16)*(3+random()*3)+Math.sin(x*.025)*1.8);
      ctx.strokeStyle=i%4?'rgba(48,28,12,.055)':'rgba(255,235,200,.10)';ctx.lineWidth=.5+random()*2;ctx.stroke();
    }
    for(let n=0;n<4;n++){const x=random()*1024,y=random()*1024;for(let r=2;r<26;r+=2){ctx.strokeStyle='rgba(46,26,13,.06)';ctx.beginPath();ctx.ellipse(x,y,r*3,r*.5,.05,0,Math.PI*2);ctx.stroke();}}
  } else {
    ctx.fillStyle=kind==='stone'?'#c4bfb2':'#a69b86';ctx.fillRect(0,0,1024,1024);
    for(let i=0;i<65000;i++){
      const x=random()*1024,y=random()*1024;
      ctx.fillStyle=i%2?'rgba(255,255,255,.07)':'rgba(37,32,24,.045)';ctx.fillRect(x,y,kind==='stone'?2:1,kind==='stone'?2:4);
    }
    if(kind==='stone'){
      ctx.strokeStyle='#9e9a8e';ctx.lineWidth=5;ctx.strokeRect(0,0,1024,1024);
      ctx.strokeStyle='#d7d2c6';ctx.lineWidth=2;ctx.strokeRect(5,5,1014,1014);
    }
  }
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
  cache.set(kind,map);
  if(kind==='roble'||kind==='nogal'){
    const image=new Image();
    image.onload=()=>{
      ctx.drawImage(image,620,143,920,105,0,0,c.width,c.height);
      if(kind==='nogal'){ctx.fillStyle='rgba(52,29,12,.35)';ctx.fillRect(0,0,c.width,c.height);}
      map.needsUpdate=true;window.dispatchEvent(new Event('brio-texture-ready'));
    };
    image.src=woodPhotoData;
  }
  return map;
}
