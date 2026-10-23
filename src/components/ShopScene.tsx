'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { items, moveWithCollisions, type GateState, type Proposal, type ShopItem, type Vec3, type ViewMode } from '@/lib/shop';

export interface Motion { forward:number; strafe:number; lookX:number; lookY:number }
export interface SceneProps {
  mode:ViewMode; proposal:Proposal; roof:boolean; selected:string|null; gates:GateState; reset:number;
  motion:React.RefObject<Motion>; onSelect:(id:string|null)=>void; onGate:(gate:keyof GateState)=>void;
  onReady:()=>void; onLock:(locked:boolean)=>void; onPosition:(x:number,z:number)=>void;
}
const mint='#a6c7b4', dark='#253f36', orange='#d9834c', metal='#a9b5b3', wood='#d3ad7f';
let woodMap:THREE.CanvasTexture|undefined;
function getWoodMap(){
  if(woodMap)return woodMap;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff9ee';ctx.fillRect(0,0,256,256);
  for(let i=0;i<110;i++){
    const y=i*2.4;ctx.beginPath();ctx.moveTo(0,y);
    for(let x=0;x<=256;x+=8)ctx.lineTo(x,y+Math.sin(x*.025+i*.7)*2.5);
    ctx.strokeStyle=i%3?'rgba(119,90,45,.08)':'rgba(119,90,45,.15)';ctx.lineWidth=.5;ctx.stroke();
  }
  woodMap=new THREE.CanvasTexture(canvas);woodMap.wrapS=woodMap.wrapT=THREE.RepeatWrapping;
  woodMap.colorSpace=THREE.SRGBColorSpace;return woodMap;
}
function Box({size,position=[0,0,0],color='#faf8f2',roughness=.7,metalness=0, ...props}:{size:Vec3;position?:Vec3;color?:string;roughness?:number;metalness?:number;rotation?:Vec3;castShadow?:boolean}) {
  return <mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} map={color===wood?getWoodMap():undefined} roughness={roughness} metalness={metalness}/></mesh>;
}
function Cylinder({position,radius=.035,height=.7,color=metal,rotation=[0,0,0]}:{position:Vec3;radius?:number;height?:number;color?:string;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[radius,radius,height,16]}/><meshStandardMaterial color={color} roughness={.4} metalness={.4}/></mesh>;
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
function Floor() {
  const texture=useMemo(()=>{
    const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#e6e1d7';ctx.fillRect(0,0,512,512);
    let seed=19;
    for(let i=0;i<9000;i++) { seed=(seed*16807)%2147483647;const x=seed%512;seed=(seed*16807)%2147483647;const y=seed%512;ctx.fillStyle=i%2?'rgba(100,90,76,.035)':'rgba(255,255,255,.12)';ctx.fillRect(x,y,2,2); }
    ctx.strokeStyle='#c5c1b8';ctx.lineWidth=3;ctx.strokeRect(0,0,512,512);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(10,16);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <>
    <Box size={[5.12,.15,8.12]} position={[0,-.1,0]} color="#d4cec2"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.018,0]} receiveShadow><planeGeometry args={[5,8]}/><meshStandardMaterial map={texture} roughness={.92}/></mesh>
    <Box size={[4.94,.009,2.65]} position={[0,-.01,2.65]} color="#a5b8ad"/>
    <Label text="TIENDA · 26 m²" position={[0,.004,-1.8]} size={[1.4,.22]} bg="#e6e1d7" fg="#8b9487" rotation={[-Math.PI/2,0,0]}/>
    <Paw position={[-.86,.006,-2.1]} scale={.25}/><Paw position={[-.86,.006,-1.65]} scale={.25}/>
    <Box size={[5.5,.08,1.6]} position={[0,-.12,-4.8]} color="#c7c2b8"/>
  </>;
}
function Glass({size,position,rotation=[0,0,0]}:{size:Vec3;position:Vec3;rotation?:Vec3}) {
  return <mesh position={position} rotation={rotation}><boxGeometry args={size}/><meshPhysicalMaterial color="#d4ece7" transparent opacity={.17} roughness={.12} metalness={.05} depthWrite={false}/></mesh>;
}
function Gate({position,width,open,onClick,exterior=false}:{position:Vec3;width:number;open:boolean;onClick:()=>void;exterior?:boolean}) {
  const height=exterior?2.35:1.08;
  const double=exterior||position[2]<-3;
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
function Architecture({mode,roof,gates,onGate}:Pick<SceneProps,'mode'|'roof'|'gates'|'onGate'>) {
  const full=mode==='walk'||roof;
  const wallHeight=full?3:1.05;
  return <>
    <Floor/>
    <Box size={[.12,wallHeight,8.12]} position={[-2.56,wallHeight/2,0]} color="#f4f2eb"/>
    <Box size={[.12,wallHeight,8.12]} position={[2.56,wallHeight/2,0]} color="#f4f2eb"/>
    <Box size={[5,3,.12]} position={[0,1.5,4.06]} color="#f4f2eb"/>
    <Box size={[5,.98,.025]} position={[0,.5,3.985]} color={mint}/>
    <Box size={[.018,.45,8]} position={[-2.488,.25,0]} color={mint}/>
    <Box size={[.018,.45,8]} position={[2.488,.25,0]} color={mint}/>
    {/* Rear exhaust above splash zone. */}
    <Box size={[.65,.4,.06]} position={[-1.5,2.65,3.97]} color="#d4d8d2"/>
    {[0,1,2,3,4].map(i=><Box key={i} size={[.57,.025,.025]} position={[-1.5,2.5+i*.065,3.93]} color="#7e8c84"/>)}
    <Label text="BAÑO & CUIDADO" position={[-1.2,2.05,3.975]} size={[1.9,.3]} bg="#f4f2eb"/>
    <Label text="MIGA · GROOMING" position={[1.3,2.52,3.975]} size={[1.75,.3]} bg="#f4f2eb"/>
    <Paw position={[1.35,1.7,3.965]} rotation={[0,Math.PI,0]} scale={.7}/>
    {/* Transparent wet-area partition with a 1.2 m supervised gate. */}
    {[-1.55,1.55].map(x=><group key={x}><Glass size={[1.9,full?2.4:1.12,.035]} position={[x,(full?2.4:1.12)/2,1.3]}/><Box size={[1.9,.04,.045]} position={[x,1.12,1.3]} color={dark}/><Box size={[.035,full?2.4:1.12,.045]} position={[x<0?-.6:.6,(full?2.4:1.12)/2,1.3]} color={dark}/></group>)}
    <Gate position={[0,0,1.3]} width={1.2} open={gates.service} onClick={()=>onGate('service')}/>
    {/* Safety vestibule: doors cannot be open together. */}
    {[-.83,.83].map(x=><Glass key={x} size={[.035,1.12,.8]} position={[x,.56,-3.6]}/>)}
    <Gate position={[0,0,-3.22]} width={1.6} open={gates.vestibule} onClick={()=>onGate('vestibule')}/>
    <Gate position={[0,0,-4]} width={1.6} open={gates.entrance} onClick={()=>onGate('entrance')} exterior/>
    {full&&<>
      {[-1.67,1.67].map(x=><group key={x}><Glass size={[1.66,2.35,.035]} position={[x,1.175,-4]}/><Box size={[.04,2.4,.06]} position={[x<0?-2.49:2.49,1.2,-4]} color={dark}/></group>)}
      <Box size={[5,.5,.12]} position={[0,2.7,-4]} color={dark}/>
      <Label text="PET SHOP & GROOMING" position={[0,2.7,-4.066]} size={[3.5,.32]} bg={dark} fg="#f2eee2"/>
    </>}
    {!full&&<Label text="MIGA / PET SHOP & GROOMING" position={[0,.08,-4.12]} size={[3,.24]} bg="#c7c2b8" rotation={[-Math.PI/2,0,0]}/>}
    {[[-1.1,-1.9],[1.1,-1.9],[-1.1,2.3],[1.1,2.3]].map(([x,z],i)=><group key={i} position={[x,2.94,z]} visible={full}>
      <Box size={[.08,.045,.8]} color="#dddcd5"/>
      <mesh position={[0,-.026,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.06,.72]}/><meshStandardMaterial color="#fff6d9" emissive="#fff1c9" emissiveIntensity={3} side={THREE.DoubleSide}/></mesh>
    </group>)}
    {roof&&<Box size={[5.12,.12,8.12]} position={[0,3.08,0]} color="#f4f0e8"/>}
  </>;
}
function Bag({position,color,label,side=1}:{position:Vec3;color:string;label:string;side?:number}) {
  return <group position={position}><Box size={[.25,.34,.23]} position={[0,.17,0]} color={color}/><Box size={[.22,.025,.2]} position={[0,.345,0]} color="#ede9dc"/>
    <Label text={label} position={[side*.127,.18,0]} size={[.19,.09]} rotation={[0,side*Math.PI/2,0]} bg="#f8f1df" fg={dark}/>
  </group>;
}
function Bottle({position,color}:{position:Vec3;color:string}) {
  return <group position={position}><Cylinder position={[0,.13,0]} radius={.06} height={.22} color={color}/><Cylinder position={[0,.27,0]} radius={.027} height={.06} color={dark}/><Box size={[.075,.085,.105]} position={[0,.13,0]} color="#eee7cf"/></group>;
}
function Shelf({item,proposal}:{item:ShopItem;proposal:Proposal}) {
  const d=item.size[2], side=item.position[0]<0?1:-1;
  const count=proposal==='economica'?5:proposal==='intermedia'?7:8;
  return <>
    {[.3,1.1,1.85].map(y=><Box key={y} size={[.035,.045,d]} position={[-side*.22,y,0]} color={dark}/>)}
    {[-d/2,d/2].map(z=><Box key={z} size={[.45,1.9,.035]} position={[0,.95,z]} color={wood}/>)}
    {[.12,.57,1.02,1.47,1.91].map((y,j)=><group key={y}>
      <Box size={[.48,.035,d]} position={[0,y,0]} color={j===4?dark:wood}/>
      {j<4&&Array.from({length:count},(_,i)=>{
        const z=-d/2+.22+i*(d-.44)/(count-1);
        return item.id==='alimentos'?<Bag key={i} position={[side*.015,y+.025,z]} color={['#bb6d44','#406c5b','#d7bb7f','#6e838c'][(i+j)%4]} label={j===0?'ARENA':i%2?'GATO':'PERRO'} side={side}/>
          : j<2?<Bottle key={i} position={[0,y+.025,z]} color={['#bfd0c3','#e1af79','#d5d5c7'][i%3]}/>
          : j===2?<mesh key={i} position={[0,y+.14,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.09,.018,8,20]}/><meshStandardMaterial color={i%2?orange:dark}/></mesh>
          :<mesh key={i} position={[0,y+.12,z]}><sphereGeometry args={[.095,16,12]}/><meshStandardMaterial color={i%2?orange:mint}/></mesh>;
      })}
    </group>)}
    <Label text={item.id==='alimentos'?'ALIMENTOS & SNACKS':'HIGIENE & ACCESORIOS'} position={[side*.248,1.78,0]} size={[d-.2,.14]} rotation={[0,side*Math.PI/2,0]} bg={dark} fg="#f5f1e7"/>
    {item.id==='accesorios'&&[0,1,2].map(i=><group key={i} position={[side*.25,1.15,-.9+i*.35]}>
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
  <Label text="miga" position={[-.22,.62,-.34]} size={[.8,.25]} bg={wood}/>
  <Paw position={[.51,.62,-.341]} rotation={[0,Math.PI,0]} scale={.27} color={dark}/>
  <Box size={[.32,.025,.23]} position={[.35,1.03,.04]} color={dark}/>
  <Box size={[.035,.18,.035]} position={[.35,1.12,.05]} color={dark}/>
  <Box size={[.38,.25,.035]} position={[.35,1.28,.07]} color={dark} rotation={[-.15,0,0]}/>
  <Label text="MIGA / CAJA" position={[.35,1.28,.045]} size={[.33,.18]} bg="#a5bcab"/>
  <Box size={[.12,.06,.18]} position={[-.42,1.055,0]} color={dark}/>
</>;}
function Bench(){return <>
  <Box size={[1.3,.12,.54]} position={[0,.43,0]} color={orange}/>
  <Box size={[1.3,.32,.09]} position={[0,.66,.22]} color={orange}/>
  {[-.52,.52].flatMap(x=>[-.17,.17].map(z=><Cylinder key={`${x}${z}`} position={[x,.2,z]} radius={.025} height={.4} color={dark}/>))}
</>;}
function Bath({proposal}:{proposal:Proposal}){
  const color=proposal==='economica'?'#dddcd2':'#a9b6b3';
  const material=proposal==='economica'?.1:.75;
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
  <Box size={[.47,.1,.5]} position={[-.18,.07,0]} color={orange}/>
  {[-.4,.04].map(x=><Box key={x} size={[.05,.16,.5]} position={[x,.14,0]} color="#b87a55"/>)}
  <Box size={[.47,.16,.06]} position={[-.18,.14,.22]} color="#b87a55"/>
  <Box size={[.4,.3,.5]} position={[.3,.2,0]} color={mint}/>
  <Box size={[.33,.27,.015]} position={[.3,.22,-.258]} color={dark}/>
  {[0,1,2,3,4].map(i=><Box key={i} size={[.012,.25,.02]} position={[.16+i*.07,.22,-.27]} color={metal}/>)}
  <Box size={[.15,.04,.04]} position={[.3,.38,0]} color={dark}/>
</>;}
function Island({proposal}:{proposal:Proposal}){return <>
  {[.12,.65,1.06].map(y=><Box key={y} size={[.8,.045,1.15]} position={[0,y,0]} color={wood}/>)}
  {[-.34,.34].flatMap(x=>[-.5,.5].map(z=><Box key={`${x}${z}`} size={[.035,1.06,.035]} position={[x,.53,z]} color={dark}/>))}
  {[0,1].flatMap(j=>Array.from({length:proposal==='economica'?3:4},(_,i)=><Bag key={`${j}${i}`} position={[j?.2:-.2,.68,-.4+i*.26]} color={j?mint:orange} label="SNACK" side={j?1:-1}/>))}
  <Label text="SUS FAVORITOS" position={[0,1.09,-.583]} size={[.7,.12]} bg={dark} fg="#f7f0db"/>
</>;}
function Furniture({item,selected,proposal,onSelect}: {item:ShopItem;selected:boolean;proposal:Proposal;onSelect:(id:string)=>void}) {
  const pick=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id);};
  return <group position={item.position} onClick={pick} onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
    {item.kind==='shelf'?<Shelf item={item} proposal={proposal}/>:item.kind==='counter'?<Counter/>:item.kind==='bench'?<Bench/>:item.kind==='bath'?<Bath proposal={proposal}/>:item.kind==='groom'?<Groom proposal={proposal}/>:item.kind==='dryer'?<Dryer/>:item.kind==='storage'?<Cabinet/>:item.kind==='towels'?<Cabinet towels/>:item.kind==='plant'?<Plant/>:item.kind==='bed'?<Bed/>:<Island proposal={proposal}/>}
    {selected&&<mesh position={[0,item.size[1]/2,0]}><boxGeometry args={[item.size[0]+.06,item.size[1]+.06,item.size[2]+.06]}/><meshBasicMaterial color={orange} transparent opacity={.065} depthWrite={false}/><Edges threshold={30} color={orange}/></mesh>}
  </group>;
}
function CameraRig({mode,selected,reset,motion,gates,onLock,onPosition}:SceneProps) {
  const {camera,gl}=useThree();
  const orbit=useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const keys=useRef(new Set<string>());
  const angles=useRef({yaw:Math.PI,pitch:0});
  const position=useRef({x:0,z:-2.67});
  const lastPublish=useRef(0);
  useEffect(()=>{
    keys.current.clear();
    if(mode==='walk') {
      camera.position.set(0,1.65,-2.67);camera.rotation.set(0,Math.PI,0);angles.current={yaw:Math.PI,pitch:0};position.current={x:0,z:-2.67};onPosition(0,-2.67);
    } else {const aspect=gl.domElement.clientWidth/Math.max(1,gl.domElement.clientHeight);const scale=aspect<1?1.35/Math.max(aspect,.4):1;camera.position.set(8*scale,8*scale,-11*scale);camera.lookAt(0,0,0);if(orbit.current){orbit.current.target.set(0,.2,0);orbit.current.update();}}
    if(document.pointerLockElement)document.exitPointerLock();
  },[mode,reset,camera,onPosition]);
  useEffect(()=>{
    if(mode!=='orbit'||!selected||!orbit.current)return;
    const item=items.find(i=>i.id===selected);if(!item)return;
    const p=new THREE.Vector3(...item.position);p.y=.8;
    orbit.current.target.copy(p);
    const offset=item.position[0]<-1?[3,2,-2]:item.position[0]>1?[-3,2,-2]:[3,2,-3];
    camera.position.set(p.x+offset[0],p.y+offset[1],p.z+offset[2]);
    orbit.current.update();
  },[selected,mode,camera]);
  useEffect(()=>{
    if(mode!=='walk')return;
    const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,select,textarea,[contenteditable=true]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code);}};
    const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
    const blur=()=>{keys.current.clear();motion.current.forward=0;motion.current.strafe=0;};
    const move=(e:MouseEvent)=>{if(document.pointerLockElement===gl.domElement){angles.current.yaw-=e.movementX*.0022;angles.current.pitch=THREE.MathUtils.clamp(angles.current.pitch-e.movementY*.0022,-1.2,1.2);}};
    const lock=()=>onLock(document.pointerLockElement===gl.domElement);
    const pointer=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button===0&&document.pointerLockElement!==gl.domElement) { const result=gl.domElement.requestPointerLock();result?.catch(()=>onLock(false)); }};
    const drag={active:false,x:0,y:0};
    const touchStart=(e:PointerEvent)=>{if(e.pointerType==='touch'){drag.active=true;drag.x=e.clientX;drag.y=e.clientY;gl.domElement.setPointerCapture(e.pointerId);}};
    const touchMove=(e:PointerEvent)=>{if(e.pointerType==='touch'&&drag.active){angles.current.yaw-=(e.clientX-drag.x)*.006;angles.current.pitch=THREE.MathUtils.clamp(angles.current.pitch-(e.clientY-drag.y)*.006,-1.2,1.2);drag.x=e.clientX;drag.y=e.clientY;}};
    const touchEnd=()=>{drag.active=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('mousemove',move);document.addEventListener('pointerlockchange',lock);
    gl.domElement.addEventListener('pointerdown',pointer);gl.domElement.addEventListener('pointerdown',touchStart);gl.domElement.addEventListener('pointermove',touchMove);gl.domElement.addEventListener('pointerup',touchEnd);gl.domElement.addEventListener('pointercancel',touchEnd);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('mousemove',move);document.removeEventListener('pointerlockchange',lock);gl.domElement.removeEventListener('pointerdown',pointer);gl.domElement.removeEventListener('pointerdown',touchStart);gl.domElement.removeEventListener('pointermove',touchMove);gl.domElement.removeEventListener('pointerup',touchEnd);gl.domElement.removeEventListener('pointercancel',touchEnd);blur();onLock(false);};
  },[mode,gl,motion,onLock]);
  useFrame(({clock},delta)=>{
    if(mode!=='walk')return;
    const k=keys.current;
    let f=Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'))+motion.current.forward;
    let s=Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))+motion.current.strafe;
    const length=Math.max(1,Math.hypot(f,s));f/=length;s/=length;
    const yaw=angles.current.yaw, speed=Math.min(delta,.05)*1.65;
    const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;
    const next=moveWithCollisions(position.current.x,position.current.z,dx,dz,gates);
    position.current=next;camera.position.set(next.x,1.65,next.z);camera.rotation.order='YXZ';camera.rotation.set(angles.current.pitch,angles.current.yaw,0);
    if(clock.elapsedTime-lastPublish.current>.16){onPosition(next.x,next.z);lastPublish.current=clock.elapsedTime;}
  });
  return mode==='orbit'?<OrbitControls ref={orbit} makeDefault minDistance={2.2} maxDistance={36} maxPolarAngle={Math.PI/2-.04} minPolarAngle={.12} enableDamping dampingFactor={.1} target={[0,.2,0]}/>:null;
}
function Ready({onReady}:{onReady:()=>void}){const frames=useRef(0);useFrame(()=>{if(frames.current++===0)onReady();});return null;}
function World(props:SceneProps){
  const sun=useRef<THREE.DirectionalLight>(null);
  useEffect(()=>{if(sun.current)sun.current.shadow.needsUpdate=true;},[props.mode,props.roof,props.gates,props.proposal]);
  return <>
  <color attach="background" args={['#eae8df']}/>
  <ambientLight intensity={.65}/><hemisphereLight args={['#fff8e9','#a2b2a2',1.1]}/>
  <directionalLight ref={sun} shadow-autoUpdate={false} position={[-3,8,-5]} intensity={2.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.035}/>
  <pointLight position={[0,2.7,-1.5]} intensity={14} color="#fff2d6" distance={7} decay={2}/>
  <pointLight position={[0,2.65,2.5]} intensity={18} color="#fffdf0" distance={6} decay={2}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.205,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#eae8df" roughness={1}/></mesh>
  <Architecture {...props}/>
  {items.map(item=><Furniture key={item.id} item={item} selected={props.selected===item.id} proposal={props.proposal} onSelect={props.onSelect}/>)}
  {props.mode==='orbit'&&!props.roof&&<>
    <Billboard position={[-1.75,.1,-4.8]}><Label text="01 / ACCESO" position={[0,0,0]} size={[.82,.17]} rotation={[0,0,0]} bg="#f3f2e8" fg="#7c896e"/></Billboard>
    <Billboard position={[-2.7,.1,.7]}><Label text="02 / TIENDA" position={[0,0,0]} size={[.85,.17]} rotation={[0,0,0]} bg="#f3f2e8" fg="#7c896e"/></Billboard>
    <Billboard position={[-2.9,.1,3.15]}><Label text="03 / CUIDADO" position={[0,0,0]} size={[.95,.17]} rotation={[0,0,0]} bg="#dbe4d8" fg="#7c896e"/></Billboard>
  </>}
  <CameraRig {...props}/><Ready onReady={props.onReady}/>
</>;}
export default function ShopScene(props:SceneProps){return <Canvas frameloop={props.mode==='walk'?'always':'demand'} shadows dpr={[1,1.5]} camera={{position:[8,8,-11],fov:43,near:.05,far:100}} gl={{antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false}} onPointerMissed={()=>{if(props.mode==='orbit')props.onSelect(null);}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;}}><World {...props}/></Canvas>;}
