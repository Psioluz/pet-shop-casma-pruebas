import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMove, moveWithCollisions, estimate, toggleGate, items, proposals, type GateState } from '../src/lib/shop';
const closed:GateState={entrance:false,vestibule:false,service:false};
const open:GateState={entrance:true,vestibule:true,service:true};
test('cada presupuesto concilia cantidades, subtotal, contingencia y objetivo',()=>{
  const totals=proposals.map(p=>{
    const b=estimate(p.id);
    assert.equal(b.target,p.target);
    assert.equal(b.subtotal,b.lines.reduce((sum,l)=>sum+l.quantity*l.price,0));
    assert.equal(b.total,b.subtotal+Math.round(b.subtotal*.1));
    assert.equal(new Set(b.lines.map(l=>l.id)).size,b.lines.length);
    assert.equal(b.lines.find(l=>l.id==='piso')?.quantity,40);
    assert.ok(b.total>0);return b.total;
  });
  assert.ok(totals[0]<totals[1]&&totals[1]<totals[2]);
});
test('mobiliario permanece dentro de la envolvente de 5 × 8 m',()=>{
  for(const i of items){assert.ok(Math.abs(i.position[0])+i.size[0]/2<=2.5,i.id);assert.ok(Math.abs(i.position[2])+i.size[2]/2<=4,i.id);assert.ok(i.size[1]<=3,i.id);}
});
test('paredes, muebles, mampara y puertas cerradas bloquean el paso',()=>{
  assert.equal(canMove(2.45,0,closed),false);
  assert.equal(canMove(0,4,closed),false);
  assert.equal(canMove(-2.18,-.95,closed),false);
  assert.equal(canMove(0,1.3,closed),false);
  assert.equal(canMove(1,1.3,open),false);
  assert.equal(canMove(0,-3.22,closed),false);
  assert.equal(canMove(0,-4,closed),false);
  assert.equal(canMove(0,1.3,open),true);
  assert.equal(canMove(0,-3.22,open),true);
  assert.equal(canMove(0,-4,open),true);
});
test('subpasos evitan atravesar mamparas incluso con desplazamientos grandes',()=>{
  const blocked=moveWithCollisions(0,.5,0,2,closed);
  assert.ok(blocked.z<1.1);
  const passed=moveWithCollisions(0,.5,0,2,open);
  assert.ok(passed.z>2.4);
});
test('se puede recorrer de recepción a cada zona de trabajo con pasos seguros',()=>{
  let pos={x:0,z:-2.67};
  // Left aisle, central gate, bath front, grooming front, storage approach.
  for(const waypoint of [{x:0,z:-2.1},{x:-1,z:-2.1},{x:-1,z:.75},{x:0,z:.75},{x:0,z:1.7},{x:-1.3,z:1.7},{x:0,z:1.7},{x:.35,z:2.8},{x:.6,z:3.2}]){
    const dx=waypoint.x-pos.x,dz=waypoint.z-pos.z;
    pos=moveWithCollisions(pos.x,pos.z,dx,dz,open);
    assert.ok(Math.hypot(pos.x-waypoint.x,pos.z-waypoint.z)<.06,JSON.stringify({pos,waypoint}));
  }
});

test('el vestíbulo impide abrir simultáneamente sus dos accesos',()=>{
  const exterior=toggleGate(closed,'entrance');
  assert.equal(exterior.entrance,true);
  assert.equal(toggleGate(exterior,'vestibule'),exterior);
  const interior=toggleGate(closed,'vestibule');
  assert.equal(interior.vestibule,true);
  assert.equal(toggleGate(interior,'entrance'),interior);
  assert.equal(toggleGate(interior,'service').service,true);
});
