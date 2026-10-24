'use client';
import { useEffect,useState } from 'react';
import { ArrowRight, Ruler } from 'lucide-react';
import { formatNumber,validateConfig,type LayoutConfig } from '@/lib/shop';
export default function DesignerForm({config,onApply}:{config:LayoutConfig;onApply:(config:LayoutConfig)=>void}){
  const [draft,setDraft]=useState(config),[error,setError]=useState('');
  useEffect(()=>setDraft(config),[config]);
  const change=(name:'width'|'depth'|'height',value:string)=>setDraft(d=>({...d,[name]:value===''?NaN:Number(value)}));
  function submit(e:React.FormEvent){e.preventDefault();const problem=validateConfig(draft);if(problem){setError(problem);return;}setError('');onApply({...draft});}
  return <form className="designer-form" onSubmit={submit}>
    <div className="designer-form-title"><Ruler size={17}/><h3>Introduce las medidas de tu local</h3></div>
    <p>Base de 70 m²: 7 × 10 m. Ajusta la forma a tu inmueble.</p>
    <div className="dimension-fields">{([{key:'width',label:'Frente',min:3.2,max:12},{key:'depth',label:'Fondo',min:5.5,max:20},{key:'height',label:'Altura',min:2.5,max:4.5}] as const).map(field=><label key={field.key}>{field.label}<div><input required type="number" inputMode="decimal" aria-label={`${field.label} del local en metros`} min={field.min} max={field.max} step="0.1" value={Number.isNaN(draft[field.key])?'':draft[field.key]} onChange={e=>change(field.key,e.target.value)}/><span>m</span></div></label>)}</div>
    <div className="size-presets" aria-label="Medidas de ejemplo">{[[5,14],[7,10],[10,7],[8,12]].map(([width,depth])=><button type="button" key={width} onClick={()=>{setDraft(v=>({...v,width,depth}));setError('');}}>{formatNumber(width)} × {formatNumber(depth)}</button>)}</div>
    <label className="designer-select">Prioridad del diseño<select aria-label="Prioridad del diseño" value={draft.emphasis} onChange={e=>setDraft(v=>({...v,emphasis:e.target.value as LayoutConfig['emphasis']}))}><option value="equilibrado">Tienda y grooming equilibrados</option><option value="tienda">Más espacio para productos</option><option value="cuidado">Más espacio para baño y grooming</option></select></label>
    <label className="designer-select">Acceso de la tienda<select aria-label="Acceso de la tienda" value={draft.access} onChange={e=>setDraft(v=>({...v,access:e.target.value as LayoutConfig['access']}))}><option value="reja">Entrada abierta con reja enrollable</option><option value="abierto">Acceso libre sin puerta</option><option value="puerta">Puerta metálica opaca enrollable</option></select></label><label className="designer-select">Acabados<select aria-label="Acabados" value={draft.finish} onChange={e=>setDraft(v=>({...v,finish:e.target.value as LayoutConfig['finish']}))}><option value="nogal">Nogal, piedra y verde salvia</option><option value="roble">Roble claro, piedra y verde salvia</option></select></label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="apply-layout">Diseñar con estas medidas<ArrowRight size={16}/></button>
    <small>Frente: 3,20–12 m · fondo: 5,50–20 m · altura: 2,50–4,50 m.</small>
  </form>;
}
