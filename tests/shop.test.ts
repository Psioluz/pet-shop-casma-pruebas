import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMove,moveWithCollisions,estimate,toggleGate,createLayout,departmentTarget,storeDepartments,snackAssortment,defaultConfig,validateConfig,proposals,type GateState } from '../src/lib/shop';
const closed:GateState={entrance:false,service:false};
const careOpen:GateState={...closed,service:true};
const sizes=[[3.2,5.5],[3.5,6],[4,7],[5,8],[6,10],[7,10],[5,14],[10,7],[8,12],[12,20]];
test('rechaza dimensiones inválidas y valores no finitos',()=>{
 for(const patch of [{width:0},{depth:2},{height:1},{width:NaN},{depth:Infinity}])assert.ok(validateConfig({...defaultConfig,...patch}));
 assert.equal(validateConfig(defaultConfig),null);
});
test('todos los muebles caben, sin superponerse, en locales compactos y grandes',()=>{
 for(const [width,depth] of sizes)for(const emphasis of ['equilibrado','tienda','cuidado'] as const){
  const l=createLayout({...defaultConfig,width,depth,emphasis});
  for(const i of l.items){assert.ok(Math.abs(i.position[0])+i.size[0]/2<=width/2+.001,`${width}x${depth} ${i.id} ancho`);assert.ok(Math.abs(i.position[2])+i.size[2]/2<=depth/2+.001,`${width}x${depth} ${i.id} fondo`);}
  for(let a=0;a<l.items.length;a++)for(let b=a+1;b<l.items.length;b++){
   const i=l.items[a],j=l.items[b];
   const overlapX=(i.size[0]+j.size[0])/2-Math.abs(i.position[0]-j.position[0]);
   const overlapZ=(i.size[2]+j.size[2])/2-Math.abs(i.position[2]-j.position[2]);
   assert.ok(overlapX<=.005||overlapZ<=.005,`${width}x${depth} ${emphasis}: ${i.id} se superpone a ${j.id}`);
  }
 }
});
test('reorganiza la distribución, conserva tamaños de equipo y aumenta módulos',()=>{
 const small=createLayout({...defaultConfig,width:3.5,depth:6});
 const normal=createLayout(defaultConfig);
 const large=createLayout({...defaultConfig,width:8,depth:12});
 assert.equal(small.items.filter(i=>i.kind==='island').length,0);
 assert.equal(createLayout({...defaultConfig,width:5,depth:7,emphasis:'cuidado'}).items.filter(i=>i.kind==='island').length,0);
 assert.equal(normal.items.filter(i=>i.kind==='island').length,1);
 assert.equal(large.items.filter(i=>i.kind==='island').length,2);
 assert.ok(large.items.filter(i=>i.kind==='shelf').reduce((n,i)=>n+i.size[2],0)>normal.items.filter(i=>i.kind==='shelf').reduce((n,i)=>n+i.size[2],0));
 assert.equal(large.items.find(i=>i.id==='tina')!.size[0],1.5);
 assert.equal(normal.items.find(i=>i.id==='tina')!.size[0],1.5);
 assert.equal(small.items.find(i=>i.id==='tina')!.size[0],1.2);
});
test('presupuesto calcula áreas reales, módulos, subtotal y contingencia',()=>{
 for(const [width,depth] of sizes)for(const p of proposals){
  const l=createLayout({...defaultConfig,width,depth}),b=estimate(p.id,l);
  assert.equal(b.lines.find(x=>x.id==='piso')!.quantity,width*depth);
  assert.equal(b.lines.filter(x=>x.category==='Mobiliario').length,l.items.filter(x=>x.category==='Mobiliario').length);
  assert.equal(b.subtotal,b.lines.reduce((s,x)=>s+x.quantity*x.price,0));
  assert.equal(b.total,b.subtotal+Math.round(b.subtotal*.1));
 }
 assert.ok(estimate('intermedia',createLayout({...defaultConfig,width:8,depth:12})).total>estimate('intermedia').total);
});
test('prioridad de cuidado cambia el reparto de áreas sin cambiar superficie total',()=>{
 const care=createLayout({...defaultConfig,emphasis:'cuidado'}),shop=createLayout({...defaultConfig,emphasis:'tienda'});
 assert.ok(care.serviceArea>shop.serviceArea);
 assert.equal(care.serviceArea+care.retailArea,70);
});
test('colisiones se ajustan a las nuevas paredes, muebles y puerta de servicios',()=>{
 for(const [width,depth] of sizes){
  const l=createLayout({...defaultConfig,width,depth});
  assert.equal(canMove(width/2,0,closed,.19,l),false);
  assert.equal(canMove(0,depth/2,closed,.19,l),false);
  assert.equal(canMove(0,l.partition,closed,.19,l),false);
  assert.equal(canMove(0,l.partition,careOpen,.19,l),true);
  const start=l.partition-.5;
  assert.ok(moveWithCollisions(0,start,0,1,closed,l).z<l.partition-.2);
  assert.ok(moveWithCollisions(0,start,0,1,careOpen,l).z>l.partition+.25);
 }
});
test('entrada y cuarto cerrado tienen controles y colisiones independientes',()=>{
 const exterior=toggleGate(closed,'entrance');assert.equal(exterior.entrance,true);assert.equal(exterior.service,false);
 const both=toggleGate(exterior,'service');assert.equal(both.service,true);assert.equal(both.entrance,true);
 for(const access of ['abierto','reja','puerta'] as const){
  const l=createLayout({...defaultConfig,access});
  assert.equal(canMove(0,l.front,closed,.19,l),access==='abierto');
  assert.equal(canMove(0,l.front,{...closed,entrance:true},.19,l),true);
  assert.equal(canMove(0,l.partition,closed,.19,l),false);
 }
});
test('base de 70 m², recepción y espera retiradas, y surtido diverso de snacks',()=>{
 const l=createLayout(defaultConfig);assert.equal(l.config.width*l.config.depth,70);
 for(const id of ['caja','espera']){
  const item=l.items.find(i=>i.id===id)!;
  assert.ok(item.position[2]-item.size[2]/2-l.front>4,'recepción y espera deben quedar retiradas de la fachada');
  assert.ok(item.position[2]+item.size[2]/2<l.partition,'fuera del cuarto de servicios');
 }
 assert.equal(new Set(snackAssortment.map(x=>x.shape)).size,6);
 assert.ok(estimate('intermedia',l).lines.some(x=>x.id==='division'&&x.name.includes('opaco')));
});
test('puede alcanzarse el frente de baño, grooming y estantes mediante pasillos',()=>{
 for(const [width,depth] of sizes){
  const l=createLayout({...defaultConfig,width,depth}),step=.1;
  const start={x:0,z:l.front+1.4};assert.ok(canMove(start.x,start.z,careOpen,.19,l));
  const queue=[start],seen=new Set(['0,0']);
  for(let q=0;q<queue.length;q++){
   const p=queue[q];
   for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
    const next={x:p.x+dx,z:p.z+dz},key=`${Math.round(next.x/step)},${Math.round((next.z-start.z)/step)}`;
    if(seen.has(key)||next.z<l.front+.2)continue;
    seen.add(key);if(canMove(next.x,next.z,careOpen,.19,l))queue.push(next);
   }
  }
  for(const i of l.items.filter(i=>['bath','groom','shelf'].includes(i.kind))){
   const target=i.kind==='shelf'?{x:i.position[0]+(i.position[0]<0?1:-1)*(i.size[0]/2+.32),z:i.position[2]}:i.kind==='bath'?{x:i.position[0],z:i.position[2]-i.size[2]/2-.3}:{x:i.position[0]-i.size[0]/2-.3,z:i.position[2]};
   assert.ok(queue.some(p=>Math.hypot(p.x-target.x,p.z-target.z)<.18),`${width}x${depth}: acceso a ${i.id}`);
  }
 }
});

test('la tienda de 70 m² reserva exhibidores distintos para ropa, paseo, juego y alimentos',()=>{
 const l=createLayout(defaultConfig);
 for(const department of ['alimentos','ropa','accesorios','juguetes'])assert.ok(l.items.some(i=>i.department===department),department);
 for(const department of storeDepartments){const item=departmentTarget(l.items,department.id);assert.ok(item&&l.items.includes(item),department.id);}
 const small=createLayout({...defaultConfig,width:3.5,depth:6});
 assert.ok(small.items.some(i=>i.department==='boutique'));
 for(const department of storeDepartments)assert.ok(departmentTarget(small.items,department.id));
 const large=createLayout({...defaultConfig,width:8,depth:12});
 assert.equal(large.items.filter(i=>i.kind==='island'&&!i.department).length,1,'los snacks se concentran en una isla');
 assert.ok(large.items.some(i=>i.id==='isla-extra'&&i.department==='juguetes'));
 assert.ok(estimate('intermedia',l).lines.some(i=>i.id==='ambientacion'&&i.total>0));
});
