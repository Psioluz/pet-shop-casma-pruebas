'use client';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { studioHDRBase64 } from '@/lib/visual-assets';
import { surface } from './surfaces';
import { moveWithCollisions, type GateState, type Proposal, type ShopItem, type Vec3, type ViewMode, type ShopLayout } from '@/lib/shop';

export interface Motion { forward:number; strafe:number; lookX:number; lookY:number }
export interface SceneProps {
  layout:ShopLayout; mode:ViewMode; proposal:Proposal; roof:boolean; selected:string|null; gates:GateState; reset:number;
  motion:React.RefObject<Motion>; onSelect:(id:string|null)=>void; onGate:(gate:keyof GateState)=>void;
  onReady:()=>void; onLock:(locked:boolean)=>void; onPosition:(x:number,z:number)=>void;
}
const mint='#80988d', dark='#223b35', orange='#b77a4e', metal='#b5bebb', wood='#d3ad7f';
const Finish=createContext<'roble'|'nogal'>('nogal');
function Box({size,position=[0,0,0],color='#eee9dd',roughness=.65,metalness=0, ...props}:{size:Vec3;position?:Vec3;color?:string;roughness?:number;metalness?:number;rotation?:Vec3;castShadow?:boolean}) {
  const finish=useContext(Finish),map=color===wood?surface(finish):undefined;
  const material=<meshStandardMaterial color={map?(finish==='nogal'?'#79513a':'#dbc7a7'):color} map={map} bumpMap={map} bumpScale={.003} roughness={metalness>.5?.24:roughness} metalness={metalness}/>;
  return Math.min(...size)>.045?<RoundedBox args={size} radius={Math.min(.018,Math.min(...size)/5)} smoothness={2} position={position} castShadow receiveShadow {...props}>{material}</RoundedBox>:<mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size}/>{material}</mesh>;
}
function Cylinder({position,radius=.035,height=.7,color=metal,rotation=[0,0,0]}:{position:Vec3;radius?:number;height?:number;color?:string;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[radius,radius,height,16]}/><meshStandardMaterial color={color} roughness={.22} metalness={.85}/></mesh>;
}
function useLabel(text:string,bg:string,fg:string) {
  return useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,768,192);ctx.fillStyle=fg;
    ctx.font='600 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,384,98,710);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    return texture;
  },[text,bg,fg]);
}
function Label({text,position,size=[1,.25],bg='#faf8f2',fg=dark,rotation=[0,Math.PI,0]}:{text:string;position:Vec3;size?:[number,number];bg?:string;fg?:string;rotation?:Vec3}) {
  const map=useLabel(text,bg,fg);
  useEffect(()=>()=>map.dispose(),[map]);
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
function Glass({size,position,rotation=[0,0,0]}:{size:Vec3;position:Vec3;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation}><boxGeometry args={size}/><meshPhysicalMaterial color="#d6e5e1" transparent opacity={.22} roughness={.045} metalness={.18} clearcoat={1} envMapIntensity={1.8} depthWrite={false}/></mesh>;
}
function Gate({position,width,open,onClick,exterior=false,doubleDoor=false}:{position:Vec3;width:number;open:boolean;onClick:()=>void;exterior?:boolean;doubleDoor?:boolean}) {
  const height=exterior?2.35:1.08;
  const double=exterior||doubleDoor;
  const leafWidth=double?width/2:width;
  const panel=(direction:number)=><>
    <Glass size={[leafWidth,height,.03]} position={[direction*leafWidth/2,height/2,0]}/>
    <Box size={[leafWidth,.035,.035]} position={[direction*leafWidth/2,height,0]} color={dark}/>
    <Box size={[.03,height,.04]} position={[direction*leafWidth,height/2,0]} color={dark}/>
    <Cylinder position={[direction*(leafWidth-.1),height*.55,-.045]} radius={.014} height={.23}/>
    {!exterior&&<Label text={open?'ABIERTO':'ACCESO SEGURO'} position={[direction*leafWidth/2,.69,-.022]} size={[leafWidth*.85,.1]} bg={mint}/>}
  </>;
  return <group position={position} onClick={e=>{e.stopPropagation();onClick();}} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
    {double?[-1,1].map(side=><group key={side} position={[side*width/2,0,0]} rotation={[0,open?(exterior?-side:side)*Math.PI/2:0,0]}>{panel(-side)}</group>)
      :<group position={[open?-width*1.5:-width/2,0,0]}>{panel(1)}</group>}
  </group>;
}
function Architecture({layout,mode,roof,gates,onGate}:Pick<SceneProps,'layout'|'mode'|'roof'|'gates'|'onGate'>) {
  const {width:w,depth:d,height:h}=layout.config,{front,back,partition,entryWidth,serviceWidth}=layout;
  const full=mode==='walk'||roof,wh=full?h:.68,wetHeight=Math.min(2.3,h-.2);
  const facadeSide=(w-entryWidth)/2;
  return <>
    <Floor layout={layout}/>
    {[-1,1].map(side=><group key={side}>
      <Box size={[.12,wh,d+.16]} position={[side*(w/2+.06),wh/2,0]} color="#e7e3da"/>
      <Box size={[.022,.11,d]} position={[side*(w/2-.012),.055,0]} color="#746d61" roughness={.5}/>
      {full&&<Box size={[.022,.48,d]} position={[side*(w/2-.012),.55,0]} color="#82958a"/>}
    </group>)}
    <Box size={[w,h,.12]} position={[0,h/2,back+.06]} color="#ded9cf"/>
    <Box size={[w,.12,.02]} position={[0,.06,back-.012]} color="#726e63"/>
    <Box size={[Math.min(w-1,3.8),.66,.035]} position={[0,h-.62,back-.025]} color={wood}/>
    <Label text="BRÍO PET" position={[0,h-.57,back-.047]} size={[Math.min(w-1.2,2.25),.37]} bg="#3b4c43" fg="#f1e8d6"/>
    <Label text="TIENDA & GROOMING" position={[0,h-.88,back-.049]} size={[1.8,.12]} bg="#ded9cf" fg="#39473e"/>
    {/* Washable backsplash with actual tile relief. */}
    {Array.from({length:Math.ceil(w/.32)},(_,i)=><group key={i}>
      {[0,1,2,3].map(j=><Box key={j} size={[.31,.235,.016]} position={[-w/2+.16+i*.32,.45+j*.245,back-.014]} color={j%2?'#c7cec5':'#d4d9d1'} roughness={.35}/>)}
    </group>)}
    <Box size={[.55,.3,.04]} position={[-w*.3,h-.3,back-.035]} color="#d5d9d2"/>
    {[0,1,2,3].map(i=><Box key={i} size={[.48,.018,.018]} position={[-w*.3,h-.39+i*.055,back-.061]} color="#707b72"/>)}
    {[-1,1].map(side=><group key={side}>
      <Glass size={[(w-serviceWidth)/2,full?wetHeight:1.12,.025]} position={[side*(w+serviceWidth)/4,(full?wetHeight:1.12)/2,partition]}/>
      <Box size={[(w-serviceWidth)/2,.028,.04]} position={[side*(w+serviceWidth)/4,1.12,partition]} color={dark} metalness={.65}/>
      <Cylinder position={[side*serviceWidth/2,(full?wetHeight:1.12)/2,partition]} height={full?wetHeight:1.12} radius={.014} color={dark}/>
    </group>)}
    <Gate position={[0,0,partition]} width={serviceWidth} open={gates.service} onClick={()=>onGate('service')}/>
    {[-1,1].map(side=><Glass key={side} size={[.025,1.12,.8]} position={[side*(entryWidth/2+.03),.56,front+.4]}/>)}
    <Gate position={[0,0,front+.8]} width={entryWidth} open={gates.vestibule} onClick={()=>onGate('vestibule')} doubleDoor/>
    <Gate position={[0,0,front]} width={entryWidth} open={gates.entrance} onClick={()=>onGate('entrance')} exterior/>
    {full&&<>
      {[-1,1].map(side=><group key={side}><Glass size={[facadeSide,2.35,.025]} position={[side*(w+entryWidth)/4,1.175,front]}/><Box size={[.04,2.4,.06]} position={[side*(w/2-.015),1.2,front]} color={dark}/></group>)}
      <Box size={[w,Math.max(.16,h-2.4),.15]} position={[0,(h+2.4)/2,front]} color={dark}/>
      <Label text="BRÍO PET · TIENDA & GROOMING" position={[0,h-.24,front-.081]} size={[Math.min(3.8,w-.3),.24]} bg={dark} fg="#f6ebd4"/>
    </>}
    {Array.from({length:Math.max(2,Math.ceil(d/3.8))},(_,i)=>(i+.5)/Math.max(2,Math.ceil(d/3.8))).flatMap(part=>[-1,1].map(side=><group key={`${part}${side}`} position={[side*w*.25,h-.065,front+d*part]} visible={full}>
      <Box size={[.09,.04,Math.min(1.3,d*.14)]} color="#7c7c70" metalness={.45}/>
      <mesh position={[0,-.022,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.075,Math.min(1.25,d*.14)]}/><meshStandardMaterial color="#fff6df" emissive="#ffedce" emissiveIntensity={2} side={THREE.DoubleSide}/></mesh>
    </group>))}
    {roof&&<Box size={[w+.12,.12,d+.12]} position={[0,h+.06,0]} color="#dbd8d0"/>}
  </>;
}
function Packaging({label,color}:{label:string;color:string}){
  const map=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;const c=canvas.getContext('2d')!;
    c.fillStyle='#f3ead7';c.fillRect(0,0,384,512);c.fillStyle=color;c.fillRect(0,0,384,70);c.fillRect(0,370,384,142);
    c.textAlign='center';c.fillStyle='#263d33';c.font='bold 58px Georgia';c.fillText('brío pet',192,137);
    c.font='bold 24px Arial';c.fillText(label==='ARENA'?'HIGIENE NATURAL':'NUTRICIÓN DIARIA',192,181);
    c.fillStyle=color;c.beginPath();c.ellipse(192,260,55,39,0,0,Math.PI*2);c.fill();
    [-57,-20,20,57].forEach((x,i)=>{c.beginPath();c.ellipse(192+x,211-(i===1||i===2?15:0),13,19,x*.009,0,Math.PI*2);c.fill();});
    c.font='bold 27px Arial';c.fillStyle='#263d33';c.fillText(label,192,341);
    c.fillStyle='#fff7e8';c.font='22px Arial';c.fillText(label==='ARENA'?'CONTROL DE OLORES':'POLLO · ARROZ · VITAMINAS',192,411);c.font='bold 36px Arial';c.fillText(label==='SNACK'?'250 g':'3 kg',192,473);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[label,color]);
  useEffect(()=>()=>map.dispose(),[map]);
  return <mesh position={[0,.19,.101]}><planeGeometry args={[.185,.275]}/><meshStandardMaterial map={map} roughness={.58}/></mesh>;
}
function Bag({position,color,label,side=1}:{position:Vec3;color:string;label:string;side?:number}) {
  return <group position={position} rotation={[0,side*Math.PI/2,0]}>
    <RoundedBox args={[.235,.35,.19]} radius={.028} smoothness={3} position={[0,.18,0]} castShadow><meshStandardMaterial color={color} roughness={.65}/></RoundedBox>
    <Box size={[.225,.017,.115]} position={[0,.357,0]} color="#d8c7a3" roughness={.8}/>
    <Packaging label={label} color={color}/>
  </group>;
}
function Bottle({position,color}:{position:Vec3;color:string}) {
  const profile=useMemo(()=>[new THREE.Vector2(.047,0),new THREE.Vector2(.059,.018),new THREE.Vector2(.059,.19),new THREE.Vector2(.053,.214),new THREE.Vector2(.026,.23),new THREE.Vector2(.025,.265)],[]);
  return <group position={position}>
    <mesh castShadow><latheGeometry args={[profile,20]}/><meshPhysicalMaterial color={color} roughness={.32} clearcoat={.6}/></mesh>
    <Cylinder position={[0,.27,0]} radius={.027} height={.035} color={dark}/>
    <Box size={[.07,.014,.027]} position={[.018,.293,0]} color={dark}/>
    <Label text="BRÍO · AVENA" position={[0,.12,-.061]} size={[.1,.075]} bg="#ece8d9" fg={dark}/>
  </group>;
}
function Shelf({item,proposal}:{item:ShopItem;proposal:Proposal}) {
  const d=item.size[2], side=item.position[0]<0?1:-1;
  const count=Math.max(2,Math.min(proposal==='economica'?7:10,Math.floor(d/.29)));
  return <>
    {[.3,1.1,1.85].map(y=><Box key={y} size={[.035,.045,d]} position={[-side*.22,y,0]} color={dark}/>)}
    {[-d/2,d/2].map(z=><Box key={z} size={[.45,1.9,.035]} position={[0,.95,z]} color={wood}/>)}
    {[.12,.57,1.02,1.47,1.91].map((y,j)=><group key={y}>
      <Box size={[.48,.035,d]} position={[0,y,0]} color={j===4?dark:wood}/>
      {j<4&&Array.from({length:count},(_,i)=>{
        const z=-d/2+.16+i*(d-.32)/(count-1);
        return item.id.startsWith('alimentos')?<Bag key={i} position={[side*.015,y+.025,z]} color={['#bb6d44','#406c5b','#d7bb7f','#6e838c'][(i+j)%4]} label={j===0?'ARENA':i%2?'GATO':'PERRO'} side={side}/>
          : j<2?<Bottle key={i} position={[0,y+.025,z]} color={['#bfd0c3','#e1af79','#d5d5c7'][i%3]}/>
          : j===2?<mesh key={i} position={[0,y+.14,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.09,.018,8,20]}/><meshStandardMaterial color={i%2?orange:dark}/></mesh>
          :<mesh key={i} position={[0,y+.12,z]}><sphereGeometry args={[.095,16,12]}/><meshStandardMaterial color={i%2?orange:mint}/></mesh>;
      })}
    </group>)}
    <Label text={item.id.startsWith('alimentos')?'ALIMENTOS & SNACKS':'HIGIENE & ACCESORIOS'} position={[side*.248,1.78,0]} size={[d-.2,.14]} rotation={[0,side*Math.PI/2,0]} bg={dark} fg="#f5f1e7"/>
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
  <Box size={[.12,.06,.18]} position={[-.42,1.055,0]} color={dark}/>
</>;}
function Bench(){return <>
  <Box size={[1.3,.12,.54]} position={[0,.43,0]} color={orange}/>
  <Box size={[1.3,.32,.09]} position={[0,.66,.22]} color={orange}/>
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
  {[.12,.65,1.06].map(y=><Box key={y} size={[.8,.045,1.15]} position={[0,y,0]} color={wood}/>)}
  {[-.34,.34].flatMap(x=>[-.5,.5].map(z=><Box key={`${x}${z}`} size={[.035,1.06,.035]} position={[x,.53,z]} color={dark}/>))}
  {[0,1].flatMap(j=>Array.from({length:proposal==='economica'?3:4},(_,i)=><Bag key={`${j}${i}`} position={[j?.2:-.2,.68,-.4+i*.26]} color={j?mint:orange} label="SNACK" side={j?1:-1}/>))}
  <Label text="SUS FAVORITOS" position={[0,1.09,-.583]} size={[.7,.12]} bg={dark} fg="#f7f0db"/>
</>;}
function Furniture({item,selected,proposal,onSelect}: {item:ShopItem;selected:boolean;proposal:Proposal;onSelect:(id:string)=>void}) {
  const pick=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id);};
  const original:Record<string,Vec3>={counter:[1.65,1.05,.65],bench:[1.3,.82,.55],bath:[1.5,1.1,.85],groom:[1.2,.85,.65],storage:[1.05,2.1,.5]};
  const base=original[item.kind];const scale:Vec3=base?[item.size[0]/base[0],1,item.size[2]/base[2]]:[1,1,1];
  return <group position={item.position} onClick={pick} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
    <group scale={scale} rotation={[0,item.kind==='counter'||item.kind==='bench'?Math.PI:0,0]}>{item.kind==='shelf'?<Shelf item={item} proposal={proposal}/>:item.kind==='counter'?<Counter/>:item.kind==='bench'?<Bench/>:item.kind==='bath'?<Bath proposal={proposal}/>:item.kind==='groom'?<Groom proposal={proposal}/>:item.kind==='dryer'?<Dryer/>:item.kind==='storage'?<Cabinet/>:item.kind==='towels'?<Cabinet towels/>:item.kind==='plant'?<Plant/>:item.kind==='bed'?<Bed/>:<Island proposal={proposal}/>}</group>
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
      const startX=layout.items.some(i=>i.kind==='island')?-.94:0;const yaw=Math.PI+(startX<0?.19:0);camera.position.set(startX,1.65,layout.front+1.4);camera.rotation.order='YXZ';camera.rotation.set(-.045,yaw,0);angles.current={yaw,pitch:-.045};position.current={x:startX,z:layout.front+1.4};onPosition(startX,layout.front+1.4);
    } else {const aspect=gl.domElement.clientWidth/Math.max(1,gl.domElement.clientHeight);const scale=aspect<1?1.35/Math.max(aspect,.4):1;const factor=Math.max(layout.config.width/5,layout.config.depth/8);camera.position.set(7*scale*factor,6*scale*factor,-9*scale*factor);camera.lookAt(0,0,0);if(orbit.current){orbit.current.target.set(0,.2,0);orbit.current.update();}}
    if(document.pointerLockElement)document.exitPointerLock();
  },[mode,reset,camera,onPosition,layout,gl]);
  useEffect(()=>{
    if(mode!=='orbit'||!selected||!orbit.current)return;
    const item=layout.items.find(i=>i.id===selected);if(!item)return;
    const p=new THREE.Vector3(...item.position);p.y=.8;
    orbit.current.target.copy(p);
    const offset=item.position[0]<-1?[3,2,-2]:item.position[0]>1?[-3,2,-2]:[3,2,-3];
    camera.position.set(p.x+offset[0],p.y+offset[1],p.z+offset[2]);
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
  const sun=useRef<THREE.DirectionalLight>(null),spot=useRef<THREE.SpotLight>(null),{invalidate}=useThree();
  const spotTarget=useMemo(()=>new THREE.Object3D(),[]);
  const {width:w,depth:d,height:h}=props.layout.config;
  useEffect(()=>{spotTarget.position.set(0,0,props.layout.front+props.layout.config.depth*.53);if(sun.current)sun.current.shadow.needsUpdate=true;if(spot.current)spot.current.shadow.needsUpdate=true;invalidate();},[props.mode,props.roof,props.gates,props.proposal,props.layout,invalidate]);
  return <Finish.Provider value={props.layout.config.finish}>
    <color attach="background" args={['#b8b5ad']}/><Reflections/>
    <ambientLight intensity={.12}/><hemisphereLight args={['#ede7db','#6c786d',.35]}/>
    <directionalLight ref={sun} shadow-autoUpdate={false} position={[-w,7,-d]} intensity={1.7} color="#fff2da" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-w} shadow-camera-right={w} shadow-camera-top={d} shadow-camera-bottom={-d} shadow-normalBias={.018} shadow-radius={4} visible={props.mode!=='walk'}/>
    <primitive object={spotTarget}/>
    <spotLight ref={spot} shadow-autoUpdate={false} target={spotTarget} position={[0,h-.12,props.layout.front+d*.32]} angle={1.3} penumbra={.8} intensity={34} color="#fff1d9" distance={Math.max(w,d)*1.5} decay={2} castShadow={props.mode==='walk'} shadow-mapSize={[1024,1024]} shadow-normalBias={.012} shadow-bias={-.0001} shadow-radius={4}/>
    <pointLight position={[0,h-.22,-d*.17]} intensity={8} color="#fff0d4" distance={Math.max(w,d)} decay={2}/>
    <pointLight position={[0,h-.2,d*.29]} intensity={11} color="#f4f7ef" distance={Math.max(w,d)} decay={2}/>
    <Architecture {...props}/>
    {props.layout.items.map(item=><Furniture key={item.id} item={item} selected={props.selected===item.id} proposal={props.proposal} onSelect={props.onSelect}/>)}
    <CameraRig {...props}/><Ready onReady={props.onReady}/>
  </Finish.Provider>;
}
export default function ShopScene(props:SceneProps){return <Canvas frameloop="demand" shadows dpr={[1,1.35]} camera={{position:[7,6,-9],fov:58,near:.045,far:150}} gl={{antialias:true,powerPreference:'high-performance'}} onPointerMissed={()=>{if(props.mode==='orbit')props.onSelect(null);}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.72;}}><World {...props}/></Canvas>;}
