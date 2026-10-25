'use client';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { studioHDRBase64 } from '@/lib/visual-assets';
import { surface } from './surfaces';
import { snackAssortment, moveWithCollisions, type GateState, type Proposal, type ShopItem, type Vec3, type ViewMode, type ShopLayout } from '@/lib/shop';

export interface Motion { forward:number; strafe:number; lookX:number; lookY:number }
export interface SceneProps {
  layout:ShopLayout; mode:ViewMode; proposal:Proposal; roof:boolean; selected:string|null; gates:GateState; reset:number;
  motion:React.RefObject<Motion>; onSelect:(id:string|null)=>void; onGate:(gate:keyof GateState)=>void;
  onReady:()=>void; onLock:(locked:boolean)=>void; onPosition:(x:number,z:number)=>void;
}
const mint='#80988d', dark='#223b35', orange='#b77a4e', metal='#b5bebb', wood='#d3ad7f';
const Finish=createContext<'roble'|'nogal'>('nogal');
const LabelTextures=createContext<Map<string,THREE.CanvasTexture>>(new Map());
function Box({size,position=[0,0,0],color='#eee9dd',roughness=.65,metalness=0, ...props}:{size:Vec3;position?:Vec3;color?:string;roughness?:number;metalness?:number;rotation?:Vec3;castShadow?:boolean}) {
  const finish=useContext(Finish),map=color===wood?surface(finish):undefined;
  const material=<meshStandardMaterial color={map?(finish==='nogal'?'#79513a':'#c1b39c'):color} map={map} bumpMap={map} bumpScale={.003} roughness={metalness>.5?.24:roughness} metalness={metalness}/>;
  return Math.min(...size)>.045?<RoundedBox args={size} radius={Math.min(.018,Math.min(...size)/5)} smoothness={2} position={position} castShadow receiveShadow {...props}>{material}</RoundedBox>:<mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size}/>{material}</mesh>;
}
function Cylinder({position,radius=.035,height=.7,color=metal,rotation=[0,0,0]}:{position:Vec3;radius?:number;height?:number;color?:string;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[radius,radius,height,16]}/><meshStandardMaterial color={color} roughness={.22} metalness={.85}/></mesh>;
}
function useLabel(text:string,bg:string,fg:string,aspect:number) {
  const {gl}=useThree(),cache=useContext(LabelTextures);
  return useMemo(()=>{
    const key=JSON.stringify([text,bg,fg,aspect]);const existing=cache.get(key);if(existing)return existing;
    const canvas=document.createElement('canvas');canvas.width=aspect>5?1536:512;canvas.height=Math.max(64,Math.round(canvas.width/aspect));
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=fg;
    let font=Math.round(canvas.height*.63);ctx.font=`700 ${font}px Arial`;
    while(ctx.measureText(text).width>canvas.width*.92&&font>12){font-=2;ctx.font=`700 ${font}px Arial`;}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,canvas.height*.52);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=gl.capabilities.getMaxAnisotropy();
    cache.set(key,texture);return texture;
  },[text,bg,fg,aspect,gl,cache]);
}
function Label({text,position,size=[1,.25],bg='#faf8f2',fg=dark,rotation=[0,Math.PI,0]}:{text:string;position:Vec3;size?:[number,number];bg?:string;fg?:string;rotation?:Vec3}) {
  const map=useLabel(text,bg,fg,size[0]/size[1]);
  return <mesh position={position} rotation={rotation}><planeGeometry args={size}/><meshBasicMaterial map={map} side={THREE.DoubleSide} toneMapped={false}/></mesh>;
}
function Paw({position,scale=.3,rotation=[-Math.PI/2,0,0],color=mint}:{position:Vec3;scale?:number;rotation?:Vec3;color?:string}) {
  return <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0,-.14,0]} scale={[1,.75,1]}><circleGeometry args={[.25,24]}/><meshBasicMaterial color={color}/></mesh>
    {[-.3,-.12,.12,.3].map((x,i)=><mesh key={i} position={[x,i===0||i===3?.17:.32,0]} scale={[.72,1,1]}><circleGeometry args={[.11,16]}/><meshBasicMaterial color={color}/></mesh>)}
  </group>;
}
function Floor({layout}:{layout:ShopLayout}) {
  const {width:w,depth:d}=layout.config;
  const map=useMemo(()=>{const t=surface('stone').clone();t.repeat.set(w/.6,d/.6);return t;},[w,d]);
  const wetMap=useMemo(()=>{const t=surface('stone').clone();t.repeat.set(w/.3,(layout.back-layout.partition)/.3);return t;},[w,layout.back,layout.partition]);
  useEffect(()=>()=>{map.dispose();wetMap.dispose();},[map,wetMap]);
  return <>
    <Box size={[w+.16,.16,d+.16]} position={[0,-.105,0]} color="#c5beb0"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.018,0]} receiveShadow><planeGeometry args={[w,d]}/><meshStandardMaterial map={map} bumpMap={map} bumpScale={.012} roughness={.76}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,(layout.back+layout.partition)/2]} receiveShadow><planeGeometry args={[w-.02,layout.back-layout.partition]}/><meshStandardMaterial color="#a3aaa4" map={wetMap} bumpMap={wetMap} bumpScale={.014} roughness={.85}/></mesh>
    <Box size={[w+.5,.08,1.45]} position={[0,-.12,layout.front-.75]} color="#bab6ac"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.16,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color="#b8b5ad" roughness={.94}/></mesh>
  </>;
}
function Gate({position,width,open,onClick,kind='solid',height=2.15}:{position:Vec3;width:number;open:boolean;onClick:()=>void;kind?:'solid'|'grille'|'shutter';height?:number}) {
  return <group position={position} onClick={e=>{e.stopPropagation();onClick();}} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
    {kind==='solid'?<>
      <Box size={[width+.1,.07,.14]} position={[0,height+.08,0]} color={dark}/>
      <group position={[open?width+.08:0,0,-.12]}>
        <Box size={[width,height,.07]} position={[0,height/2,0]} color="#e1dccc" roughness={.45}/>
        <Box size={[width-.09,.18,.018]} position={[0,height-.45,-.045]} color={dark}/>
        <Label text="SOLO PERSONAL" position={[0,height-.45,-.057]} size={[width-.12,.14]} bg={dark} fg="#fff9e8"/>
        <Cylinder position={[-width/2+.13,1.05,-.075]} height={.24} radius={.012} color={dark}/>
        <Box size={[width,.18,.015]} position={[0,.12,-.044]} color="#a1a49b" metalness={.7}/>
      </group>
    </>:<>
      <Box size={[width+.15,.24,.3]} position={[0,height+.14,0]} color="#777e75" metalness={.7}/>
      {[-1,1].map(side=><Box key={side} size={[.055,height,.08]} position={[side*(width/2+.025),height/2,0]} color={dark} metalness={.8}/>)}
      {!open&&(kind==='shutter'?Array.from({length:Math.ceil(height/.12)},(_,i)=><Box key={i} size={[width,.113,.045]} position={[0,.06+i*.12,0]} color="#8b9289" metalness={.7}/>):<>
        {Array.from({length:Math.ceil(width/.15)},(_,i)=><Cylinder key={i} position={[-width/2+.07+i*.15,height/2,0]} radius={.009} height={height} color={dark}/>)}
        {Array.from({length:Math.ceil(height/.2)},(_,i)=><Box key={i} size={[width,.016,.018]} position={[0,.1+i*.2,0]} color={dark} metalness={.85}/>)}
      </>)}
    </>}
  </group>;
}
function Architecture({layout,mode,roof,gates,onGate}:Pick<SceneProps,'layout'|'mode'|'roof'|'gates'|'onGate'>) {
  const {width:w,depth:d,height:h,access}=layout.config,{front,back,partition,entryWidth,serviceWidth}=layout;
  const full=mode==='walk'||roof,wh=full?h:.72,doorHeight=full?2.15:.7;
  return <>
    <Floor layout={layout}/>
    {[-1,1].map(side=><group key={side}>
      <Box size={[.14,wh,d+.16]} position={[side*(w/2+.07),wh/2,0]} color="#e7e3da"/>
      <Box size={[.022,.11,d]} position={[side*(w/2-.012),.055,0]} color="#746d61" roughness={.5}/>
      {full&&<Box size={[.022,.48,d]} position={[side*(w/2-.012),.55,0]} color="#82958a"/>}
      {/* Continuous opaque partition, including the band above its door. */}
      <Box size={[(w-serviceWidth)/2,wh,.14]} position={[side*(w+serviceWidth)/4,wh/2,partition]} color="#b6bbae"/>
      <Box size={[(w-serviceWidth)/2,.1,.018]} position={[side*(w+serviceWidth)/4,.05,partition-.08]} color={dark}/>
    </group>)}
    {full&&<>
      <Box size={[serviceWidth,h-2.24,.14]} position={[0,(h+2.24)/2,partition]} color="#b6bbae"/>
      <Label text="BAÑO Y PELUQUERÍA" position={[0,2.46,partition-.081]} size={[Math.min(2.7,w-.3),.26]} bg={dark} fg="#fff9e8"/>
      <Label text="RECEPCIÓN" position={[w*.3,1.85,partition-.115]} size={[Math.min(1.4,w*.32),.2]} bg="#b6bbae" fg="#223b35"/>
      <Label text="ESPERA" position={[-w*.3,1.65,partition-.115]} size={[Math.min(1.15,w*.3),.2]} bg="#b6bbae" fg="#223b35"/>
    </>}
    <Gate position={[0,0,partition]} width={serviceWidth} height={doorHeight} open={gates.service} onClick={()=>onGate('service')}/>
    <Box size={[w,wh,.14]} position={[0,wh/2,back+.07]} color="#ded9cf"/>
    <Box size={[w,.12,.02]} position={[0,.06,back-.012]} color="#726e63"/>
    {full&&<Label text="BRÍO PET · CUIDADO" position={[0,h-.42,back-.082]} size={[Math.min(w-.5,2.8),.3]} bg={dark} fg="#fff9e8"/>}
    {Array.from({length:Math.floor(w/.32)},(_,i)=><group key={i}>
      {[0,1,2,3].map(j=><Box key={j} size={[.31,.235,.016]} position={[-w/2+.16+i*.32,.45+j*.245,back-.014]} color={j%2?'#c7cec5':'#d4d9d1'} roughness={.35}/>)}
    </group>)}
    <Box size={[.55,.3,.04]} position={[-w*.3,h-.3,back-.035]} color="#d5d9d2"/>
    {[0,1,2,3].map(i=><Box key={i} size={[.48,.018,.018]} position={[-w*.3,h-.39+i*.055,back-.061]} color="#707b72"/>)}
    {full&&<>
      {[-1,1].map(side=><Box key={side} size={[(w-entryWidth)/2,2.5,.2]} position={[side*(w+entryWidth)/4,1.25,front]} color="#e4dfd1"/>)}
      <Box size={[w,Math.max(.12,h-2.5),.2]} position={[0,(h+2.5)/2,front]} color={dark}/>
      <Label text="BRÍO PET" position={[0,h-.22,front-.111]} size={[Math.min(2.8,w-.4),.3]} rotation={[0,Math.PI,0]} bg={dark} fg="#fff9e8"/>
      <Box size={[w+.2,.065,1.5]} position={[0,2.65,front-.68]} color="#496650"/>
      <Label text="TIENDA · SNACKS · GROOMING" position={[0,2.58,front-1.45]} size={[Math.min(3.7,w-.2),.16]} bg={dark} fg="#fff9e8"/>
      {access!=='abierto'&&<Gate position={[0,0,front]} width={entryWidth} height={2.48} kind={access==='reja'?'grille':'shutter'} open={gates.entrance} onClick={()=>onGate('entrance')}/>}
    </>}
    {Array.from({length:Math.max(2,Math.ceil(d/3))},(_,i)=>(i+.5)/Math.max(2,Math.ceil(d/3))).flatMap(part=>[-1,1].map(side=><group key={`${part}${side}`} position={[side*w*.25,h-.065,front+d*part]} visible={full}>
      <Box size={[.1,.04,Math.min(1.3,d*.14)]} color="#7c7c70" metalness={.45}/>
      <mesh position={[0,-.022,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.085,Math.min(1.25,d*.14)]}/><meshStandardMaterial color="#fff6df" emissive="#ffedce" emissiveIntensity={2} side={THREE.DoubleSide}/></mesh>
    </group>))}
    {roof&&<Box size={[w+.12,.12,d+.12]} position={[0,h+.06,0]} color="#dbd8d0"/>}
  </>;
}
function Packaging({label,color}:{label:string;color:string}){
  const cache=useContext(LabelTextures);
  const map=useMemo(()=>{
    const key='pack-'+label+color;const existing=cache.get(key);if(existing)return existing;
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;const c=canvas.getContext('2d')!;
    c.fillStyle='#f3ead7';c.fillRect(0,0,384,512);c.fillStyle=color;c.fillRect(0,0,384,70);c.fillRect(0,370,384,142);
    c.textAlign='center';c.fillStyle='#263d33';c.font='bold 58px Georgia';c.fillText('brío pet',192,137);
    c.font='bold 24px Arial';c.fillText(label==='ARENA'?'HIGIENE NATURAL':'NUTRICIÓN DIARIA',192,181);
    c.fillStyle=color;c.beginPath();c.ellipse(192,260,55,39,0,0,Math.PI*2);c.fill();
    [-57,-20,20,57].forEach((x,i)=>{c.beginPath();c.ellipse(192+x,211-(i===1||i===2?15:0),13,19,x*.009,0,Math.PI*2);c.fill();});
    c.font='bold 27px Arial';c.fillStyle='#263d33';c.fillText(label,192,341);
    c.fillStyle='#fff7e8';c.font='22px Arial';c.fillText(label==='ARENA'?'CONTROL DE OLORES':'POLLO · ARROZ · VITAMINAS',192,411);c.font='bold 36px Arial';c.fillText(label==='SNACK'?'250 g':'3 kg',192,473);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;cache.set(key,t);return t;
  },[label,color,cache]);
  return <mesh position={[0,.19,.080]}><planeGeometry args={[.185,.275]}/><meshStandardMaterial map={map} roughness={.48}/></mesh>;
}
function Bag({position,color,label,side=1}:{position:Vec3;color:string;label:string;side?:number}) {
  const geometry=useMemo(()=>{
    const shape=new THREE.Shape();shape.moveTo(-.1,.02);shape.lineTo(-.117,.06);shape.lineTo(-.112,.27);shape.lineTo(-.095,.35);shape.lineTo(.095,.35);shape.lineTo(.112,.27);shape.lineTo(.117,.06);shape.lineTo(.1,.02);shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.009,bevelThickness:.009});g.translate(0,0,-.07);return g;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={position} rotation={[0,side*Math.PI/2,0]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={.46} clearcoat={.18}/></mesh>
    <Box size={[.2,.014,.035]} position={[0,.35,0]} color={color} roughness={.65}/>
    <Box size={[.17,.005,.037]} position={[0,.326,0]} color="#dac9a7" roughness={.8}/>
    <Packaging label={label} color={color}/>
  </group>;
}
function SnackPiece({shape,color,index=0}:{shape:string;color:string;index?:number}) {
  if(shape==='cookie')return <group rotation={[Math.PI/2,0,index*.7]}><mesh castShadow><cylinderGeometry args={[.035,.037,.014,12]}/><meshStandardMaterial color={color} roughness={.92}/></mesh>{[-1,1].map(n=><mesh key={n} position={[n*.015,-.009,.009]}><sphereGeometry args={[.004,6,4]}/><meshStandardMaterial color="#744329"/></mesh>)}</group>;
  if(shape==='ring')return <mesh rotation={[Math.PI/2,.3,index]} castShadow><torusGeometry args={[.026,.011,7,14]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
  if(shape==='fish')return <group rotation={[0,0,index*.8]}><mesh scale={[.038,.014,.018]} castShadow><sphereGeometry args={[1,10,7]}/><meshStandardMaterial color={color} roughness={.9}/></mesh><mesh position={[-.04,0,0]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.021,.025,3]}/><meshStandardMaterial color={color}/></mesh></group>;
  if(shape==='dental')return <group rotation={[0,0,index*.13]}><Box size={[.022,.12,.025]} color={color}/>{[-.035,0,.035].map(y=><Box key={y} size={[.034,.016,.034]} position={[0,y,0]} color={color}/>)}</group>;
  if(shape==='jerky')return <group rotation={[.1,0,index*.23]}><Box size={[.025,.12,.012]} color={color}/>{[-.025,.015,.045].map(y=><Box key={y} size={[.026,.003,.014]} position={[0,y,0]} color="#753e28"/>)}</group>;
  return <Box size={[.028,.023,.025]} color={color} rotation={[.3,index,.4]}/>;
}
function SnackJar({product,index=0}:{product:typeof snackAssortment[number];index?:number}) {
  return <group>
    <mesh position={[0,.15,0]}><cylinderGeometry args={[.102,.1,.27,24,1,true]}/><meshPhysicalMaterial color="#f2f1dc" transparent opacity={.16} roughness={.12} clearcoat={1} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <Cylinder position={[0,.018,0]} radius={.1} height={.012} color="#c4b591"/>
    {Array.from({length:9},(_,i)=><group key={i} position={[Math.cos(i*2.4+index)*(.022+(i%3)*.019),.07+Math.floor(i/3)*.062,Math.sin(i*2.4+index)*(.025+(i%3)*.018)]} rotation={[i*.2,i,0]}><SnackPiece shape={product.shape} color={product.color} index={i}/></group>)}
    <mesh position={[0,.293,0]} castShadow><cylinderGeometry args={[.109,.109,.027,24]}/><meshStandardMaterial color={dark} roughness={.55}/></mesh>
    <Label text={['GALLETAS','POLLO','PESCADO','DENTALES','PREMIOS','AROS'][index%6]} position={[0,.115,-.104]} size={[.15,.055]} bg="#fff6df" fg="#223b35"/>
  </group>;
}
function FoodTin({position,side}:{position:Vec3;side:number}) {return <group position={position} rotation={[0,side*Math.PI/2,0]}>
  {[0,1].map(n=><group key={n} position={[0,n*.13,0]}><Cylinder position={[0,.061,0]} radius={.075} height={.12} color="#b6bcb0"/><Label text={n?'PATÉ GATO':'POLLO'} position={[0,.062,-.075]} size={[.12,.065]} bg={n?'#e0c889':'#c9d8b8'} rotation={[0,Math.PI,0]}/></group>)}
</group>;}
function Bottle({position,color}:{position:Vec3;color:string}) {
  const profile=useMemo(()=>[new THREE.Vector2(.047,0),new THREE.Vector2(.059,.018),new THREE.Vector2(.059,.19),new THREE.Vector2(.053,.214),new THREE.Vector2(.026,.23),new THREE.Vector2(.025,.265)],[]);
  return <group position={position}>
    <mesh castShadow><latheGeometry args={[profile,20]}/><meshPhysicalMaterial color={color} roughness={.32} clearcoat={.6}/></mesh>
    <Cylinder position={[0,.27,0]} radius={.027} height={.035} color={dark}/>
    <Box size={[.07,.014,.027]} position={[.018,.293,0]} color={dark}/>
    <Label text="BRÍO · AVENA" position={[0,.12,-.061]} size={[.1,.075]} bg="#ece8d9" fg={dark}/>
  </group>;
}
const boutiqueColors=['#c67d69','#d7b260','#73948b','#7c8faa','#d2b3ae','#e5d8b9'];
function Tube({points,color=metal,radius=.008}:{points:Vec3[];color?:string;radius?:number}) {
  const coordinates=JSON.stringify(points);
  const curve=useMemo(()=>new THREE.CatmullRomCurve3((JSON.parse(coordinates) as Vec3[]).map(p=>new THREE.Vector3(...p))),[coordinates]);
  return <mesh castShadow><tubeGeometry args={[curve,20,radius,7,false]}/><meshStandardMaterial color={color} roughness={.45} metalness={color===metal?.8:0}/></mesh>;
}
function Garment({color,variant=0}:{color:string;variant?:number}) {
  const geometry=useMemo(()=>{
    const s=new THREE.Shape();s.moveTo(-.055,0);s.quadraticCurveTo(0,-.038,.055,0);s.lineTo(.112,-.026);s.lineTo(.18,-.12);s.lineTo(.126,-.16);s.lineTo(.103,-.12);s.lineTo(.103,-.36);s.quadraticCurveTo(0,-.4,-.103,-.36);s.lineTo(-.103,-.12);s.lineTo(-.126,-.16);s.lineTo(-.18,-.12);s.lineTo(-.112,-.026);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.018,bevelEnabled:true,bevelSegments:2,bevelSize:.006,bevelThickness:.005,steps:1});g.translate(0,0,-.009);return g;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group>
    <Tube points={[[0,.05,.012],[-.12,-.012,.012],[-.14,-.04,.012],[.14,-.04,.012],[.12,-.012,.012],[0,.05,.012]]} radius={.005} color="#bf9f64"/>
    <Tube points={[[0,.05,.012],[0,.12,.012],[.025,.145,.012],[.04,.128,.012],[.025,.105,.012]]} radius={.005} color="#bf9f64"/>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={color} roughness={variant%3===1?.32:.9} clearcoat={variant%3===1?.35:0} bumpMap={variant%3===1?undefined:surface('fabric')} bumpScale={.002}/></mesh>
    {variant%3===0&&[-.16,-.21,-.26].map(y=><Box key={y} size={[.204,.016,.004]} position={[0,y,-.018]} color="#fff1d9"/>)}
    {variant%3===1&&<><mesh position={[0,.016,.04]} rotation={[Math.PI/2,0,0]} scale={[1,.7,1]}><torusGeometry args={[.067,.025,10,20,Math.PI]}/><meshStandardMaterial color={color}/></mesh><Box size={[.008,.29,.004]} position={[0,-.19,-.02]} color="#e5d8b9"/></>}
    {variant%3===2&&<Paw position={[0,-.19,-.022]} rotation={[0,Math.PI,0]} scale={.17} color="#fff1d9"/>}
    <Box size={[.2,.018,.025]} position={[0,-.365,0]} color={variant%3===0?'#fff1d9':color}/>
  </group>;
}
function Bandana({color}:{color:string}) {return <group>
  <mesh castShadow><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([-.14,0,0,.14,0,0,0,-.22,0]),3]}/><bufferAttribute attach="attributes-normal" args={[new Float32Array([0,0,-1,0,0,-1,0,0,-1]),3]}/></bufferGeometry><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={.95} bumpMap={surface('fabric')} bumpScale={.002}/></mesh>
  <Tube points={[[-.14,0,0],[0,.025,0],[.14,0,0]]} color="#e6d5b3" radius={.007}/>
  <Paw position={[0,-.1,-.005]} rotation={[0,Math.PI,0]} scale={.12} color="#fff3dc"/>
