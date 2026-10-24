"""Brío Pet: designer, 3D, budget and mobile regression against the static or Next build."""
import json,os,math
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('BASE_URL','http://127.0.0.1:3003/index.html')
OUT=Path(__file__).resolve().parents[1]/'playwright-results'
OUT.mkdir(exist_ok=True)

def position(page):
 m=page.locator('.minimap')
 return {'x':float(m.get_attribute('data-x')),'z':float(m.get_attribute('data-z'))}
def ready(page): expect(page.locator('.view-status')).to_contain_text('MODELO 3D INTERACTIVO',timeout=60000)
def config(page,w,d,h=3,priority='equilibrado',finish='nogal'):
 for label,value in [('Frente',w),('Fondo',d),('Altura',h)]:
  page.get_by_role('spinbutton',name=f'{label} del local en metros').fill(str(value))
 page.get_by_label('Prioridad del diseño',exact=True).select_option(priority)
 page.get_by_label('Acabados',exact=True).select_option(finish)
 page.get_by_role('button',name='Diseñar con estas medidas',exact=True).click()
 expect(page.get_by_test_id('floor-area')).to_contain_text(str(w*d).removesuffix('.0'))
def move_until(page,key,goal):
 page.keyboard.down(key)
 try:
  for _ in range(200):
   if goal(position(page)): return
   page.wait_for_timeout(100)
  raise AssertionError(position(page))
 finally:page.keyboard.up(key)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith(URL) and not r.url.startswith(('data:','blob:')) else None)
 page.goto(URL,wait_until='networkidle');ready(page)
 expect(page.get_by_role('link',name='Brío Pet, inicio')).to_be_visible()
 expect(page.get_by_test_id('floor-area')).to_have_text('70m²')
 expect(page.locator('.snack-range li')).to_have_count(6)
 page.get_by_role('button',name='Ver exhibidor',exact=True).click();ready(page)
 expect(page.locator('.inspector h3')).to_have_text('Barra de snacks y premios')
 page.screenshot(path=str(OUT/'brio-v3-surtido.png'))
 page.get_by_role('button',name='Recorrer',exact=True).click()
 page.wait_for_timeout(1200);page.screenshot(path=str(OUT/'brio-interior.png'))
 # Compact local: regenerate fixtures, budget and 2D footprint.
 config(page,3.5,6,2.7);ready(page)
 small_total=page.get_by_test_id('budget-total').inner_text()
 page.get_by_role('button',name='Ver mobiliario',exact=True).click()
 expect(page.locator('.object-list')).not_to_contain_text('Barra de snacks')
 page.get_by_role('button',name='Cerrar panel',exact=True).click()
 page.get_by_role('button',name='Plano 2D',exact=True).click()
 expect(page.locator('.floor-plan')).to_have_attribute('viewBox','0 0 255 400')
 page.get_by_role('button',name='Inspeccionar Tina de baño canino',exact=True).click()
 expect(page.locator('.inspector h3')).to_have_text('Tina de baño canino')
 expect(page.locator('.inspector-dim')).to_contain_text('1.20')
 page.screenshot(path=str(OUT/'brio-compacto.png'))
 # Larger local adds shelving modules and two central displays.
 config(page,8,12,3.5,'cuidado','roble')
 large_total=page.get_by_test_id('budget-total').inner_text()
 assert large_total!=small_total
 expect(page.locator('.floor-plan')).to_have_attribute('viewBox','0 0 480 700')
 page.get_by_role('button',name='Ver mobiliario',exact=True).click()
 expect(page.locator('.object-list button').filter(has_text='Barra de snacks')).to_have_count(2)
 page.get_by_role('button',name='Cerrar panel',exact=True).click()
 page.get_by_role('button',name='Vista aérea',exact=True).click();ready(page)
 page.screenshot(path=str(OUT/'brio-grande.png'))
 # Budget floor quantity is 96 m² and all proposals update.
 for name in ['Económica','Intermedia','Completa']:page.get_by_role('radio',name=name).click()
 page.get_by_role('button',name='Inversión',exact=True).click()
 expect(page.locator('.budget-line').filter(has_text='Cerámico')).to_contain_text('96 m²')
 with page.expect_download() as downloaded:page.get_by_role('button',name='Descargar presupuesto CSV').click()
 downloaded.value.save_as(str(OUT/'brio-presupuesto.csv'))
 csv=(OUT/'brio-presupuesto.csv').read_text(encoding='utf-8-sig')
 assert 'BRÍO PET' in csv and '96' in csv and 'Contingencia 10%' in csv
 page.get_by_role('button',name='Cerrar panel',exact=True).click()
 config(page,5,8);page.get_by_role('button',name='Regresar a la entrada',exact=True).click();ready(page)
 # Pointer lock, physical movement and closed service gate.
 canvas=page.locator('canvas');canvas.click(position={'x':500,'y':100})
 page.wait_for_function('!!document.pointerLockElement')
 page.keyboard.press('Escape');page.wait_for_function('!document.pointerLockElement')
 expect(page.get_by_role('button',name='Cuarto de servicios Cerrado',exact=True)).to_be_visible()
 before=position(page)
 move_until(page,'KeyW',lambda pos:pos['z']>=.4)
 stopped=position(page)
 assert math.hypot(stopped['x']-before['x'],stopped['z']-before['z'])>2
 assert stopped['z']<.5,{'before':before,'stopped':stopped}
 page.get_by_role('button',name='Cuarto de servicios Cerrado',exact=True).click()
 move_until(page,'KeyW',lambda pos:pos['z']>1.35)
 page.get_by_role('button',name='Reja de entrada Abierto',exact=True).click()
 expect(page.get_by_role('button',name='Reja de entrada Cerrado',exact=True)).to_be_visible()
 expect(page.get_by_role('button',name='Cuarto de servicios Abierto',exact=True)).to_be_visible()
 page.get_by_role('button',name='Reja de entrada Cerrado',exact=True).click()
 # Entrance variants remove the glass vestibule and persist the chosen access.
 page.get_by_label('Acceso de la tienda',exact=True).select_option('abierto')
 page.get_by_role('button',name='Diseñar con estas medidas',exact=True).click();ready(page)
 expect(page.locator('.gate-controls button')).to_have_count(1)
 page.get_by_label('Acceso de la tienda',exact=True).select_option('puerta')
 page.get_by_role('button',name='Diseñar con estas medidas',exact=True).click();ready(page)
 expect(page.get_by_role('button',name='Puerta de entrada Abierto',exact=True)).to_be_visible()
 page.get_by_role('button',name='Ayuda y controles',exact=True).click();expect(page.get_by_role('dialog')).to_be_visible()
 page.keyboard.press('Escape')
 assert not errors,errors
 print('Desktop: dimensions, compact/large redesign, plan, budget, walking and gates passed.',flush=True)
 # Mobile configuration and real touch input.
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 mobile=context.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.goto(URL,wait_until='networkidle');ready(mobile)
 mobile.get_by_role('button',name='Medidas del local',exact=True).click()
 config(mobile,4,7,2.8);ready(mobile)
 expect(mobile.locator('.project-panel')).not_to_be_visible()
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
 mobile.screenshot(path=str(OUT/'brio-movil.png'))
 start=position(mobile);button=mobile.get_by_role('button',name='Avanzar',exact=True);expect(button).to_be_visible()
 box=button.bounding_box();cdp=context.new_cdp_session(mobile)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}]})
 for _ in range(180):
  if position(mobile)['z']>start['z']+.25:break
  mobile.wait_for_timeout(100)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert position(mobile)['z']>start['z']+.2
 mobile.reload(wait_until='networkidle');ready(mobile)
 mobile.get_by_role('button',name='Medidas del local',exact=True).click()
 expect(mobile.get_by_role('spinbutton',name='Frente del local en metros')).to_have_value('4')
 expect(mobile.get_by_role('spinbutton',name='Fondo del local en metros')).to_have_value('7')
 assert not errors,errors
 assert not external,external
 browser.close()
 print(json.dumps({'dimension_change':'passed','compact_layout':'passed','large_layout':'passed','budget_recalculation':'passed','csv':'passed','pointer_lock_and_collision':'passed','mobile_dimensions_and_touch':'passed','persistence':'passed','javascript_errors':errors,'external_requests':external},ensure_ascii=False))
