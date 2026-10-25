'use client';
import { formatNumber, type ShopLayout, type GateState } from '@/lib/shop';
export default function FloorPlan({layout,selected,onSelect,small=false,position,gates}:{layout:ShopLayout;selected:string|null;onSelect:(id:string)=>void;small?:boolean;position?:{x:number;z:number};gates?:GateState}) {
  const {width:w,depth:d}=layout.config,scale=50,W=w*scale,H=d*scale;
  const x=(v:number)=>35+(v+w/2)*scale,y=(v:number)=>30+(d/2-v)*scale;
  const center=35+W/2,front=30+H,partition=y(layout.partition),gate=layout.serviceWidth*scale/2;
  return <svg className={small?'mini-plan':'floor-plan'} viewBox={`0 0 ${W+80} ${H+100}`} role="img" aria-label={`Plano de ${formatNumber(w)} por ${formatNumber(d)} metros`}>
    <defs><pattern id={small?'grid-mini':'grid-plan'} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0 H0 V25" fill="none" stroke="#d5d6cd" strokeWidth=".6"/></pattern></defs>
    <rect x="35" y="30" width={W} height={H} fill="#f5f2e9" stroke="#304a42" strokeWidth="4"/>
    <rect x="36" y="31" width={W-2} height={partition-31} fill="#dbe4df"/>
    <rect x="35" y="30" width={W} height={H} fill={`url(#${small?'grid-mini':'grid-plan'})`}/>
    <path d={`M35 ${partition} H${center-gate} M${center+gate} ${partition} H${35+W}`} stroke="#495c4f" strokeWidth="7"/>
    <path d={`M${center-gate} ${partition} h${gate*2}`} stroke={gates?.service?'#b6c8bf':'#bd855e'} strokeWidth="4" strokeDasharray={gates?.service?"4 4":undefined}/>
    <path d={`M${center-layout.entryWidth*scale/2} ${front} h${layout.entryWidth*scale}`} stroke={gates?.entrance||layout.config.access==='abierto'?'#f5f2e9':'#495c4f'} strokeWidth="5"/>
    {layout.items.map(item=><g key={item.id} role={small?undefined:'button'} tabIndex={small?undefined:0} aria-label={small?undefined:`Inspeccionar ${item.name}`} onClick={()=>onSelect(item.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(item.id);}}} style={{cursor:'pointer'}}>
      <rect x={x(item.position[0])-item.size[0]*scale/2} y={y(item.position[2])-item.size[2]*scale/2} width={item.size[0]*scale} height={item.size[2]*scale} rx="3" fill={selected===item.id?'#bb8056':item.kind==='bath'||item.kind==='groom'?'#95aaa3':'#c9b391'} stroke={selected===item.id?'#895d3c':'#6b7b6c'} strokeWidth={selected===item.id?2:1}/>
      {!small&&item.kind!=='plant'&&<text x={x(item.position[0])} y={y(item.position[2])} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#263c32" transform={item.kind==='shelf'?`rotate(-90 ${x(item.position[0])} ${y(item.position[2])})`:undefined}>{item.kind==='shelf'?item.department==='ropa'?'ROPA':item.department==='juguetes'?'JUGUETES':item.department==='boutique'?'BOUTIQUE':item.department==='higiene'?'HIGIENE':item.department==='alimentos'?'ALIMENTOS':'PASEO':item.kind==='bath'?'BAÑO':item.kind==='groom'?'GROOMING':item.kind==='counter'?'CAJA':item.kind==='bench'?'ESPERA':item.kind==='island'?'SNACKS':item.kind==='storage'?'ALMACÉN':''}</text>}
    </g>)}
    {!small&&<>
      <text x={center} y={(partition+front)/2+14} textAnchor="middle" fontSize="9" fill="#778779">TIENDA · {formatNumber(layout.retailArea)} m²</text>
      <text x={center} y={partition-14} textAnchor="middle" fontSize="10" fill="#567a61">CUARTO CERRADO · {formatNumber(layout.serviceArea)} m²</text>
      <path d={`M35 15 H${35+W} M35 10 V20 M${35+W} 10 V20 M${W+53} 30 V${front}`} stroke="#94a290" fill="none"/>
      <text x={center} y="10" textAnchor="middle" fontSize="9" fill="#56705e">{formatNumber(w)} m</text>
      <text x={W+66} y={30+H/2} textAnchor="middle" fontSize="9" fill="#56705e" transform={`rotate(90 ${W+66} ${30+H/2})`}>{formatNumber(d)} m</text>

      <path d={`M${center} ${front+35} v-23 m-6 7 l6 -7 6 7`} stroke="#56705e" fill="none" strokeWidth="1.5"/>
      <text x={center} y={front+55} textAnchor="middle" fontSize="9" letterSpacing="1" fill="#56705e">ACCESO PRINCIPAL</text>
    </>}
    {position&&<><circle cx={x(position.x)} cy={y(position.z)} r="9" fill="#bd855e" opacity=".2"/><circle cx={x(position.x)} cy={y(position.z)} r="4" fill="#bd855e" stroke="#fff" strokeWidth="1.5"/></>}
  </svg>;
}