</group>;}
function Harness({color}:{color:string}) {return <group>
  {[-.045,-.23].map((y,i)=><mesh key={y} position={[0,y,0]} scale={[1,i?1.1:.75,1]} castShadow><torusGeometry args={[i?.08:.06,.014,8,24]}/><meshStandardMaterial color={color} roughness={.8}/></mesh>)}
  {[-1,1].map(side=><Box key={side} size={[.02,.19,.022]} position={[side*.055,-.14,0]} color={color} rotation={[0,0,-side*.1]}/>)}
  <Box size={[.045,.035,.029]} position={[.055,-.14,-.007]} color="#d8bd7c" metalness={.75}/>
  <mesh position={[0,.02,0]}><torusGeometry args={[.018,.004,6,16]}/><meshStandardMaterial color={metal} metalness={.8} roughness={.25}/></mesh>
</group>;}
function Collar({color}:{color:string}) {return <group>
  <mesh castShadow><torusGeometry args={[.075,.015,8,24]}/><meshStandardMaterial color={color} roughness={.8}/></mesh>
  <Box size={[.04,.025,.034]} position={[.055,-.048,-.007]} color="#d8bd7c" metalness={.75}/>
  <mesh position={[0,-.102,0]}><circleGeometry args={[.019,16]}/><meshStandardMaterial color="#d8bd7c" metalness={.7}/></mesh>
</group>;}
function Leash({color}:{color:string}) {return <group>
  <Tube points={[[0,0,0],[-.055,-.035,0],[-.065,-.14,0],[0,-.18,0],[.065,-.14,0],[.055,-.035,0],[0,0,0],[.012,-.2,0],[.03,-.42,0]]} radius={.012} color={color}/>
  <Box size={[.02,.055,.015]} position={[.03,-.45,0]} color="#d8bd7c" metalness={.8}/>
</group>;}
function Toy({variant=0,color=mint}:{variant?:number;color?:string}) {
  if(variant%4===0)return <group><mesh castShadow><sphereGeometry args={[.075,16,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh><mesh rotation={[.5,.2,.5]}><torusGeometry args={[.075,.004,6,24]}/><meshStandardMaterial color="#f4ebd1"/></mesh></group>;
  if(variant%4===1)return <group rotation={[0,0,.4]}><Tube points={[[-.1,0,0],[-.04,.014,0],[.04,-.014,0],[.1,0,0]]} color={color} radius={.023}/>{[-.1,.1].map(x=><mesh key={x} position={[x,0,0]} castShadow><sphereGeometry args={[.035,12,8]}/><meshStandardMaterial color="#eee2bb" roughness={1}/></mesh>)}</group>;
  if(variant%4===2)return <mesh castShadow rotation={[Math.PI/2,.3,0]}><torusGeometry args={[.073,.022,10,24]}/><meshStandardMaterial color={color} roughness={.6}/></mesh>;
  return <group>
    <mesh position={[0,.015,0]} scale={[.07,.09,.05]} castShadow><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color={color} roughness={1} bumpMap={surface('fabric')} bumpScale={.003}/></mesh>
    <mesh position={[0,.115,0]} castShadow><sphereGeometry args={[.055,14,10]}/><meshStandardMaterial color={color} roughness={1}/></mesh>
    {[-1,1].map(side=><group key={side}><mesh position={[side*.045,.15,0]}><sphereGeometry args={[.023,10,8]}/><meshStandardMaterial color={color}/></mesh><mesh position={[side*.073,.03,0]} scale={[.025,.05,.025]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color={color}/></mesh><mesh position={[side*.02,.12,-.049]}><sphereGeometry args={[.005,6,4]}/><meshStandardMaterial color={dark}/></mesh></group>)}
    <mesh position={[0,.099,-.05]}><sphereGeometry args={[.01,8,6]}/><meshStandardMaterial color={dark}/></mesh>
  </group>;
}
function Bowl({color}:{color:string}) {
  const profile=useMemo(()=>[new THREE.Vector2(.11,0),new THREE.Vector2(.105,.02),new THREE.Vector2(.09,.075),new THREE.Vector2(.078,.075),new THREE.Vector2(.083,.027),new THREE.Vector2(0,.025)],[]);
  return <mesh castShadow><latheGeometry args={[profile,24]}/><meshStandardMaterial color={color} roughness={.3} metalness={.3}/></mesh>;
}
function PetBedSample({color}:{color:string}){return <group>
  <mesh position={[0,.07,0]} rotation={[Math.PI/2,0,0]} scale={[1,.86,1]} castShadow><torusGeometry args={[.13,.035,10,28]}/><meshStandardMaterial color={color} roughness={.98} bumpMap={surface('fabric')} bumpScale={.004}/></mesh>
  <mesh position={[0,.045,0]} scale={[.12,.04,.105]} castShadow><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#e9d9b8" roughness={1}/></mesh>
</group>;}
function WalkingBag({color}:{color:string}){return <group>
  <RoundedBox args={[.16,.19,.07]} radius={.024} smoothness={3} position={[0,-.12,0]} castShadow><meshStandardMaterial color={color} bumpMap={surface('fabric')} bumpScale={.002} roughness={.9}/></RoundedBox>
  <Tube points={[[-.07,-.06,0],[-.08,.1,0],[0,.15,0],[.08,.1,0],[.07,-.06,0]]} color={color} radius={.008}/>
  <Paw position={[0,-.12,-.04]} rotation={[0,Math.PI,0]} scale={.12} color="#f4e5c7"/>
</group>;}
function FoldedClothes({color}:{color:string}){return <group>{[0,1,2].map(i=><RoundedBox key={i} args={[.27,.045,.2]} radius={.015} smoothness={2} position={[0,.025+i*.047,0]} castShadow><meshStandardMaterial color={i===1?'#e6d6b3':color} bumpMap={surface('fabric')} bumpScale={.003} roughness={.95}/></RoundedBox>)}</group>;}
function WallDisplay({item}:{item:ShopItem}) {
  const d=item.size[2],side=item.position[0]<0?1:-1,department=item.department||'boutique';
  const clothes=department==='ropa'||department==='boutique',toys=department==='juguetes';
  const n=Math.max(1,Math.min(7,Math.floor(d/.43))),spacing=d/n;
  const colors=department==='ropa'?'#dec6b9':toys?'#d7d6b7':'#b7ccc2';
  const title=department==='ropa'?'ROPA Y BANDANAS':toys?'JUEGO Y DESCANSO':department==='boutique'?'ROPA · PASEO · JUEGO':department==='higiene'?'HIGIENE Y CUIDADO':'PASEO Y ACCESORIOS';
  return <group rotation={[0,-side*Math.PI/2,0]}>
    <Box size={[d,1.85,.045]} position={[0,1.02,.2]} color={colors}/>
    {Array.from({length:Math.max(2,Math.floor(d/.14))},(_,i)=><Box key={i} size={[.015,1.75,.012]} position={[-d/2+.06+i*.14,1.02,.168]} color="#f1e6ce"/>)}
    <Box size={[d,.12,.48]} position={[0,.08,0]} color={wood}/>
    <Box size={[d,.27,.06]} position={[0,2.04,.12]} color={department==='ropa'?'#a45e4e':dark}/>
    <Label text={title} position={[0,2.04,.084]} size={[d-.04,.2]} bg={department==='ropa'?'#a45e4e':dark} fg="#fff7e2"/>
    {clothes?<>
      <Cylinder position={[0,1.83,-.08]} radius={.012} height={d-.06} rotation={[0,0,Math.PI/2]} color="#c2a16a"/>
      <Cylinder position={[0,1.12,-.08]} radius={.012} height={d-.06} rotation={[0,0,Math.PI/2]} color="#c2a16a"/>
      {Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),1.69,-.09]} scale={Math.min(1,spacing/.4)}><Garment color={boutiqueColors[i%6]} variant={i}/></group>)}
      {Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),.98,-.09]} scale={Math.min(1,spacing/.4)}>{department==='boutique'&&(n===1||i%3!==0)?n===1||i%3===1?<Harness color={boutiqueColors[i%6]}/>:<Leash color={boutiqueColors[i%6]}/>:i%2?<Garment color={boutiqueColors[(i+2)%6]} variant={i+1}/>:<Bandana color={boutiqueColors[(i+3)%6]}/>}</group>)}
      <Box size={[d,.035,.44]} position={[0,.4,0]} color={wood}/>
      {Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),.43,0]} scale={Math.min(1,spacing/.34)}>{department==='boutique'&&(n===1||i%2)?<group><group position={[n===1?-.065:0,n===1?.08:0,0]}><Toy variant={n===1?3:i} color={boutiqueColors[i%6]}/></group>{n===1&&<Bottle position={[.08,0,0]} color={mint}/>}</group>:<FoldedClothes color={boutiqueColors[i%6]}/>}</group>)}
    </>:toys?<>
      {[.35,.88,1.4].map((y,row)=><group key={y}>
        <Box size={[d,.04,.46]} position={[0,y,0]} color={wood}/>
        {Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),y+.13,0]} scale={Math.min(1,spacing/.32)}>{row===0?i%2?<FoldedClothes color={boutiqueColors[i%6]}/>:<PetBedSample color={boutiqueColors[i%6]}/>:<Toy variant={i+row} color={boutiqueColors[i%6]}/>}</group>)}
      </group>)}
      <Label text="PELUCHES · CUERDAS · PELOTAS" position={[0,1.78,.16]} size={[d-.08,.13]} bg={colors}/>
    </>:<>
      {[1.6,1.06].map((y,row)=><group key={y}>{Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),y,-.06]} scale={Math.min(1,spacing/.32)}>
        <Cylinder position={[0,.07,.07]} radius={.008} height={.15} rotation={[Math.PI/2,0,0]} color="#c2a16a"/>
        {department==='higiene'?<Bottle position={[0,-.24,0]} color={boutiqueColors[i%6]}/>:row===0?i%2?<Harness color={boutiqueColors[i%6]}/>:<Collar color={boutiqueColors[i%6]}/>:i%3===1?<WalkingBag color={boutiqueColors[i%6]}/>:i%3===2?<Bandana color={boutiqueColors[i%6]}/>:<Leash color={boutiqueColors[i%6]}/>}
      </group>)}</group>)}
      <Box size={[d,.04,.44]} position={[0,.36,0]} color={wood}/>
      {Array.from({length:n},(_,i)=><group key={i} position={[-d/2+spacing*(i+.5),.39,0]} scale={Math.min(1,spacing/.32)}>{i%2?<Bottle position={[0,0,0]} color={boutiqueColors[i%6]}/>:<Bowl color={boutiqueColors[i%6]}/>}</group>)}
    </>}
    <Box size={[d,.025,.07]} position={[0,1.91,.12]} color="#dfbd7e"/>
  </group>;
}
function GiftIsland(){return <>
  <Box size={[.8,.12,1.15]} position={[0,.14,0]} color={wood}/><Box size={[.8,.06,1.15]} position={[0,.78,0]} color="#c6d2bd"/>
  {[-.29,.29].flatMap(x=>[-.46,.46].map(z=><Cylinder key={`${x}-${z}`} position={[x,.42,z]} height={.72} radius={.018} color="#c2a16a"/>))}
  {Array.from({length:6},(_,i)=><group key={i} position={[i<3?-.19:.19,.94,-.35+(i%3)*.35]}><Toy variant={i} color={boutiqueColors[i]}/></group>)}
  <Label text="NOVEDADES" position={[0,.67,-.583]} size={[.7,.18]} bg={dark} fg="#fff5dd"/>
</>;}
function Shelf({item,proposal}:{item:ShopItem;proposal:Proposal}) {
  if(item.department&&item.department!=='alimentos')return <WallDisplay item={item}/>;
  const d=item.size[2], side=item.position[0]<0?1:-1;
  const count=Math.max(2,Math.min(proposal==='economica'?7:10,Math.floor(d/.29)));
  return <>
    {[.3,1.1,1.85].map(y=><Box key={y} size={[.035,.045,d]} position={[-side*.22,y,0]} color={dark}/>)}
    {[-d/2,d/2].map(z=><Box key={z} size={[.45,1.9,.035]} position={[0,.95,z]} color={wood}/>)}
    {[.12,.57,1.02,1.47,1.91].map((y,j)=><group key={y}>
      <Box size={[.48,.035,d]} position={[0,y,0]} color={j===4?dark:wood}/>
      {j<4&&Array.from({length:count},(_,i)=>{
        const z=-d/2+.16+i*(d-.32)/(count-1);
        return item.id.startsWith('alimentos')?j===1?<FoodTin key={i} position={[0,y+.025,z]} side={-side}/>:j===3?<Bag key={i} position={[0,y+.025,z]} color={boutiqueColors[i%6]} label={i%2?'GATO':'PERRO'} side={side}/>:<Bag key={i} position={[side*.015,y+.025,z]} color={['#bb6d44','#406c5b','#d7bb7f','#6e838c'][(i+j)%4]} label={j===0?(i%2?'PERRO':'GATO'):(i%2?'SNACK':'HÚMEDO')} side={side}/>
          : j<2?<Bottle key={i} position={[0,y+.025,z]} color={['#bfd0c3','#e1af79','#d5d5c7'][i%3]}/>
          : j===2?<mesh key={i} position={[0,y+.14,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.09,.018,8,20]}/><meshStandardMaterial color={i%2?orange:dark}/></mesh>
          :<mesh key={i} position={[0,y+.12,z]}><sphereGeometry args={[.095,16,12]}/><meshStandardMaterial color={i%2?orange:mint}/></mesh>;
      })}
    </group>)}
    <Label text={item.id.startsWith('alimentos')?'ALIMENTOS Y NUTRICIÓN':'HIGIENE Y ACCESORIOS'} position={[side*.248,2.04,0]} size={[d-.12,.22]} rotation={[0,side*Math.PI/2,0]} bg={dark} fg="#f5f1e7"/>
    {item.id.startsWith('accesorios')&&[0,1,2].map(i=><group key={i} position={[side*.25,1.15,-d*.28+i*d*.25]}>
      <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.095,.012,8,24]}/><meshStandardMaterial color={i%2?orange:dark}/></mesh>
      <Box size={[.025,.25,.022]} position={[0,-.16,0]} color={i%2?orange:dark}/>
      {i===2&&<><mesh position={[0,-.23,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.08,.012,8,24]}/><meshStandardMaterial color={dark}/></mesh>{[-.06,.06].map(z=><Box key={z} size={[.025,.22,.016]} position={[0,-.115,z]} color={dark}/>)}</>}
    </group>)}
  </>;
}
function Counter(){return <>
  <Box size={[1.6,.96,.6]} position={[0,.48,0]} color="#f1eee5"/>
  {Array.from({length:20},(_,i)=><Box key={i} size={[.045,.88,.035]} position={[-.76+i*.08,.46,-.319]} color={wood}/>)}
  <Box size={[1.7,.055,.73]} position={[0,.99,0]} color="#eee8d9"/>
  <Label text="brío pet" position={[-.22,.62,-.34]} size={[.8,.25]} bg={wood}/>
  <Paw position={[.51,.62,-.341]} rotation={[0,Math.PI,0]} scale={.27} color={dark}/>
  <Box size={[.32,.025,.23]} position={[.35,1.03,.04]} color={dark}/>
  <Box size={[.035,.18,.035]} position={[.35,1.12,.05]} color={dark}/>
  <Box size={[.38,.25,.035]} position={[.35,1.28,.07]} color={dark} rotation={[-.15,0,0]}/>
  <Label text="BRÍO / CAJA" position={[.35,1.28,.045]} size={[.33,.18]} bg="#a5bcab"/>
  <Box size={[.12,.06,.18]} position={[-.42,1.055,0]} color={dark}/><group position={[-.66,1.02,.02]}><Foliage scale={.23}/></group>
</>;}
function Bench(){return <>
  <Box size={[1.3,.12,.54]} position={[0,.43,0]} color={orange}/>
  <Box size={[1.3,.32,.09]} position={[0,.66,.22]} color={orange}/>{[-.36,.36].map((x,i)=><RoundedBox key={x} args={[.32,.28,.1]} radius={.045} smoothness={3} position={[x,.64,.13]} rotation={[-.15,0,i?.12:-.12]} castShadow><meshStandardMaterial color={i?'#dbbe8d':'#8ca18b'} bumpMap={surface('fabric')} bumpScale={.004} roughness={.95}/></RoundedBox>)}
  {[-.52,.52].flatMap(x=>[-.17,.17].map(z=><Cylinder key={`${x}${z}`} position={[x,.2,z]} radius={.025} height={.4} color={dark}/>))}
</>;}
function Bath({proposal}:{proposal:Proposal}){
  const color=proposal==='economica'?'#dddcd2':'#a9b6b3';
  const material=proposal==='economica'?.1:.98;
  const hose=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(.5,1.5,.28),new THREE.Vector3(.6,1.02,.25),new THREE.Vector3(.3,.78,.25),new THREE.Vector3(.1,1.25,.3)]),[]);
  return <>
    {[-.6,.6].flatMap(x=>[-.3,.3].map(z=><Cylinder key={`${x}${z}`} position={[x,.4,z]} height={.8} radius={.035}/>))}
    <Box size={[1.5,.08,.85]} position={[0,.7,0]} color={color} metalness={material}/>
    {[-.72,.72].map(x=><Box key={x} size={[.06,.38,.85]} position={[x,.92,0]} color={color} metalness={material}/>)}
    {[-.4,.4].map(z=><Box key={z} size={[1.5,.38,.055]} position={[0,.92,z]} color={color} metalness={material}/>)}
    <Box size={[1.5,.55,.04]} position={[0,1.35,.4]} color={color} metalness={material}/>
    <Cylinder position={[.52,1.7,.36]} radius={.015} height={.55}/>
    <Cylinder position={[.52,1.94,.28]} radius={.048} height={.025} rotation={[Math.PI/3,0,0]}/>
    <mesh><tubeGeometry args={[hose,28,.012,8,false]}/><meshStandardMaterial color="#465b55"/></mesh>
    <Bottle position={[-.5,1.1,.26]} color={mint}/>
    <Cylinder position={[0,.748,0]} radius={.05} height={.005} color="#263b33"/>
    <Box size={[.23,.015,.23]} position={[0,.005,-.65]} color={metal}/>
    {[0,1,2,3].map(i=><Box key={i} size={[.18,.017,.014]} position={[0,.012,-.72+i*.045]} color={dark}/>)}
  </>;
}
function Groom({proposal}:{proposal:Proposal}){return <>
  <Box size={[1.2,.065,.65]} position={[0,.85,0]} color={dark}/>
  {proposal==='economica'?[-.42,.42].map(x=><group key={x}><Cylinder position={[x,.4,-.19]} height={.8}/><Cylinder position={[x,.4,.19]} height={.8}/></group>):<><Box size={[.75,.06,.5]} position={[0,.055,0]} color={metal}/><Cylinder position={[0,.44,0]} height={.76} radius={.07}/><Box size={[.3,.04,.07]} position={[.25,.12,0]} color={dark}/></>}
  <Cylinder position={[.53,1.3,.24]} height={.95} radius={.014}/>
  <Cylinder position={[.26,1.77,.24]} height={.54} radius={.014} rotation={[0,0,Math.PI/2]}/>
  <Cylinder position={[0,1.58,.24]} height={.36} radius={.008} color={orange}/>
  <mesh position={[0,1.32,.24]}><torusGeometry args={[.09,.009,8,24]}/><meshStandardMaterial color={orange}/></mesh>
  <Box size={[.08,.035,.16]} position={[-.43,.91,.14]} color="#84948b"/>
  <Box size={[.06,.018,.1]} position={[-.43,.92,.03]} color={metal}/>
  {[-.28,-.2].map(x=><mesh key={x} position={[x,.9,.14]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.035,.006,8,16]}/><meshStandardMaterial color={metal}/></mesh>)}
  <Box size={[.018,.01,.2]} position={[-.24,.9,-.01]} color={metal}/>
