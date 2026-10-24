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
  { id:'alimentos', name:'Estantería de alimentos', kind:'shelf', position:[-2.18,0,-0.95], size:[0.48,1.9,2.8], category:'Mobiliario', prices:prices(680,950,1450), features:'Sacos de alimento y arena abajo; conservas, sobres húmedos, premios y snacks arriba. Módulos por categoría con rótulos de lectura frontal.', zone:'Tienda' },
  { id:'accesorios', name:'Estantería de accesorios e higiene', kind:'shelf', position:[2.18,0,-0.6], size:[0.48,1.9,2.5], category:'Mobiliario', prices:prices(620,900,1350), features:'Shampoos, juguetes, correas, collares y arneses. Separada del cuarto de baño y peluquería por un muro opaco.', zone:'Tienda' },
  { id:'caja', name:'Mostrador y punto de venta', kind:'counter', position:[1.35,0,-3.17], size:[1.65,1.05,0.65], category:'Mobiliario', prices:prices(850,1250,1900), features:'Mostrador de melamina con almacenamiento y equipo POS básico incluido. Frente lavable, tablero sellado. Ubicado al fondo de la tienda con espacio de trabajo detrás, retirado de la fachada.', zone:'Recepción' },
  { id:'espera', name:'Banco de espera', kind:'bench', position:[-1.55,0,-3.14], size:[1.3,0.82,0.55], category:'Mobiliario', prices:prices(250,420,650), features:'Dos asientos con tapiz sintético lavable. Espacio inferior para limpieza. Junto al cuarto de servicios, retirada de la entrada y bajo techo; no ocupa el acceso central.', zone:'Recepción' },
  { id:'isla', name:'Barra de snacks y premios', kind:'island', position:[0,0,-0.35], size:[0.8,1.1,1.15], category:'Mobiliario', prices:prices(280,480,750), features:'Exhibidor bajo con frascos de galletas, tiras de pollo, bocados de pescado, masticables dentales, premios de entrenamiento y snacks de enriquecimiento. Propuesta de surtido; formatos cerrados e identificados.', zone:'Tienda' },
  { id:'tina', name:'Tina de baño canino', kind:'bath', position:[-1.5,0,2.85], size:[1.5,1.1,0.85], category:'Equipamiento', prices:prices(1250,2100,3600), features:'Tina elevada, ducha de mano, grifería y retención supervisada. Básica: revestida; intermedia y completa: acero inoxidable. Conexión sanitaria presupuestada aparte.', zone:'Área húmeda' },
  { id:'mesa', name:'Mesa de grooming', kind:'groom', position:[1.25,0,2.15], size:[1.2,0.85,0.65], category:'Equipamiento', prices:prices(650,1100,2100), features:'Tablero antideslizante, brazo y lazo de seguridad. Fija en Económica, altura manual en Intermedia e hidráulica en Completa. Uso siempre supervisado.', zone:'Peluquería' },
  { id:'secador', name:'Sopladora y secador', kind:'dryer', position:[2.1,0,3.15], size:[0.45,1.3,0.5], category:'Equipamiento', prices:prices(480,850,1450), features:'Sopladora compacta con manguera, secador y soporte. Circuito protegido y separado de salpicaduras; temperatura regulada según mascota.', zone:'Peluquería' },
  { id:'almacen', name:'Almacén compacto', kind:'storage', position:[0.05,0,3.65], size:[1.05,2.1,0.5], category:'Mobiliario', prices:prices(420,680,1050), features:'Gabinete cerrado para reposición de productos secos. Sin químicos de limpieza ni toallas húmedas en su interior.', zone:'Almacén' },
  { id:'limpieza', name:'Módulo de limpieza y toallas', kind:'towels', position:[-2.15,0,1.93], size:[0.45,1.9,0.7], category:'Mobiliario', prices:prices(230,380,580), features:'Toallas limpias en la parte superior; productos de limpieza cerrados en el gabinete inferior. Cesto diferenciado para textiles usados.', zone:'Área húmeda' },
  { id:'camas', name:'Cama y transportadora de exhibición', kind:'bed', position:[1.75,0,0.96], size:[0.85,0.55,0.55], category:'Inventario inicial', prices:prices(200,350,550), features:'Una cama mediana y una transportadora. Muestra comercial junto a accesorios, fuera de la circulación principal.', zone:'Tienda' },
  { id:'planta', name:'Maceta decorativa', kind:'plant', position:[-2.15,0,-3.65], size:[0.3,0.85,0.3], category:'Mobiliario', prices:prices(65,95,140), features:'Follaje artificial, sin toxicidad vegetal ni tierra expuesta a mascotas. Maceta estable y lavable.', zone:'Recepción' },
];

