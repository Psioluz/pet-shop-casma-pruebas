"""Browser regression checks. Requires Python Playwright and a running production server."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get('BASE_URL', 'http://127.0.0.1:3000')
OUT = Path(__file__).resolve().parents[1] / 'playwright-results'
OUT.mkdir(exist_ok=True)

def position(page):
    dot = page.locator('.mini-plan circle').last
    return {'x': (float(dot.get_attribute('cx'))-25)/50-2.5,
            'z': 4-(float(dot.get_attribute('cy'))-25)/50}

def hold(page, key, duration):
    page.keyboard.down(key)
    page.wait_for_timeout(duration)
    page.keyboard.up(key)
    page.wait_for_timeout(250)

def move_until(page,key,predicate,timeout=18000):
    page.keyboard.down(key)
    try:
        for _ in range(timeout//100):
            if predicate(position(page)): return
            page.wait_for_timeout(100)
        raise AssertionError({'movement_target_not_reached':key,'position':position(page)})
    finally:
        page.keyboard.up(key)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True, args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':1440,'height':1000}, device_scale_factor=1)
    errors, external = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request',lambda r: external.append(r.url) if not r.url.startswith(BASE_URL) and not r.url.startswith(('data:', 'blob:')) else None)
    page.goto(BASE_URL, wait_until='networkidle')
    expect(page.locator('.view-status')).to_contain_text('MODELO 3D INTERACTIVO', timeout=60000)
    print('desktop scene ready',flush=True)
    expect(page.locator('canvas')).to_be_visible()
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / 'desktop.png'))
    # Pick the counter directly in the WebGL canvas, not through a DOM proxy.
    page.mouse.click(649, 644)
    expect(page.locator('.inspector h3')).to_have_text('Mostrador y punto de venta', timeout=10000)
    print('3D picking passed',flush=True)
    totals = {}
    for name in ['Económica','Intermedia','Completa']:
        page.get_by_role('radio', name=name).click()
        expect(page.get_by_role('radio',name=name)).to_have_attribute('aria-checked','true')
        totals[name] = page.get_by_test_id('budget-total').inner_text()
    assert len(set(totals.values())) == 3
    page.get_by_role('button',name='Mostrar techo',exact=True).click()
    expect(page.get_by_role('button',name='Ocultar techo',exact=True)).to_be_visible()
    page.get_by_role('button',name='Ocultar techo',exact=True).click()
    page.get_by_role('button',name='Plano 2D',exact=True).click()
    page.get_by_role('button',name='Inspeccionar Tina de baño canino',exact=True).click()
    expect(page.locator('.inspector h3')).to_have_text('Tina de baño canino')
    page.screenshot(path=str(OUT / 'plano.png'))
    page.get_by_role('button',name='Inversión',exact=True).click()
    expect(page.locator('.budget-group')).to_have_count(4)
    with page.expect_download() as download:
        page.get_by_role('button',name='Descargar presupuesto CSV').click()
    exported=download.value
    exported.save_as(str(OUT / exported.suggested_filename))
    csv=(OUT / exported.suggested_filename).read_text(encoding='utf-8-sig')
    assert 'Contingencia 10%' in csv and 'TOTAL PEN' in csv and '40' in csv
    print('budget, plan, CSV passed',flush=True)
    page.get_by_role('button',name='Regresar a la entrada',exact=True).click()
    expect(page.locator('.minimap')).to_be_visible()
    page.wait_for_timeout(500)
    assert abs(position(page)['z']+2.67)<.05
    # Pointer lock and mouse-look in the actual browser.
    canvas=page.locator('canvas')
    canvas.click(position={'x':500,'y':420})
    page.wait_for_function('!!document.pointerLockElement')
    assert page.evaluate('!!document.pointerLockElement')
    page.keyboard.press('Escape')
    page.wait_for_function('!document.pointerLockElement')
    move_until(page,'KeyW',lambda pos:pos['z']>=-1.15)
    first_stop=position(page)
    assert -2.65 < first_stop['z'] <= -1.1, first_stop
    # Continue trying to walk through the island; the camera must remain outside it.
    hold(page,'KeyW',1000)
    assert position(page)['z'] <= -1.1, position(page)
    # Move along the left-hand aisle then toward the closed service gate.
    move_until(page,'KeyD',lambda pos:pos['x']<=-.9)
    assert position(page)['x'] < -.5, position(page)
    move_until(page,'KeyW',lambda pos:pos['z']>=1.02)
    assert position(page)['z'] <= 1.08, position(page)
    service=page.get_by_role('button',name='Área de cuidado Cerrado',exact=True)
    service.click()
    expect(page.get_by_role('button',name='Área de cuidado Abierto',exact=True)).to_be_visible()
    # Move back to the central opening and actually enter the service zone.
    move_until(page,'KeyA',lambda pos:pos['x']>=-.15)
    move_until(page,'KeyW',lambda pos:pos['z']>=1.7)
    assert position(page)['z']>1.6,position(page)
    # Verify the entrance's interlock through the real UI.
    page.get_by_role('button',name='Puerta exterior Cerrado',exact=True).click()
    page.get_by_role('button',name='Puerta interior Cerrado',exact=True).click()
    expect(page.get_by_role('button',name='Puerta interior Cerrado',exact=True)).to_be_visible()
    expect(page.get_by_role('status')).to_contain_text('Cierra primero')
    page.screenshot(path=str(OUT / 'recorrido.png'))
    page.get_by_role('button',name='Ayuda y controles').click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    assert not errors, errors
    assert not external, external

    mobile_context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    mobile=mobile_context.new_page()
    mobile.on('pageerror',lambda e: errors.append(str(e)))
    mobile.goto(BASE_URL,wait_until='networkidle')
    expect(mobile.locator('.view-status')).to_contain_text('MODELO 3D INTERACTIVO',timeout=60000)
    print('mobile scene ready',flush=True)
    assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
    mobile.screenshot(path=str(OUT / 'mobile.png'))
    mobile.get_by_role('button',name='Proyecto & presupuesto',exact=True).click()
    expect(mobile.locator('.project-panel')).to_be_visible()
    mobile.get_by_role('radio',name='Económica').click()
    mobile.get_by_role('button',name='Cerrar panel',exact=True).click()
    mobile.get_by_role('button',name='Recorrer',exact=True).click()
    expect(mobile.get_by_role('button',name='Avanzar',exact=True)).to_be_visible()
    mobile.wait_for_timeout(500)
    before=position(mobile)
    button=mobile.get_by_role('button',name='Avanzar',exact=True)
    # Chromium's touch protocol generates real touch pointers and capture events.
    cdp=mobile_context.new_cdp_session(mobile)
    box=button.bounding_box()
    tx,ty=box['x']+box['width']/2,box['y']+box['height']/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':tx,'y':ty}]})
    for _ in range(150):
        if position(mobile)['z']>before['z']+.3: break
        mobile.wait_for_timeout(100)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    mobile.wait_for_timeout(250)
    after=position(mobile)
    assert after['z']>before['z']+.15, {'before':before,'after':after}
    assert after['z']<=-1.1
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':250,'y':400}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':290,'y':410}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    mobile.screenshot(path=str(OUT / 'mobile-recorrido.png'))
    assert not errors,errors
    browser.close()
    print(json.dumps({'desktop':'passed','direct_3d_selection':'passed','plan_selection':'passed','proposals':totals,'csv':'passed','pointer_lock':'passed','keyboard_movement_and_collisions':'passed','door_interlock':'passed','mobile_touch_movement':'passed','javascript_errors':errors,'external_asset_requests':external},ensure_ascii=False))