</>;}
function Dryer(){
  const hose=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(0,.3,-.15),new THREE.Vector3(-.25,.55,-.18),new THREE.Vector3(-.3,.85,.1),new THREE.Vector3(-.12,1.1,.04)]),[]);
  return <><Box size={[.4,.06,.42]} position={[0,.045,0]} color={dark}/><Cylinder position={[0,.72,0]} height={1.3} radius={.02}/><Cylinder position={[0,1.3,0]} radius={.12} height={.3} color={orange} rotation={[Math.PI/2,0,0]}/><Cylinder position={[0,.3,0]} radius={.14} height={.3} color={dark} rotation={[Math.PI/2,0,0]}/><mesh><tubeGeometry args={[hose,30,.03,8,false]}/><meshStandardMaterial color="#4a5e56"/></mesh></>;
}
function Cabinet({towels=false}:{towels?:boolean}){const w=towels?.45:1.05,h=towels?1.6:2.1,d=towels?.7:.5;return <>
  <Box size={[w,h,d]} position={[0,h/2,0]} color={towels?'#c5cec0':wood}/>
  <Box size={[w-.04,h*.56,.025]} position={[0,h*.29,-d/2-.015]} color="#ede9df"/>
  {!towels&&<Box size={[.025,h*.56,.03]} position={[0,h*.29,-d/2-.035]} color={wood}/>}
  <Cylinder position={[w*.22,h*.4,-d/2-.04]} height={.15} radius={.009}/>
  {towels&&[0,1,2].map(i=><Box key={i} size={[.34,.09,.42]} position={[0,h+.05+i*.09,0]} color={i%2?mint:'#f6f2e5'}/>)}
  <Label text={towels?'LIMPIEZA':'ALMACÉN'} position={[0,h*.82,-d/2-.018]} size={[w*.85,.12]} bg={towels?'#c5cec0':wood}/>
</>;}
function Plant(){return <>
  <mesh position={[0,.16,0]}><cylinderGeometry args={[.15,.1,.31,24]}/><meshStandardMaterial color="#c58b60" roughness={.9}/></mesh>
  {[0,1,2,3,4,5].map((i)=><group key={i} rotation={[0,i*1.1,0]}><Cylinder position={[0,.44,0]} height={.55} radius={.007} color={dark}/><mesh position={[.09,.6+i*.03,0]} rotation={[0,0,-.5]} scale={[.09,.24,.025]}><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color={i%2?'#678b62':'#426b52'}/></mesh></group>)}
</>;}
function Bed(){return <>
  <mesh position={[-.18,.12,0]} rotation={[Math.PI/2,0,0]} scale={[1,.92,1]} castShadow><torusGeometry args={[.18,.055,14,36]}/><meshStandardMaterial color="#b7815e" roughness={.98} bumpMap={surface('fabric')} bumpScale={.004}/></mesh>
  <mesh position={[-.18,.07,0]} scale={[.19,.065,.185]} castShadow><sphereGeometry args={[1,28,16]}/><meshStandardMaterial color="#c9a382" roughness={1}/></mesh>
  <RoundedBox args={[.4,.32,.48]} radius={.06} smoothness={3} position={[.28,.19,0]} castShadow><meshPhysicalMaterial color="#d7d3c6" roughness={.37} clearcoat={.2}/></RoundedBox>
  <RoundedBox args={[.32,.25,.02]} radius={.035} smoothness={3} position={[.28,.2,-.247]}><meshStandardMaterial color="#33423a" roughness={.6}/></RoundedBox>
  {[0,1,2,3,4].map(i=><Cylinder key={i} position={[.15+i*.065,.2,-.263]} height={.23} radius={.005}/>)}
  <Cylinder position={[.28,.2,-.268]} height={.29} radius={.005} rotation={[0,0,Math.PI/2]}/>
  <mesh position={[.28,.38,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.055,.009,8,20,Math.PI]}/><meshStandardMaterial color={dark}/></mesh>
</>;}
function Island({proposal}:{proposal:Proposal}){return <>
  {[.12,.58,1.06].map(y=><Box key={y} size={[.8,.045,1.15]} position={[0,y,0]} color={wood}/>)}
  {[-.34,.34].flatMap(x=>[-.5,.5].map(z=><Box key={`${x}${z}`} size={[.035,1.06,.035]} position={[x,.53,z]} color={dark}/>))}
  {snackAssortment.map((product,i)=><group key={product.shape} position={[i<3?-.19:.19,1.09,-.35+(i%3)*.35]} rotation={[0,i<3?Math.PI/2:-Math.PI/2,0]}><SnackJar product={product} index={i}/></group>)}
  {[0,1,2].map(i=><group key={i} position={[0,.61,-.35+i*.35]}><Bag position={[0,0,0]} color={snackAssortment[i].color} label={['GALLETAS','POLLO','PESCADO'][i]} side={-1}/></group>)}
  {[-.3,.3].map((z,i)=><group key={z} position={[0,.15,z]}>
    <Box size={[.63,.18,.43]} position={[0,.09,0]} color="#b89d72"/>
    <Box size={[.55,.018,.35]} position={[0,.185,0]} color="#654e37"/>
    {[0,1,2,3].map(n=><group key={n} position={[-.2+n*.13,.22,0]} rotation={[.25,0,0]}><SnackPiece shape={i?'dental':'jerky'} color={i?'#799150':'#9a4b31'} index={n}/></group>)}
    <Label text={i?'DENTALES':'DESHIDRATADOS'} position={[0,.1,-.223]} size={[.54,.1]} bg="#fff6df"/>
  </group>)}
  {[-1,1].map(side=><Label key={side} text="SNACK BAR" position={[0,.97,side*.583]} size={[.7,.18]} rotation={[0,side<0?Math.PI:0,0]} bg={dark} fg="#fff9e8"/>)}
</>;}
function Foliage({scale=.3}:{scale?:number}) {return <group scale={scale}>
  <mesh position={[0,.12,0]}><cylinderGeometry args={[.17,.12,.24,20]}/><meshStandardMaterial color="#c3a47e" roughness={.95}/></mesh>
  {[0,1,2,3,4,5,6].map(i=><group key={i} rotation={[0,i*2.4,0]}>
    <Tube points={[[0,.18,0],[.07,.4,0],[.16,.52+(i%3)*.07,0]]} color="#476c48" radius={.012}/>
    <mesh position={[.14,.48+(i%3)*.07,0]} rotation={[0,0,-.55]} scale={[.075,.17,.025]} castShadow><sphereGeometry args={[1,10,7]}/><meshStandardMaterial color={i%2?'#6c8756':'#3e6851'} roughness={.9}/></mesh>
  </group>)}
</group>;}
function ArtPrint({cat=false}:{cat?:boolean}) {
  const cache=useContext(LabelTextures);
  const map=useMemo(()=>{
    const key=cat?'art-cat':'art-dog',old=cache.get(key);if(old)return old;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;const c=canvas.getContext('2d')!;
    c.fillStyle='#f4e8ce';c.fillRect(0,0,512,640);c.fillStyle=cat?'#a7b8a2':'#c58b70';c.beginPath();c.roundRect(45,40,422,490,[210,210,15,15]);c.fill();
    c.fillStyle=cat?'#d5b98b':'#9e6649';
    if(cat){c.beginPath();c.moveTo(118,265);c.lineTo(125,130);c.lineTo(219,225);c.lineTo(292,225);c.lineTo(387,130);c.lineTo(395,265);c.closePath();c.fill();}
    else{c.beginPath();c.ellipse(132,300,55,120,.12,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(380,300,55,120,-.12,0,Math.PI*2);c.fill();}
    c.fillStyle=cat?'#e2cda8':'#e0ba90';c.beginPath();c.ellipse(256,325,140,155,0,0,Math.PI*2);c.fill();
    c.fillStyle='#33483d';[207,305].forEach(x=>{c.beginPath();c.ellipse(x,306,cat?13:11,cat?23:15,0,0,Math.PI*2);c.fill();});
    c.fillStyle='#f4e8ce';c.beginPath();c.ellipse(256,386,67,52,0,0,Math.PI*2);c.fill();c.fillStyle='#33483d';c.beginPath();c.moveTo(236,365);c.lineTo(276,365);c.lineTo(256,386);c.closePath();c.fill();c.strokeStyle='#33483d';c.lineWidth=4;c.beginPath();c.moveTo(256,385);c.lineTo(256,403);c.stroke();
    c.font='bold 32px Georgia';c.textAlign='center';c.fillText(cat?'Pequeños compañeros':'Grandes amigos',256,580);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;cache.set(key,texture);return texture;
  },[cat,cache]);
  return <group><Box size={[.5,.64,.04]} color={wood}/><mesh position={[0,0,-.026]} rotation={[0,Math.PI,0]}><planeGeometry args={[.45,.59]}/><meshBasicMaterial map={map} toneMapped={false}/></mesh></group>;
}
function ArchPanel({width,height,color}:{width:number;height:number;color:string}) {
  const geometry=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-width/2,.08);s.lineTo(-width/2,height-width/2);s.absarc(0,height-width/2,width/2,Math.PI,0,true);s.lineTo(width/2,.08);s.closePath();return new THREE.ShapeGeometry(s);},[width,height]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={.88} side={THREE.DoubleSide}/></mesh>;
}
function Pendant({height}:{height:number}){return <>
  <Cylinder position={[0,(height+2.28)/2,0]} radius={.008} height={Math.max(.06,height-2.28)} color={dark}/>
  <mesh position={[0,2.25,0]} castShadow><cylinderGeometry args={[.11,.23,.18,24,1,true]}/><meshStandardMaterial color="#c9ad7d" roughness={.95} side={THREE.DoubleSide}/></mesh>
  {Array.from({length:12},(_,i)=><Box key={i} size={[.012,.19,.012]} position={[Math.cos(i*Math.PI/6)*.175,2.25,Math.sin(i*Math.PI/6)*.175]} color="#e0c69b" rotation={[Math.sin(i*Math.PI/6)*.5,0,-Math.cos(i*Math.PI/6)*.5]}/>)}
  <mesh position={[0,2.17,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.20,24]}/><meshStandardMaterial color="#ffe5b5" emissive="#ffd59c" emissiveIntensity={1.7} side={THREE.DoubleSide}/></mesh>
</>;}
function RetailDecor({layout,full}:{layout:ShopLayout;full:boolean}) {
  const {width:w,height:h}=layout.config,segment=(w-layout.serviceWidth)/2,archWidth=Math.min(1.65,segment-.14),archX=(w+layout.serviceWidth)/4;
  return <>
    {[-1,1].map(side=><group key={side} position={[side*archX,0,layout.partition-.093]}>
      <ArchPanel width={archWidth} height={Math.min(h-.14,2.65)} color={side>0?'#dbbaa4':'#c2cdb5'}/>
      <group position={[0,Math.min(2.27,h-.45),-.035]} scale={Math.min(1,archWidth/.7)}><ArtPrint cat={side<0}/></group>
    </group>)}
    {layout.items.filter(i=>i.kind==='shelf').map(item=><group key={item.id} position={item.position} rotation={[0,(item.position[0]<0?-1:1)*Math.PI/2,0]}>
      <group position={[-item.size[2]/2+.16,2.19,.11]}><Foliage scale={.25}/></group>
      <Tube points={[[item.size[2]/2-.08,2.18,.1],[item.size[2]/2-.12,1.99,.08],[item.size[2]/2-.06,1.78,.09]]} color="#57774d" radius={.009}/>
      {[0,1,2,3].map(n=><mesh key={n} position={[item.size[2]/2-.08+(n%2?-.045:.025),2.13-n*.09,.08]} rotation={[0,0,n%2?.5:-.4]} scale={[.035,.06,.015]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={n%2?'#57774d':'#779459'}/></mesh>)}
    </group>)}
    {full&&[-1,1].map(side=><group key={side} position={[side*Math.min(1.65,w*.24),0,layout.front+Math.min(2.5,layout.config.depth*.3)]}><Pendant height={h-.06}/><pointLight position={[0,2.14,0]} intensity={2.6} color="#ffd8a1" distance={4} decay={2}/></group>)}
    {/* Flat floor medallions mark the arrival without obstructing circulation. */}
    <mesh position={[0,-.01,layout.front+.45]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[Math.min(.42,w*.1),48]}/><meshStandardMaterial color="#bc8a6a" roughness={.95}/></mesh>
    <Paw position={[0,-.006,layout.front+.45]} scale={.38} color="#f2e7cc"/>
  </>;
}
function Furniture({item,selected,proposal,onSelect}: {item:ShopItem;selected:boolean;proposal:Proposal;onSelect:(id:string)=>void}) {
  const pick=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id);};
  const original:Record<string,Vec3>={counter:[1.65,1.05,.65],bench:[1.3,.82,.55],bath:[1.5,1.1,.85],groom:[1.2,.85,.65],storage:[1.05,2.1,.5]};
  const base=original[item.kind];const scale:Vec3=base?[item.size[0]/base[0],1,item.size[2]/base[2]]:[1,1,1];
  return <group position={item.position} onClick={pick} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
    <group scale={scale} rotation={[0,item.kind==='counter'||item.kind==='bench'?Math.PI:0,0]}>{item.kind==='shelf'?<Shelf item={item} proposal={proposal}/>:item.kind==='counter'?<Counter/>:item.kind==='bench'?<Bench/>:item.kind==='bath'?<Bath proposal={proposal}/>:item.kind==='groom'?<Groom proposal={proposal}/>:item.kind==='dryer'?<Dryer/>:item.kind==='storage'?<Cabinet/>:item.kind==='towels'?<Cabinet towels/>:item.kind==='plant'?<Plant/>:item.kind==='bed'?<Bed/>:item.department==='juguetes'?<GiftIsland/>:<Island proposal={proposal}/>}</group>
    {selected&&<mesh position={[0,item.size[1]/2,0]}><boxGeometry args={[item.size[0]+.06,item.size[1]+.06,item.size[2]+.06]}/><meshBasicMaterial color={orange} transparent opacity={.065} depthWrite={false}/><Edges threshold={30} color={orange}/></mesh>}
  </group>;
}
function CameraRig({layout,mode,selected,reset,motion,gates,onLock,onPosition}:SceneProps) {
  const {camera,gl,invalidate}=useThree();
  const orbit=useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const keys=useRef(new Set<string>());
  const angles=useRef({yaw:Math.PI,pitch:0});
  const position=useRef({x:0,z:-2.67});
  const lastPublish=useRef(0);
  const published=useRef({x:Infinity,z:Infinity});
  useEffect(()=>{
    keys.current.clear();
    if(mode==='walk') {
      const boutiqueView=layout.config.width>=6&&layout.config.depth>=9;
      const startX=boutiqueView?0:layout.items.some(i=>i.kind==='island')?-1.05:0,startZ=layout.front+(boutiqueView?.5:1.4),yaw=Math.PI+(boutiqueView?.92:0),pitch=boutiqueView?-.1:-.045;
      camera.position.set(startX,1.65,startZ);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);angles.current={yaw,pitch};position.current={x:startX,z:startZ};onPosition(startX,startZ);
    } else {const aspect=gl.domElement.clientWidth/Math.max(1,gl.domElement.clientHeight);const scale=aspect<1?1.35/Math.max(aspect,.4):1;const factor=Math.max(layout.config.width/5,layout.config.depth/8);camera.position.set(7*scale*factor,6*scale*factor,-9*scale*factor);camera.lookAt(0,0,0);if(orbit.current){orbit.current.target.set(0,.2,0);orbit.current.update();}}
    if(document.pointerLockElement)document.exitPointerLock();
  },[mode,reset,camera,onPosition,layout,gl]);
  useEffect(()=>{
    if(mode!=='orbit'||!selected||!orbit.current)return;
    const item=layout.items.find(i=>i.id===selected);if(!item)return;
    const p=new THREE.Vector3(...item.position);p.y=item.kind==='shelf'?1.1:.8;
    orbit.current.target.copy(p);
    if(item.kind==='shelf'){
      const distance=Math.max(2.3,item.size[2]*.95);
      camera.position.set(p.x+(item.position[0]<0?distance:-distance),1.65,p.z-.18);
    }else{
      const offset=item.position[0]<-1?[3,2,-2]:item.position[0]>1?[-3,2,-2]:[3,2,-3];
      camera.position.set(p.x+offset[0],p.y+offset[1],p.z+offset[2]);
    }
    orbit.current.update();
  },[selected,mode,camera,layout]);
  useEffect(()=>{
    if(mode!=='walk')return;
    const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,select,textarea,[contenteditable=true]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);invalidate();}};
    const up=(e:KeyboardEvent)=>{keys.current.delete(e.code);if(!keys.current.size){published.current={...position.current};onPosition(position.current.x,position.current.z);}invalidate();};
    const blur=()=>{keys.current.clear();motion.current.forward=0;motion.current.strafe=0;};
    const move=(e:MouseEvent)=>{if(document.pointerLockElement===gl.domElement){angles.current.yaw-=e.movementX*.0022;angles.current.pitch=THREE.MathUtils.clamp(angles.current.pitch-e.movementY*.0022,-1.2,1.2);invalidate();}};
    const lock=()=>onLock(document.pointerLockElement===gl.domElement);
    const pointer=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button===0&&document.pointerLockElement!==gl.domElement) { const result=gl.domElement.requestPointerLock();result?.catch(()=>onLock(false)); }};
    const drag={active:false,x:0,y:0};
    const touchStart=(e:PointerEvent)=>{if(e.pointerType==='touch'){drag.active=true;drag.x=e.clientX;drag.y=e.clientY;gl.domElement.setPointerCapture(e.pointerId);}};
    const touchMove=(e:PointerEvent)=>{if(e.pointerType==='touch'&&drag.active){angles.current.yaw-=(e.clientX-drag.x)*.006;angles.current.pitch=THREE.MathUtils.clamp(angles.current.pitch-(e.clientY-drag.y)*.006,-1.2,1.2);drag.x=e.clientX;drag.y=e.clientY;invalidate();}};
    const touchEnd=()=>{drag.active=false;};
    const wake=()=>{if(!motion.current.forward&&!motion.current.strafe){published.current={...position.current};onPosition(position.current.x,position.current.z);}invalidate();};
    window.addEventListener('brio-motion',wake);window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('mousemove',move);document.addEventListener('pointerlockchange',lock);
    gl.domElement.addEventListener('pointerdown',pointer);gl.domElement.addEventListener('pointerdown',touchStart);gl.domElement.addEventListener('pointermove',touchMove);gl.domElement.addEventListener('pointerup',touchEnd);gl.domElement.addEventListener('pointercancel',touchEnd);
    return ()=>{window.removeEventListener('brio-motion',wake);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('mousemove',move);document.removeEventListener('pointerlockchange',lock);gl.domElement.removeEventListener('pointerdown',pointer);gl.domElement.removeEventListener('pointerdown',touchStart);gl.domElement.removeEventListener('pointermove',touchMove);gl.domElement.removeEventListener('pointerup',touchEnd);gl.domElement.removeEventListener('pointercancel',touchEnd);blur();onLock(false);};
  },[mode,gl,motion,onLock,invalidate]);
  useFrame(({clock},delta)=>{
    if(mode!=='walk')return;
    const k=keys.current;
    let f=Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'))+motion.current.forward;
    let s=Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))+motion.current.strafe;
    const length=Math.max(1,Math.hypot(f,s));f/=length;s/=length;
    const yaw=angles.current.yaw, speed=Math.min(delta,.05)*1.65;
    const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;
    if(f||s)invalidate();
    const next=moveWithCollisions(position.current.x,position.current.z,dx,dz,gates,layout);
    position.current=next;camera.position.set(next.x,1.65,next.z);camera.rotation.order='YXZ';camera.rotation.set(angles.current.pitch,angles.current.yaw,0);
    if(clock.elapsedTime-lastPublish.current>.16&&Math.hypot(next.x-published.current.x,next.z-published.current.z)>.001){published.current={...next};onPosition(next.x,next.z);lastPublish.current=clock.elapsedTime;}
  });
  return mode==='orbit'?<OrbitControls ref={orbit} makeDefault minDistance={2.2} maxDistance={75} maxPolarAngle={Math.PI/2-.04} minPolarAngle={.12} enableDamping dampingFactor={.1} target={[0,.2,0]}/>:null;
}
function Ready({onReady}:{onReady:()=>void}){const frames=useRef(0);useFrame(()=>{if(frames.current++===0)onReady();});return null;}
function Reflections(){
  const {gl,scene,invalidate}=useThree();
  useEffect(()=>{
    const bytes=Uint8Array.from(atob(studioHDRBase64),c=>c.charCodeAt(0));
    const parsed=new RGBELoader().parse(bytes.buffer);
    const hdr=new THREE.DataTexture(parsed.data,parsed.width,parsed.height,THREE.RGBAFormat,parsed.type);
    hdr.mapping=THREE.EquirectangularReflectionMapping;hdr.flipY=true;hdr.needsUpdate=true;
    const pmrem=new THREE.PMREMGenerator(gl),target=pmrem.fromEquirectangular(hdr);
    scene.environment=target.texture;scene.environmentIntensity=.65;invalidate();
    const refresh=()=>invalidate();window.addEventListener('brio-texture-ready',refresh);
    return()=>{window.removeEventListener('brio-texture-ready',refresh);scene.environment=null;target.dispose();hdr.dispose();pmrem.dispose();};
  },[gl,scene,invalidate]);
  return null;
}
function World(props:SceneProps){
  const labelCache=useMemo(()=>new Map<string,THREE.CanvasTexture>(),[]);
  useEffect(()=>()=>{labelCache.forEach(t=>t.dispose());labelCache.clear();},[labelCache]);
  const sun=useRef<THREE.DirectionalLight>(null),spot=useRef<THREE.SpotLight>(null),{invalidate}=useThree();
  const spotTarget=useMemo(()=>new THREE.Object3D(),[]);
  const {width:w,depth:d,height:h}=props.layout.config;
  useEffect(()=>{spotTarget.position.set(0,0,props.layout.front+props.layout.config.depth*.53);if(sun.current)sun.current.shadow.needsUpdate=true;if(spot.current)spot.current.shadow.needsUpdate=true;invalidate();},[props.mode,props.roof,props.gates,props.proposal,props.layout,invalidate]);
  return <LabelTextures.Provider value={labelCache}><Finish.Provider value={props.layout.config.finish}>
    <color attach="background" args={['#d9cdbc']}/><Reflections/>
    <ambientLight intensity={.12}/><hemisphereLight args={['#ede7db','#6c786d',.35]}/>
    <directionalLight ref={sun} shadow-autoUpdate={false} position={[-w,7,-d]} intensity={1.7} color="#fff2da" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-w} shadow-camera-right={w} shadow-camera-top={d} shadow-camera-bottom={-d} shadow-normalBias={.018} shadow-radius={4} visible={props.mode!=='walk'}/>
    <primitive object={spotTarget}/>
    <spotLight ref={spot} shadow-autoUpdate={false} target={spotTarget} position={[0,h-.12,props.layout.front+d*.32]} angle={1.3} penumbra={.8} intensity={34} color="#fff1d9" distance={Math.max(w,d)*1.5} decay={2} castShadow={props.mode==='walk'} shadow-mapSize={[1024,1024]} shadow-normalBias={.012} shadow-bias={-.0001} shadow-radius={4}/>
    <pointLight position={[0,h-.22,-d*.17]} intensity={8} color="#fff0d4" distance={Math.max(w,d)} decay={2}/>
    <pointLight position={[0,h-.2,d*.29]} intensity={11} color="#f4f7ef" distance={Math.max(w,d)} decay={2}/>
    <Architecture {...props}/><RetailDecor layout={props.layout} full={props.mode==='walk'||props.roof}/>
    {props.layout.items.map(item=><Furniture key={item.id} item={item} selected={props.selected===item.id} proposal={props.proposal} onSelect={props.onSelect}/>)}
    <ContactShadows key={`${props.mode}-${props.roof}-${props.gates.service}-${props.gates.entrance}-${props.proposal}`} position={[0,-.007,0]} scale={Math.max(w,d)+.2} opacity={.4} blur={2.6} far={2.5} resolution={512} frames={1} color="#314035"/>
    <CameraRig {...props}/><Ready onReady={props.onReady}/>
  </Finish.Provider></LabelTextures.Provider>;
}
export default function ShopScene(props:SceneProps){return <Canvas frameloop="demand" shadows dpr={[1,2]} camera={{position:[7,6,-9],fov:58,near:.045,far:150}} gl={{antialias:true,powerPreference:'high-performance'}} onPointerMissed={()=>{if(props.mode==='orbit')props.onSelect(null);}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.72;}}><World {...props}/></Canvas>;}