export const snackAssortment = [
 {name:'Galletas horneadas',detail:'Avena y calabaza · premio crujiente',shape:'cookie',color:'#bf793e'},
 {name:'Tiras de pollo',detail:'Deshidratadas · proteína única',shape:'jerky',color:'#9a4b31'},
 {name:'Bocados de pescado',detail:'Premios pequeños para gatos',shape:'fish',color:'#d29e64'},
 {name:'Masticables dentales',detail:'Barritas con relieve · higiene oral',shape:'dental',color:'#799150'},
 {name:'Premios de entrenamiento',detail:'Bocados pequeños · porciones controladas',shape:'bites',color:'#a85d38'},
 {name:'Aros de enriquecimiento',detail:'Snacks para usar con juguetes interactivos',shape:'ring',color:'#ce9b55'},
] as const;

export interface LayoutConfig { width:number; depth:number; height:number; emphasis:'equilibrado'|'tienda'|'cuidado'; finish:'roble'|'nogal'; access:'abierto'|'reja'|'puerta' }
export interface ShopLayout { config:LayoutConfig; items:ShopItem[]; front:number; back:number; partition:number; entryWidth:number; serviceWidth:number; serviceArea:number; retailArea:number; warnings:string[] }
export const defaultConfig:LayoutConfig={width:7,depth:10,height:3,emphasis:'equilibrado',finish:'nogal',access:'reja'};
export const formatNumber=(n:number)=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:2}).format(n);
export function validateConfig(c:LayoutConfig):string|null {
  if(!c||!['equilibrado','tienda','cuidado'].includes(c.emphasis)||!['roble','nogal'].includes(c.finish)||!['abierto','reja','puerta'].includes(c.access))return 'Selecciona un tipo de distribución y acabado válidos.';
  if(![c.width,c.depth,c.height].every(Number.isFinite))return 'Introduce medidas válidas en metros.';
  if(c.width<3.2||c.width>12)return 'El frente debe medir entre 3,20 y 12 m.';
  if(c.depth<5.5||c.depth>20)return 'El fondo debe medir entre 5,50 y 20 m.';
  if(c.height<2.5||c.height>4.5)return 'La altura debe medir entre 2,50 y 4,50 m.';
  return null;
}
export function createLayout(config:LayoutConfig):ShopLayout {
  const error=validateConfig(config);if(error)throw new Error(error);
  const c={...config},w=c.width,d=c.depth,front=-d/2,back=d/2;
  const serviceDepth=Math.min(d-3.3,c.emphasis==='cuidado'?4:c.emphasis==='tienda'?2.8:3.2);
  const partition=back-serviceDepth,entryWidth=c.access==='puerta'?Math.min(1.8,w-.5):w-.5,serviceWidth=Math.min(1.2,w-2.0);
  const result:ShopItem[]=[];
  function put(id:string,position:Vec3,size?:Vec3,newId?:string){
    const source=items.find(i=>i.id===id)!;const dims=size||source.size;
    const factor=source.kind==='shelf'?dims[2]/source.size[2]:source.kind==='counter'?dims[0]/source.size[0]:1;
    result.push({...source,id:newId||id,position,size:[...dims],prices:{economica:Math.round(source.prices.economica*factor),intermedia:Math.round(source.prices.intermedia*factor),completa:Math.round(source.prices.completa*factor)}});
  }
  const shelfStart=front+.85,shelfEnd=partition-2.1,span=Math.max(.35,shelfEnd-shelfStart);
  const modules=Math.max(1,Math.ceil(span/3.4)),length=(span-(modules-1)*.13)/modules;
  for(let n=0;n<modules;n++){
    const z=shelfStart+length/2+n*(length+.13);
    put('alimentos',[-w/2+.34,0,z],[.48,1.9,length],n?'alimentos-'+n:'alimentos');
    put('accesorios',[w/2-.34,0,z],[.48,1.9,length],n?'accesorios-'+n:'accesorios');
  }
  const counterWidth=Math.min(1.65,(w-1.4)/2),benchWidth=Math.min(1.3,(w-1.5)/2);
  put('caja',[w/2-.12-counterWidth/2,0,partition-1.05],[counterWidth,1.05,.65]);
  put('espera',[-w/2+.12+benchWidth/2,0,partition-.57],[benchWidth,.82,.55]);
  if(w>=4.8&&d-serviceDepth>=5.5){
    const z=(shelfStart+shelfEnd)/2;
    put('isla',[w>=7.2?-1.1:0,0,z]);
    if(w>=7.2)put('isla',[1.1,0,z],[.8,1.1,1.15],'isla-extra');
  }
  const bathWidth=w<4.2?1.2:1.5,tableWidth=w<4.2?.95:1.2;
  put('tina',[-w/2+.2+bathWidth/2,0,back-.8],[bathWidth,1.1,.85]);
  put('mesa',[w/2-.35-tableWidth/2,0,partition+.95],[tableWidth,.85,.65]);
  put('secador',[w/2-.38,0,back-.65]);
  put('almacen',[w<4.2?.25:0,0,back-.35],[w<4.2?.6:1.05,2.1,.5]);
  put('limpieza',[-w/2+.33,0,partition+.52]);
  if(w>=4.6&&d-serviceDepth>=5.5)put('camas',[w/2-.95,0,front+.38],[.85,.55,.55]);
  if(w>=4.2)put('planta',[-w/2+.2,0,front+.22]);
  const warnings:string[]=[];
  if(!result.some(i=>i.kind==='island'))warnings.push('Distribución compacta: sin isla central para conservar el paso.');
  if(w<4.2)warnings.push('Tina y mesa compactas: prever atención de mascotas pequeñas y medianas.');
  if(c.emphasis==='cuidado')warnings.push('Se reserva más fondo para baño y peluquería; se reduce la exhibición comercial.');
  warnings.push('Recepción y espera al fondo; cuarto de servicios con muros y puerta opacos.');
  warnings.push('Distribución preliminar. Validar puertas, evacuación e instalaciones con las medidas reales del inmueble.');
  return {config:c,items:result,front,back,partition,entryWidth,serviceWidth,serviceArea:w*serviceDepth,retailArea:w*(d-serviceDepth),warnings};
}
export const defaultLayout=createLayout(defaultConfig);
export interface BudgetLine { id: string; name: string; category: ShopItem['category']; quantity: number; unit: string; price: number; total: number }
export function budgetLines(proposal: Proposal,layout:ShopLayout=defaultLayout): BudgetLine[] {
  const base = layout.items.map(i => ({ id:i.id, name:i.name, category:i.category, quantity:1, unit:'ud.', price:i.prices[proposal], total:i.prices[proposal] }));
  const extras: {id:string;name:string;category:ShopItem['category'];qty:number;unit:string;values:Record<Proposal,number>}[] = [
    {id:'piso',name:'Cerámico antideslizante instalado',category:'Acabados',qty:Number((layout.config.width*layout.config.depth).toFixed(2)),unit:'m²',values:prices(45,58,75)},
    {id:'pintura',name:'Pintura lavable y sellado',category:'Acabados',qty:Number(((2*(layout.config.width+layout.config.depth)*layout.config.height)-layout.config.width*2.6).toFixed(2)),unit:'m²',values:prices(8,12,18)},
    {id:'division',name:'Tabique opaco lavable del cuarto de servicios',category:'Acabados',qty:Number((layout.config.width*layout.config.height-layout.serviceWidth*2.15).toFixed(2)),unit:'m²',values:prices(75,95,135)},
    {id:'puerta-servicio',name:'Puerta opaca corrediza del cuarto de servicios',category:'Acabados',qty:1,unit:'ud.',values:prices(350,550,850)},
    {id:'acceso',name:layout.config.access==='puerta'?'Puerta opaca de acceso':layout.config.access==='reja'?'Reja metálica enrollable':'Remate de acceso abierto',category:'Acabados',qty:1,unit:'lote',values:layout.config.access==='abierto'?prices(180,260,380):prices(Math.round(650*layout.entryWidth/2),Math.round(850*layout.entryWidth/2),Math.round(1100*layout.entryWidth/2))},
    {id:'toldo',name:'Toldo de fachada y estructura ligera',category:'Acabados',qty:layout.config.width,unit:'m lineal',values:prices(100,145,210)},
    {id:'sanitaria',name:'Agua, desagüe y trampa de pelo',category:'Acabados',qty:1,unit:'lote',values:prices(750,1000,1450)},
    {id:'electrica',name:'LED, ventilación y protección diferencial',category:'Acabados',qty:1,unit:'lote',values:prices(Math.round(650*(.5+layout.config.width*layout.config.depth/80)),Math.round(950*(.5+layout.config.width*layout.config.depth/80)),Math.round(1350*(.5+layout.config.width*layout.config.depth/80)))},
    {id:'herramientas',name:'Máquina, tijeras, cepillos y utensilios',category:'Equipamiento',qty:1,unit:'kit',values:prices(450,800,1450)},
    {id:'stock',name:'Stock inicial según metros de exhibición',category:'Inventario inicial',qty:Math.max(.6,Math.round(layout.items.filter(i=>i.kind==='shelf').reduce((sum,i)=>sum+i.size[2],0)/5.6*100)/100),unit:'lote base',values:prices(900,1600,3000)},
    {id:'rotulo',name:'Letrero e identidad básica',category:'Acabados',qty:1,unit:'ud.',values:prices(230,380,650)},
  ];
  return [...base, ...extras.map(i=>({id:i.id,name:i.name,category:i.category,quantity:i.qty,unit:i.unit,price:i.values[proposal],total:i.qty*i.values[proposal]}))];
}
export function estimate(proposal: Proposal,layout:ShopLayout=defaultLayout) {
  const lines = budgetLines(proposal,layout);
  const subtotal = lines.reduce((sum,line)=>sum+line.total,0);
  const contingency = Math.round(subtotal * 0.1);
  return { lines, subtotal, contingency, total:subtotal+contingency, target:proposals.find(p=>p.id===proposal)!.target };
}
export const money = (value:number) => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:0}).format(value);
export const dimensions = (size:Vec3) => `${size[0].toFixed(2)} × ${size[2].toFixed(2)} × ${size[1].toFixed(2)} m`;
export type GateState = { entrance:boolean; service:boolean };
export const initialGates=():GateState=>({entrance:true,service:false});
export function toggleGate(gates:GateState,gate:keyof GateState):GateState {
  return {...gates,[gate]:!gates[gate]};
}
export type Obstacle = {x:number;z:number;w:number;d:number};
export function obstacles(gates:GateState,layout:ShopLayout=defaultLayout): Obstacle[] {
  const {front,partition,entryWidth,serviceWidth}=layout,w=layout.config.width;
  return [
    ...layout.items.map(i=>({x:i.position[0],z:i.position[2],w:i.size[0],d:i.size[2]})),
    ...[-1,1].map(side=>({x:side*(w+serviceWidth)/4,z:partition,w:(w-serviceWidth)/2,d:.14})),
    ...(layout.config.access!=='abierto'&&!gates.entrance?[{x:0,z:front,w:entryWidth,d:.06}]:[]),
    ...(!gates.service?[{x:0,z:partition-.12,w:serviceWidth,d:.07}]:[]),
  ];
}
export function canMove(x:number,z:number,gates:GateState,radius=0.19,layout:ShopLayout=defaultLayout):boolean {
  const {width,depth}=layout.config;
  if(x < -width/2+radius || x > width/2-radius || z > depth/2-radius || z < -depth/2-1.4+radius) return false;
  if(z < layout.front+radius && Math.abs(x)>layout.entryWidth/2-radius) return false;
  return !obstacles(gates,layout).some(b=>Math.abs(x-b.x)<b.w/2+radius && Math.abs(z-b.z)<b.d/2+radius);
}
export function moveWithCollisions(x:number,z:number,dx:number,dz:number,gates:GateState,layout:ShopLayout=defaultLayout) {
  // Substeps prevent tunnelling through thin walls when a frame is delayed.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/0.055));
  for(let i=0;i<steps;i++) {
    if(canMove(x+dx/steps,z,gates,.19,layout)) x+=dx/steps;
    if(canMove(x,z+dz/steps,gates,.19,layout)) z+=dz/steps;
  }
  return {x,z};
}
