export type Proposal = 'economica' | 'intermedia' | 'completa';
export type ViewMode = 'orbit' | 'walk' | 'plan';
export type Vec3 = [number, number, number];
export type ItemKind = 'shelf' | 'counter' | 'bench' | 'island' | 'bath' | 'groom' | 'dryer' | 'storage' | 'towels' | 'plant' | 'bed';
export interface ShopItem {
  id: string; name: string; kind: ItemKind; position: Vec3; size: Vec3;
  category: 'Mobiliario' | 'Equipamiento' | 'Acabados' | 'Inventario inicial';
  prices: Record<Proposal, number>; features: string; zone: string;
}
const prices = (a: number, b: number, c: number) => ({ economica: a, intermedia: b, completa: c });
export const proposals: { id: Proposal; name: string; target: number; subtitle: string }[] = [
  { id: 'economica', name: 'Económica', target: 10000, subtitle: 'Lo necesario para empezar' },
  { id: 'intermedia', name: 'Intermedia', target: 15000, subtitle: 'Más capacidad, mejor acabado' },
  { id: 'completa', name: 'Completa', target: 25000, subtitle: 'Equipamiento de mayor duración' },
];
export const items: ShopItem[] = [
  { id:'alimentos', name:'Estantería de alimentos', kind:'shelf', position:[-2.18,0,-0.95], size:[0.48,1.9,2.8], category:'Mobiliario', prices:prices(680,950,1450), features:'Cuatro niveles. Estructura metálica y melamina. Sacos de perros, gatos y arena en el nivel inferior; snacks arriba.', zone:'Tienda' },
  { id:'accesorios', name:'Estantería de accesorios e higiene', kind:'shelf', position:[2.18,0,-0.6], size:[0.48,1.9,2.5], category:'Mobiliario', prices:prices(620,900,1350), features:'Shampoos, juguetes, correas, collares y arneses. Separada de la zona húmeda por mampara.', zone:'Tienda' },
  { id:'caja', name:'Mostrador y punto de venta', kind:'counter', position:[1.35,0,-3.17], size:[1.65,1.05,0.65], category:'Mobiliario', prices:prices(850,1250,1900), features:'Mostrador de melamina con almacenamiento y equipo POS básico incluido. Frente lavable, tablero sellado.', zone:'Recepción' },
  { id:'espera', name:'Banco de espera', kind:'bench', position:[-1.55,0,-3.14], size:[1.3,0.82,0.55], category:'Mobiliario', prices:prices(250,420,650), features:'Dos asientos con tapiz sintético lavable. Espacio inferior para limpieza. No bloquea el acceso central.', zone:'Recepción' },
  { id:'isla', name:'Exhibidor central de snacks', kind:'island', position:[0,0,-0.35], size:[0.8,1.1,1.15], category:'Mobiliario', prices:prices(280,480,750), features:'Exhibidor bajo de dos niveles. Mantiene la visibilidad desde recepción y pasillos laterales de más de un metro.', zone:'Tienda' },
  { id:'tina', name:'Tina de baño canino', kind:'bath', position:[-1.5,0,2.85], size:[1.5,1.1,0.85], category:'Equipamiento', prices:prices(1250,2100,3600), features:'Tina elevada, ducha de mano, grifería y retención supervisada. Básica: revestida; intermedia y completa: acero inoxidable. Conexión sanitaria presupuestada aparte.', zone:'Área húmeda' },
  { id:'mesa', name:'Mesa de grooming', kind:'groom', position:[1.25,0,2.15], size:[1.2,0.85,0.65], category:'Equipamiento', prices:prices(650,1100,2100), features:'Tablero antideslizante, brazo y lazo de seguridad. Fija en Económica, altura manual en Intermedia e hidráulica en Completa. Uso siempre supervisado.', zone:'Peluquería' },
  { id:'secador', name:'Sopladora y secador', kind:'dryer', position:[2.1,0,3.15], size:[0.45,1.3,0.5], category:'Equipamiento', prices:prices(480,850,1450), features:'Sopladora compacta con manguera, secador y soporte. Circuito protegido y separado de salpicaduras; temperatura regulada según mascota.', zone:'Peluquería' },
  { id:'almacen', name:'Almacén compacto', kind:'storage', position:[0.05,0,3.65], size:[1.05,2.1,0.5], category:'Mobiliario', prices:prices(420,680,1050), features:'Gabinete cerrado para reposición de productos secos. Sin químicos de limpieza ni toallas húmedas en su interior.', zone:'Almacén' },
  { id:'limpieza', name:'Módulo de limpieza y toallas', kind:'towels', position:[-2.15,0,1.93], size:[0.45,1.9,0.7], category:'Mobiliario', prices:prices(230,380,580), features:'Toallas limpias en la parte superior; productos de limpieza cerrados en el gabinete inferior. Cesto diferenciado para textiles usados.', zone:'Área húmeda' },
  { id:'camas', name:'Cama y transportadora de exhibición', kind:'bed', position:[1.75,0,0.96], size:[0.85,0.55,0.55], category:'Inventario inicial', prices:prices(200,350,550), features:'Una cama mediana y una transportadora. Muestra comercial junto a accesorios, fuera de la circulación principal.', zone:'Tienda' },
  { id:'planta', name:'Maceta decorativa', kind:'plant', position:[-2.15,0,-3.65], size:[0.3,0.85,0.3], category:'Mobiliario', prices:prices(65,95,140), features:'Follaje artificial, sin toxicidad vegetal ni tierra expuesta a mascotas. Maceta estable y lavable.', zone:'Recepción' },
];
export interface BudgetLine { id: string; name: string; category: ShopItem['category']; quantity: number; unit: string; price: number; total: number }
export function budgetLines(proposal: Proposal): BudgetLine[] {
  const base = items.map(i => ({ id:i.id, name:i.name, category:i.category, quantity:1, unit:'ud.', price:i.prices[proposal], total:i.prices[proposal] }));
  const extras: {id:string;name:string;category:ShopItem['category'];qty:number;unit:string;values:Record<Proposal,number>}[] = [
    {id:'piso',name:'Cerámico antideslizante instalado',category:'Acabados',qty:40,unit:'m²',values:prices(45,58,75)},
    {id:'pintura',name:'Pintura lavable y sellado',category:'Acabados',qty:65,unit:'m²',values:prices(8,12,18)},
    {id:'mamparas',name:'Mamparas y puertas de seguridad',category:'Acabados',qty:1,unit:'lote',values:prices(1100,1600,2400)},
    {id:'sanitaria',name:'Agua, desagüe y trampa de pelo',category:'Acabados',qty:1,unit:'lote',values:prices(750,1000,1450)},
    {id:'electrica',name:'LED, ventilación y protección diferencial',category:'Acabados',qty:1,unit:'lote',values:prices(650,950,1350)},
    {id:'herramientas',name:'Máquina, tijeras, cepillos y utensilios',category:'Equipamiento',qty:1,unit:'kit',values:prices(450,800,1450)},
    {id:'stock',name:'Alimentos, snacks, arena, higiene y correas',category:'Inventario inicial',qty:1,unit:'lote',values:prices(900,1600,3000)},
    {id:'rotulo',name:'Letrero e identidad básica',category:'Acabados',qty:1,unit:'ud.',values:prices(230,380,650)},
  ];
  return [...base, ...extras.map(i=>({id:i.id,name:i.name,category:i.category,quantity:i.qty,unit:i.unit,price:i.values[proposal],total:i.qty*i.values[proposal]}))];
}
export function estimate(proposal: Proposal) {
  const lines = budgetLines(proposal);
  const subtotal = lines.reduce((sum,line)=>sum+line.total,0);
  const contingency = Math.round(subtotal * 0.1);
  return { lines, subtotal, contingency, total:subtotal+contingency, target:proposals.find(p=>p.id===proposal)!.target };
}
export const money = (value:number) => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:0}).format(value);
export const dimensions = (size:Vec3) => `${size[0].toFixed(2)} × ${size[2].toFixed(2)} × ${size[1].toFixed(2)} m`;
export type GateState = { entrance:boolean; vestibule:boolean; service:boolean };
export function toggleGate(gates:GateState,gate:keyof GateState):GateState {
  if((gate==='entrance'&&gates.vestibule)||(gate==='vestibule'&&gates.entrance))return gates;
  return {...gates,[gate]:!gates[gate]};
}
export type Obstacle = {x:number;z:number;w:number;d:number};
export function obstacles(gates:GateState): Obstacle[] {
  return [
    ...items.map(i=>({x:i.position[0],z:i.position[2],w:i.size[0],d:i.size[2]})),
    {x:-1.55,z:1.3,w:1.9,d:0.08},{x:1.55,z:1.3,w:1.9,d:0.08},
    {x:-0.83,z:-3.6,w:0.06,d:0.8},{x:0.83,z:-3.6,w:0.06,d:0.8},
    ...(!gates.entrance?[{x:0,z:-4,w:1.6,d:0.08}]:[]),
    ...(!gates.vestibule?[{x:0,z:-3.22,w:1.6,d:0.06}]:[]),
    ...(!gates.service?[{x:0,z:1.3,w:1.2,d:0.06}]:[]),
    ...(gates.entrance?[-.8,.8].map(x=>({x,z:-4.4,w:.035,d:.8})):[]),
    ...(gates.vestibule?[-.8,.8].map(x=>({x,z:-2.82,w:.035,d:.8})):[]),
  ];
}
export function canMove(x:number,z:number,gates:GateState,radius=0.19):boolean {
  if(x < -2.5+radius || x > 2.5-radius || z > 4-radius || z < -5.4+radius) return false;
  // Front facade can be crossed only through its 1.6 m opening.
  if(z < -4+radius && z > -4-radius && Math.abs(x)>0.8-radius) return false;
  if(z < -4 && Math.abs(x)>0.8-radius) return false;
  return !obstacles(gates).some(b=>Math.abs(x-b.x)<b.w/2+radius && Math.abs(z-b.z)<b.d/2+radius);
}
export function moveWithCollisions(x:number,z:number,dx:number,dz:number,gates:GateState) {
  // Substeps prevent tunnelling through thin glass when a frame is delayed.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/0.055));
  for(let i=0;i<steps;i++) {
    if(canMove(x+dx/steps,z,gates)) x+=dx/steps;
    if(canMove(x,z+dz/steps,gates)) z+=dz/steps;
  }
  return {x,z};
}
