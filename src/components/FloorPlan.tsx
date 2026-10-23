'use client';
import { items, type GateState } from '@/lib/shop';
export default function FloorPlan({selected,onSelect,small=false,position,gates}:{selected:string|null;onSelect:(id:string)=>void;small?:boolean;position?:{x:number;z:number};gates?:GateState}) {
  const scale=50,x=(v:number)=>25+(v+2.5)*scale,y=(v:number)=>25+(4-v)*scale;
  return <svg className={small?'mini-plan':'floor-plan'} viewBox="0 0 300 475" role="img" aria-label="Plano de distribución de 5 por 8 metros, acceso abajo y servicios al fondo">
    <defs><pattern id={small?'grid-mini':'grid-plan'} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#d9d9cd" strokeWidth=".6"/></pattern></defs>
    <rect x="25" y="25" width="250" height="400" rx="1" fill="#f7f5ed" stroke="#365344" strokeWidth="3"/>
    <rect x="26" y="26" width="248" height="133" fill="#dce8dd"/>
    <rect x="25" y="25" width="250" height="400" fill={`url(#${small?'grid-mini':'grid-plan'})`}/>
    <path d="M25 160 H120 M180 160 H275" stroke="#7ca18c" strokeWidth="3"/>
    <path d="M120 160 H180" stroke={gates?.service?'#c6d1c1':'#d4834e'} strokeWidth="2" strokeDasharray="4 4"/>
    <rect x="108.5" y="385" width="83" height="40" fill="none" stroke="#7ca18c" strokeWidth="1"/>
    {items.map(item=><g key={item.id} role={small?undefined:'button'} tabIndex={small?undefined:0} aria-label={small?undefined:`Inspeccionar ${item.name}`} onClick={()=>onSelect(item.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(item.id);}}} style={{cursor:'pointer'}}>
      <rect x={x(item.position[0])-item.size[0]*scale/2} y={y(item.position[2])-item.size[2]*scale/2} width={item.size[0]*scale} height={item.size[2]*scale} rx="2" fill={selected===item.id?'#d4834e':item.kind==='bath'||item.kind==='groom'?'#8daa99':'#d9c5a5'} stroke={selected===item.id?'#a1552a':'#8b8d75'} strokeWidth={selected===item.id?2:1}/>
      {!small&&item.kind!=='plant'&&<text x={x(item.position[0])} y={y(item.position[2])} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#263c32" transform={item.kind==='shelf'?`rotate(-90 ${x(item.position[0])} ${y(item.position[2])})`:undefined}>{item.kind==='shelf'?item.id==='alimentos'?'ALIMENTOS':'ACCESORIOS':item.kind==='bath'?'BAÑO':item.kind==='groom'?'GROOMING':item.kind==='counter'?'CAJA':item.kind==='bench'?'ESPERA':item.kind==='island'?'SNACKS':item.kind==='storage'?'ALMACÉN':''}</text>}
    </g>)}
    {!small&&<>
      <text x="150" y="215" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#778779">TIENDA</text>
      <text x="150" y="230" textAnchor="middle" fontSize="8" fill="#778779">26 m²</text>
      <text x="150" y="132" textAnchor="middle" fontSize="8" fill="#567a61">ÁREA DE CUIDADO · 14 m²</text>
      <path d="M36 9 H264 M25 5 V15 M275 5 V15 M288 25 V425 M284 25 H293 M284 425 H293" stroke="#94a290" fill="none"/>
      <text x="150" y="7" textAnchor="middle" fontSize="9" fill="#56705e">5,00 m</text>
      <text x="297" y="225" textAnchor="middle" fontSize="9" fill="#56705e" transform="rotate(90 297 225)">8,00 m</text>
      <path d="M130 425 H170" stroke="#f7f5ed" strokeWidth="5"/>
      <path d="M150 456 V435 M144 443 L150 435 L156 443" stroke="#56705e" fill="none" strokeWidth="1.5"/>
      <text x="150" y="473" textAnchor="middle" fontSize="9" letterSpacing="1" fill="#56705e">ACCESO PRINCIPAL</text>
    </>}
    {position&&<><circle cx={x(position.x)} cy={y(position.z)} r="9" fill="#d4834e" opacity=".2"/><circle cx={x(position.x)} cy={y(position.z)} r="4" fill="#d4834e" stroke="#fff" strokeWidth="1.5"/></>}
  </svg>;
}
