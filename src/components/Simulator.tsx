'use client';
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronRight, CircleHelp, Compass, DoorOpen, Download, Footprints, Layers3, MapPin, Maximize2, MousePointer2, Move, PawPrint, RotateCcw, Ruler, ShieldCheck, SlidersHorizontal, Sparkles, Square, Wallet, X } from 'lucide-react';
import { budgetLines, dimensions, estimate, toggleGate, createLayout, defaultConfig, formatNumber, validateConfig, money, proposals, type GateState, type Proposal, type ViewMode, type LayoutConfig } from '@/lib/shop';
import type { Motion } from './ShopScene';
import FloorPlan from './FloorPlan';
import DesignerForm from './DesignerForm';
const Scene = dynamic(()=>import('./ShopScene'),{ssr:false,loading:()=> <div className="scene-loading"><span className="loading-ring"/>Preparando tu espacio…</div>});
class SceneBoundary extends Component<{children:ReactNode;onPlan:()=>void},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="scene-loading"><PawPrint size={36}/><h2>No pudimos iniciar la vista 3D</h2><p>Comprueba que la aceleración gráfica esté activada en Chrome o Edge.</p><button className="solid-button" onClick={this.props.onPlan}>Abrir plano 2D</button><button className="text-button" onClick={()=>location.reload()}>Reintentar</button></div>:this.props.children;}
}
export default function Simulator(){
  const [config,setConfig]=useState<LayoutConfig>(defaultConfig);
  const layout=useMemo(()=>createLayout(config),[config]);
  const items=layout.items;
  const area=config.width*config.depth;
  const [mode,setMode]=useState<ViewMode>('walk');
  const [proposal,setProposal]=useState<Proposal>('intermedia');
  const [roof,setRoof]=useState(true);
  const [selected,setSelected]=useState<string|null>(null);
  const [gates,setGates]=useState<GateState>({entrance:false,vestibule:false,service:false});
  const [reset,setReset]=useState(0);
  const [ready,setReady]=useState(false);
  const [locked,setLocked]=useState(false);
  const [position,setPosition]=useState({x:0,z:-2.67});
  const [panel,setPanel]=useState<'budget'|'objects'|null>(null);
  const [help,setHelp]=useState(false);
  const [mobilePanel,setMobilePanel]=useState(false);
  const [toast,setToast]=useState('');
  const motion=useRef<Motion>({forward:0,strafe:0,lookX:0,lookY:0});
  const viewer=useRef<HTMLDivElement>(null);
  const inspector=useRef<HTMLElement>(null);
  const active=items.find(i=>i.id===selected);
  const budget=estimate(proposal,layout), current=proposals.find(p=>p.id===proposal)!;
  const onReady=useCallback(()=>setReady(true),[]), onLock=useCallback((v:boolean)=>setLocked(v),[]);
  const onPosition=useCallback((x:number,z:number)=>setPosition({x,z}),[]);
  const onGate=useCallback((gate:keyof GateState)=>{
    const next=toggleGate(gates,gate);
    if(next===gates){setToast('Cierra primero la otra puerta del vestíbulo para evitar escapes.');return;}
    setGates(next);
  },[gates]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(document.pointerLockElement)document.exitPointerLock();setHelp(false);setPanel(null);setMobilePanel(false);}};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);},[]);
  useEffect(()=>{if(selected)inspector.current?.scrollIntoView({block:'nearest',behavior:'smooth'});},[selected,mobilePanel]);
  useEffect(()=>{
    try{const saved=localStorage.getItem('brio-config-v2');if(saved){const data=JSON.parse(saved);if(!validateConfig(data))setConfig(data);}}catch{}
  },[]);
  function applyConfig(next:LayoutConfig){
    setConfig(next);setSelected(null);setGates({entrance:false,vestibule:false,service:false});setReady(false);setReset(v=>v+1);setPanel(null);setMobilePanel(false);
    try{localStorage.setItem('brio-config-v2',JSON.stringify(next));}catch{}
    setToast(`Diseño actualizado: ${formatNumber(next.width*next.depth)} m². Distribución y presupuesto recalculados.`);
  }
  function select(id:string|null){setSelected(id);if(id){setPanel(null);if(window.innerWidth<900)setMobilePanel(true);}}
  function changeMode(value:ViewMode){setMode(value);setPanel(null);if(value==='walk'){setRoof(true);setSelected(null);}else if(value==='orbit')setRoof(false);}
  function home(){setMode('walk');setRoof(true);setSelected(null);setReset(v=>v+1);motion.current.forward=0;motion.current.strafe=0;}
  function exportBudget(){
    const rows=[['BRÍO PET · CASMA',current.name],['Medidas',`${config.width} × ${config.depth} × ${config.height} m`],['Área m²',area],['Partida','Categoría','Cantidad','Unidad','Precio unitario PEN','Total PEN'],...budgetLines(proposal,layout).map(l=>[l.name,l.category,l.quantity,l.unit,l.price,l.total]),['Subtotal',budget.subtotal],['Contingencia 10%',budget.contingency],['TOTAL PEN',budget.total],['Objetivo PEN',budget.target],['Diferencia PEN',budget.total-budget.target],['Precios orientativos. No son cotizaciones. Excluye alquiler, licencias, obra estructural, flete y capital de trabajo.']];
    const csv='\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`brio-pet-presupuesto-${proposal}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setToast('Presupuesto exportado en soles. Ábrelo en Excel o Google Sheets.');
  }
  const togglePanel=(p:'budget'|'objects')=>{setPanel(old=>old===p?null:p);setMobilePanel(true);};
  return <main className="studio">
    <header className="topbar">
      <a className="brand" href="#" aria-label="Brío Pet, inicio" onClick={e=>{e.preventDefault();setMode('orbit');setRoof(false);setSelected(null);setPanel(null);setMobilePanel(false);setReset(v=>v+1);}}><span className="brand-symbol"><PawPrint size={24} strokeWidth={1.7}/></span><span>brío pet<span className="brand-dot">.</span></span></a>
      <div className="project-separator"/><div className="project-name"><span>DISEÑADOR DE LOCALES</span><strong>Un proyecto de Luis y Briggite</strong></div>
      <nav className="top-nav" aria-label="Secciones del proyecto"><button className={mode!=='plan'&&panel!=='budget'?'active':''} onClick={()=>changeMode('orbit')}>Explorar</button><button className={mode==='plan'?'active':''} onClick={()=>changeMode('plan')}>Distribución</button><button className={panel==='budget'?'active':''} onClick={()=>togglePanel('budget')}>Inversión</button></nav>
      <span className="location"><MapPin size={14}/>Casma, Perú</span>
      <button className="icon-button help-button" onClick={()=>setHelp(true)} aria-label="Ayuda y controles"><CircleHelp size={19}/></button>
    </header>
    <div className="studio-body">
      <aside className="toolrail" aria-label="Herramientas"><span className="rail-label">ESTUDIO</span><button aria-label="Explorar modelo 3D" data-tooltip="Modelo 3D" className={mode==='orbit'?'rail-button active':'rail-button'} onClick={()=>changeMode('orbit')}><Layers3 size={21}/></button><button aria-label="Ver plano 2D" data-tooltip="Plano 2D" className={mode==='plan'?'rail-button active':'rail-button'} onClick={()=>changeMode('plan')}><Square size={20}/></button><button aria-label="Ver mobiliario" data-tooltip="Mobiliario" className={panel==='objects'?'rail-button active':'rail-button'} onClick={()=>togglePanel('objects')}><SlidersHorizontal size={20}/></button><button aria-label="Abrir presupuesto" data-tooltip="Presupuesto" className={panel==='budget'?'rail-button active':'rail-button'} onClick={()=>togglePanel('budget')}><Wallet size={20}/></button><div className="rail-spacer"/><button aria-label="Ayuda" className="rail-button" onClick={()=>setHelp(true)}><CircleHelp size={20}/></button><span className="rail-version">V.02</span></aside>
      <section className={`workspace ${mode==='walk'?'walking':''}`} ref={viewer} aria-label="Simulador arquitectónico">
        <div className="workspace-title"><div className="eyebrow"><span className="tiny-line"/>PROYECTO / 001</div><h1>{mode==='walk'?<>Conoce <em>Brío Pet.</em></>:mode==='plan'?<>Cada metro <em>cuenta.</em></>:<>Tu local.<br/>A tu <em>medida.</em></>}</h1><p>{mode==='walk'?'Recorre, observa e imagina tu negocio.':mode==='plan'?`${formatNumber(area)} m² distribuidos según tus medidas.`:'Configura el espacio y recórrelo antes de invertir.'}</p></div>
        <div className="view-status"><span className="status-dot"/>{mode==='plan'?'PLANO A ESCALA':ready?'MODELO 3D INTERACTIVO':'PREPARANDO MODELO'}<span className="view-status-sub">{mode==='walk'?'ALTURA DE CÁMARA / 1,65 M':`${formatNumber(config.width)} × ${formatNumber(config.depth)} M / ${formatNumber(area)} M²`}</span></div>
        <div className="scene-container" data-testid="scene">
          {mode==='plan'?<div className="plan-stage"><FloorPlan layout={layout} selected={selected} onSelect={select} gates={gates}/><span className="plan-note"><MousePointer2 size={14}/>Selecciona un mueble para ver sus detalles</span></div>:<SceneBoundary onPlan={()=>changeMode('plan')}><Scene key={`${config.width}-${config.depth}-${config.height}-${config.emphasis}-${config.finish}`} layout={layout} mode={mode} proposal={proposal} roof={roof} selected={selected} gates={gates} reset={reset} motion={motion} onSelect={select} onGate={onGate} onReady={onReady} onLock={onLock} onPosition={onPosition}/></SceneBoundary>}
        </div>
        {mode==='walk'&&<>
          <div className="crosshair" aria-hidden="true"/>
          <div className="walk-message">{locked?<><Move size={14}/>W A S D para caminar · Esc libera el cursor</>:<><MousePointer2 size={14}/><span className="desktop-hint">Haz clic en el espacio para mirar con el mouse</span><span className="touch-hint">Desliza para mirar · Usa las flechas para caminar</span></>}</div>
          <div className="gate-controls"><span><ShieldCheck size={13}/>ACCESOS SEGUROS</span>{(['entrance','vestibule','service'] as const).map((gate,i)=><button key={gate} className={gates[gate]?'gate-open':''} onClick={()=>onGate(gate)}><DoorOpen size={14}/>{['Puerta exterior','Puerta interior','Área de cuidado'][i]}<b>{gates[gate]?'Abierto':'Cerrado'}</b></button>)}</div>
          <div className="minimap" data-x={position.x.toFixed(3)} data-z={position.z.toFixed(3)}><FloorPlan layout={layout} small selected={selected} onSelect={select} position={position} gates={gates}/><span>ESTÁS AQUÍ</span></div>
          <div className="touch-pad" aria-label="Controles táctiles de movimiento">{[{label:'Avanzar',f:1,s:0,icon:ArrowUp,cls:'up'},{label:'Izquierda',f:0,s:-1,icon:ArrowLeft,cls:'left'},{label:'Retroceder',f:-1,s:0,icon:ArrowDown,cls:'down'},{label:'Derecha',f:0,s:1,icon:ArrowRight,cls:'right'}].map(({label,f,s,icon:Icon,cls})=><button key={label} className={cls} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);motion.current.forward=f;motion.current.strafe=s;window.dispatchEvent(new Event('brio-motion'));}} onPointerUp={()=>{motion.current.forward=0;motion.current.strafe=0;window.dispatchEvent(new Event('brio-motion'));}} onPointerCancel={()=>{motion.current.forward=0;motion.current.strafe=0;window.dispatchEvent(new Event('brio-motion'));}} onLostPointerCapture={()=>{motion.current.forward=0;motion.current.strafe=0;window.dispatchEvent(new Event('brio-motion'));}}><Icon size={21}/></button>)}</div>
        </>}
        {mode==='orbit'&&<div className="orbit-hint"><MousePointer2 size={14}/><span className="desktop-hint">Arrastra para girar<span className="hint-divider">·</span>Rueda para acercar</span><span className="touch-hint">Gira con un dedo<span className="hint-divider">·</span>Pellizca para acercar</span></div>}
        <div className="viewport-bottom">
          <div className="view-controls" aria-label="Modos de visualización"><button className={mode==='orbit'?'active':''} onClick={()=>changeMode('orbit')}><Layers3 size={16}/><span>Vista aérea</span></button><button className={mode==='walk'?'active':''} onClick={()=>changeMode('walk')}><Footprints size={16}/><span>Recorrer</span></button><button className={mode==='plan'?'active':''} onClick={()=>changeMode('plan')}><Square size={16}/><span>Plano 2D</span></button></div>
          <div className="viewport-actions"><button className={roof?'active':''} onClick={()=>setRoof(v=>!v)} disabled={mode==='plan'} aria-label={roof?'Ocultar techo':'Mostrar techo'} title={roof?'Ocultar techo':'Mostrar techo'}><Layers3 size={17}/><span>Techo</span>{roof&&<Check size={12}/>}</button><button onClick={home} aria-label="Regresar a la entrada" title="Regresar a la entrada"><RotateCcw size={17}/></button><button onClick={()=>{const result=document.fullscreenElement?document.exitFullscreen():viewer.current?.requestFullscreen();result?.catch(()=>setToast('La pantalla completa no está disponible en este navegador.'));}} aria-label="Pantalla completa" title="Pantalla completa"><Maximize2 size={17}/></button></div>
        </div>
        <div className="workspace-footer"><span><span className="live-dot"/>DISEÑO EXPLORABLE EN TIEMPO REAL</span><span><Compass size={13}/>CASMA · ÁNCASH <span className="footer-coord">/ 09°28′ S</span></span></div>
        <button className="mobile-project" onClick={()=>setMobilePanel(true)}><SlidersHorizontal size={16}/>Medidas del local<ChevronDown size={16}/></button>
      </section>
      {mobilePanel&&<button className="mobile-scrim" aria-label="Cerrar panel del proyecto" onClick={()=>{setMobilePanel(false);setPanel(null);}}/>}
      <aside className={`project-panel ${mobilePanel?'mobile-open':''} ${panel?'expanded-panel':''}`} aria-label="Detalles del proyecto">
        <div className="panel-top"><span className="eyebrow">{panel==='budget'?'INVERSIÓN':panel==='objects'?'EQUIPAMIENTO':'TU PROYECTO'}</span><button className="icon-button close-panel" aria-label="Cerrar panel" onClick={()=>{setPanel(null);setMobilePanel(false);}}><X size={18}/></button><span className="panel-index">01 / CASMA</span></div>
        {panel==='budget'?<>
          <div className="panel-heading"><h2>Hagamos números<span>.</span></h2><p>Una inversión informada empieza por los detalles.</p></div>
          <label className="proposal-select">Propuesta<select value={proposal} onChange={e=>setProposal(e.target.value as Proposal)}>{proposals.map(p=><option key={p.id} value={p.id}>{p.name} · objetivo {money(p.target)}</option>)}</select></label>
          <div className="budget-big"><span>INVERSIÓN ESTIMADA</span><strong>{money(budget.total)}</strong><small>Incluye 10% de contingencia</small></div>
          <div className="budget-scroll">{(['Mobiliario','Equipamiento','Acabados','Inventario inicial'] as const).map(category=><div className="budget-group" key={category}><h3>{category}<span>{money(budget.lines.filter(l=>l.category===category).reduce((s,l)=>s+l.total,0))}</span></h3>{budget.lines.filter(l=>l.category===category).map(l=><div className="budget-line" key={l.id}><div><span>{l.name}</span><small>{l.quantity} {l.unit} × {money(l.price)}</small></div><b>{money(l.total)}</b></div>)}</div>)}<div className="budget-totals"><span>Subtotal<b>{money(budget.subtotal)}</b></span><span>Contingencia · 10%<b>{money(budget.contingency)}</b></span><span className="grand-total">Total estimado<b>{money(budget.total)}</b></span></div></div>
          <div className="budget-warning">{budget.total>budget.target?`Supera el objetivo de ${money(budget.target)} en ${money(budget.total-budget.target)}.`:`Quedan ${money(budget.target-budget.total)} respecto al objetivo.`} No se ajustan partidas para forzar el presupuesto.</div>
          <button className="solid-button export-button" onClick={exportBudget}><Download size={16}/>Descargar presupuesto CSV</button>
          <p className="fine-print">Referencias de planificación, sin cotización comercial verificada. Consideran materiales y mano de obra indicados. No incluyen alquiler, licencias, obra estructural, flete a Casma ni capital de trabajo. Validar instalación sanitaria y eléctrica con técnicos locales.</p>
        </>:panel==='objects'?<>
          <div className="panel-heading"><h2>Cada cosa, en su lugar<span>.</span></h2><p>Selecciona un elemento para inspeccionarlo.</p></div>
          <div className="object-list">{items.map((item,i)=><button key={item.id} className={selected===item.id?'selected':''} onClick={()=>select(item.id)}><span className="object-number">{String(i+1).padStart(2,'0')}</span><div><strong>{item.name}</strong><small>{item.zone} · {money(item.prices[proposal])}</small></div><ArrowUpRight size={16}/></button>)}</div>
        </>:<>
          <div className="panel-heading"><div className="project-badge"><PawPrint size={17}/><span>BRÍO PET · CASMA</span></div><h2>Tu espacio,<br/>tu próximo comienzo<span>.</span></h2><p className="brand-story">Brío expresa fuerza y vitalidad: una marca inspirada en Luis y Briggite, creada para cuidar.</p></div><DesignerForm config={config} onApply={applyConfig}/>
          <div className="specs"><div><strong data-testid="floor-area">{formatNumber(area)}<span>m²</span></strong><small>ÁREA TOTAL</small></div><div><strong>{formatNumber(config.width)} × {formatNumber(config.depth)}<span>m</span></strong><small>DISTRIBUCIÓN</small></div><div><strong>{formatNumber(config.height)}<span>m</span></strong><small>ALTURA</small></div></div><div className="layout-notes">{layout.warnings.map((note,i)=><p key={i}><ShieldCheck size={13}/>{note}</p>)}</div>
          <div className="proposal-heading"><h3>Equipamiento y presupuesto</h3><span>03 OPCIONES</span></div>
          <div className="proposal-options" role="radiogroup" aria-label="Propuesta de inversión">{proposals.map((p,i)=><button key={p.id} role="radio" aria-checked={proposal===p.id} className={`proposal-card ${proposal===p.id?'selected':''}`} onClick={()=>setProposal(p.id)}><span className="proposal-icon">{i===0?<Square size={18}/>:i===1?<Layers3 size={19}/>:<Sparkles size={19}/>}</span><span className="proposal-text"><strong>{p.name}</strong><small>Objetivo {money(p.target)}</small></span><span className="radio-dot">{proposal===p.id&&<Check size={11}/>}</span></button>)}</div>
          <div className="summary"><div className="summary-label"><span>INVERSIÓN ESTIMADA</span><span className="estimate-tag">REF.</span></div><strong className="summary-total" data-testid="budget-total">{money(budget.total)}</strong><div className="budget-meter"><span style={{width:`${Math.min(budget.total/budget.target*100,100)}%`}}/></div><p className={budget.total>budget.target?'over-budget':''}>{budget.total>budget.target?`+ ${money(budget.total-budget.target)} sobre tu objetivo`:`${money(budget.target-budget.total)} disponibles del objetivo`}</p><button onClick={()=>togglePanel('budget')}>Ver presupuesto detallado<ArrowUpRight size={16}/></button></div>
          {active?<section ref={inspector} className="inspector" aria-live="polite"><div className="inspector-top"><span>ELEMENTO SELECCIONADO</span><button aria-label="Deseleccionar mobiliario" onClick={()=>setSelected(null)}><X size={14}/></button></div><h3>{active.name}</h3><div className="inspector-dim"><Ruler size={15}/>{dimensions(active.size)}</div><div className="inspector-meta"><span>Precio ref.<b>{money(active.prices[proposal])}</b></span><span>Cantidad<b>1 unidad</b></span></div><p>{active.features}</p><small>Ancho × profundidad × alto. Precio incluido en presupuesto.</small></section>:<button className="select-prompt" onClick={()=>togglePanel('objects')}><span className="select-icon"><MousePointer2 size={20}/></span><span><strong>Conoce cada detalle</strong><small>Toca un mueble en el modelo<br/>para ver medidas y precio.</small></span><ChevronRight size={16}/></button>}
          <div className="care-note"><ShieldCheck size={18}/><p>Diseñado con cuidado<span>Área húmeda separada, accesos seguros y superficies lavables.</span></p></div>
          <p className="fine-print">Precios orientativos en soles. No constituyen cotización ni expediente técnico. Incluye 10% de contingencia; consulta exclusiones en el presupuesto.</p>
        </>}
        <div className="panel-footer"><span>HECHO PARA IMAGINAR. PENSADO PARA EMPEZAR.</span><PawPrint size={14}/></div>
      </aside>
    </div>
    {toast&&<div className="toast" role="status"><ShieldCheck size={17}/>{toast}<button aria-label="Cerrar aviso" onClick={()=>setToast('')}><X size={15}/></button></div>}
    {help&&<div className="modal-backdrop" onClick={()=>setHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" autoFocus aria-label="Cerrar ayuda" onClick={()=>setHelp(false)}><X size={20}/></button><div className="project-badge"><Compass size={18}/>EXPLORA A TU RITMO</div><h2 id="help-title">Pasa, estás en casa.</h2><p>Introduce el frente, fondo y altura en «Medidas del local» y pulsa «Diseñar con estas medidas». El recinto, la distribución, los muebles, el plano y el presupuesto se recalculan. En locales pequeños se elimina la isla central para conservar circulación.</p><div className="help-rows"><div><Layers3/><span><b>Vista aérea</b>Arrastra para girar; usa la rueda para acercarte. Selecciona mobiliario para enfocarlo.</span></div><div><Footprints/><span><b>Recorrido a tu altura</b>Haz clic en el modelo para mirar con el mouse. Camina con W, A, S, D o flechas. Pulsa Esc para liberar el cursor.</span></div><div><Move/><span><b>En celular</b>Desliza sobre el modelo para mirar y mantén pulsadas las flechas para moverte. En vista aérea, gira con un dedo y acerca con dos.</span></div><div><ShieldCheck/><span><b>Puertas y colisiones</b>Los muebles y paredes detienen el movimiento. Abre la puerta del área de cuidado para pasar. Las dos puertas del vestíbulo no se abren a la vez.</span></div><div><Wallet/><span><b>Presupuesto transparente</b>Cambia de propuesta para actualizar acabados, productos y costos. Consulta cantidades, contingencia y exclusiones; exporta los números a CSV.</span></div></div><button className="solid-button" onClick={()=>setHelp(false)}>Empezar a explorar<ArrowRight size={16}/></button></section></div>}
  </main>;
}
