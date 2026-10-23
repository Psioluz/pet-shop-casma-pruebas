# Miga · Pet Shop & Grooming 3D

Simulador arquitectónico interactivo para un local de referencia en **Casma, Áncash, Perú**: 5 m de frente, 8 m de fondo, 3 m de altura y 40 m². Aplicación independiente del repositorio Terapitools.

El espacio es geometría tridimensional real, con navegación libre, colisiones y selección por raycasting. No usa fotografías, panoramas ni renders como sustituto de la escena.

## Abrir el modelo sin instalar programas

La carpeta `docs` contiene la versión autónoma del simulador. También se distribuye como `modelo-3d-listo.zip`: descomprime ese archivo y abre **ABRIR-MODELO-3D.html** con Chrome o Edge. El HTML incluye la aplicación, Three.js, los productos y la interfaz; no necesita Node.js ni descargar modelos externos.

Para reconstruir esa versión desde el código: `npm ci` y `npm run build:standalone`. El archivo se genera en `docs/index.html`. No reemplaza la aplicación Next.js: ambas usan los mismos componentes y datos.

## Publicar la demo en GitHub Pages

Se proporciona una rama `gh-pages` con `index.html` y `.nojekyll`, preparada para servir el simulador estático. Si Pages no está activo, el propietario del repositorio debe abrir **Settings → Pages**, seleccionar **Deploy from a branch**, elegir **gh-pages / (root)** y guardar. GitHub Pages puede exigir que el repositorio sea público en planes gratuitos.

La integración usada para subir el código no dispone de permisos de administración de Pages ni de visibilidad. Guardar el HTML en una rama no confirma por sí solo que haya una web publicada. Comprueba que GitHub muestre el estado de publicación y la URL antes de compartir la demo.

## Ejecución

Recomendado: **Node.js 24 LTS** y npm. También requiere un navegador con WebGL 2 y aceleración gráfica; Chrome y Edge actuales son los navegadores objetivo.

```bash
cd pet-shop-casma
npm ci
npm run dev
```

Abre el puerto 3000 de la máquina donde ejecutas el proyecto. Para producción:

```bash
npm run build
npm start
```

No requiere claves, servicios externos, base de datos ni variables de entorno. Todos los modelos, las texturas procedurales y los rótulos se generan localmente con Three.js. La aplicación no descarga modelos, fuentes ni imágenes desde terceros durante el recorrido.

## Controles

| Función | Acción |
| --- | --- |
| Vista aérea | Arrastrar para orbitar; rueda o pellizco para zoom; arrastre secundario para desplazar el foco |
| Inspección | Seleccionar un mueble en 3D, en el plano o desde la herramienta Mobiliario; en vista aérea la cámara lo enfoca |
| Recorrer | Cámara a 1,65 m; W/A/S/D o flechas para caminar; clic en el modelo para capturar el mouse |
| Mirar alrededor | Mouse capturado; Esc libera el cursor |
| Celular | Deslizar sobre el modelo para mirar; mantener pulsadas las flechas para moverse |
| Plano 2D | Planta a escala, mobiliario seleccionable y cotas generales |
| Techo | Mostrar u ocultar; el recorrido comienza con la envolvente completa |
| Regresar a la entrada | Reinicia la posición y orientación dentro de la recepción |
| Puertas | Controles de acceso durante el recorrido; las dos puertas del vestíbulo están enclavadas |
| Presupuesto | Cambiar propuesta, revisar partidas y exportar CSV compatible con hojas de cálculo |

Los controles de colisión usan una cámara con radio de 19 cm, límites del recinto y subpasos para evitar atravesar paredes finas. Se comprueban por separado los movimientos X y Z para deslizarse junto a los obstáculos. El pasillo central contiene una isla: se recorre por los laterales. Para entrar al fondo abre **Área de cuidado** y atraviesa el paso central de 1,20 m. Las puertas exterior e interior del vestíbulo no pueden permanecer abiertas simultáneamente.

## Distribución y diseño

- Recepción con mostrador de melamina, POS y banco de espera.
- Tienda frontal de unos 26 m²: estanterías laterales de alimento e higiene, isla de snacks, juguetes, correas, cama y transportadora.
- Servicios al fondo, unos 14 m²: tina con ducha y desagüe representado, mesa de grooming con brazo, máquinas y utensilios, sopladora/secador, almacén seco y módulo de limpieza y toallas.
- Mampara transparente que separa agua y productos, paso controlado y pequeño vestíbulo para reducir escapes.
- Cerámica con juntas y textura procedural, madera con veta, blanco lavable, verde menta y naranja; luminarias LED y rejilla de ventilación modeladas.
- El modo aéreo recorta las paredes laterales; al caminar o activar el techo se recupera su altura de 3 m. Las estanterías tienen bastidores abiertos para permitir inspeccionar los productos.

Las medidas se expresan en metros, con **1 unidad de Three.js = 1 m**. La ficha indica ancho × profundidad × alto, cantidad, precio y características. La maceta usa follaje artificial.

## Inversión referencial

| Propuesta | Objetivo | Estimación con contingencia | Excedente |
| --- | ---: | ---: | ---: |
| Económica | S/ 10.000 | S/ 13.613 | S/ 3.613 |
| Intermedia | S/ 15.000 | S/ 20.884 | S/ 5.884 |
| Completa | S/ 25.000 | S/ 33.044 | S/ 8.044 |

**Son supuestos de planificación, no cotizaciones comerciales verificadas en Casma.** Se muestran excedentes sin modificar partidas para encajar artificialmente en cada objetivo. Los valores están centralizados en `src/lib/shop.ts` y deben actualizarse con cotizaciones de proveedores.

El presupuesto incluye mobiliario, equipamiento, inventario inicial, 40 m² de cerámico instalado, 65 m² de pintura y sellado, mamparas, conexión sanitaria, iluminación/ventilación/protección eléctrica, letrero y 10% de contingencia redondeada al sol. Los lotes agrupan materiales y mano de obra según su descripción; no son un análisis de precios unitarios profesional. La cantidad de productos en estantes es representativa; la compra de stock se contabiliza como lote, y no se infiere del número de sacos dibujados.

No incluye alquiler, licencias, obra estructural, flete a Casma ni capital de trabajo. Se asume un local con estructura, cubierta y acometidas existentes. El modelo es un anteproyecto visual, no un expediente de ejecución. Instalaciones, ventilación efectiva, pendientes, protecciones eléctricas y requisitos municipales deben definirse con técnicos locales.

Cambios entre propuestas: densidad de productos en exhibición, tina básica revestida frente a inoxidable, mesa fija frente a soporte manual/hidráulico representado y precios de equipamiento y acabados. La distribución del recinto se conserva para comparar inversiones.

## Estructura

```text
src/app/                  App Router, metadatos, estilos Tailwind/CSS e icono local
src/components/Simulator  Estado de interfaz, propuestas, fichas, CSV y controles táctiles
src/components/ShopScene  Geometría, materiales, iluminación, selección y cámara
src/components/FloorPlan  Plano SVG seleccionable y minimapa del recorrido
src/lib/shop.ts           Catálogo, dimensiones, presupuestos y motor de colisiones
tests/shop.test.ts        Pruebas de costos, límites y recorridos
tests/browser_smoke.py    Regresión funcional en Chromium de escritorio y móvil
```

Next.js + TypeScript, React Three Fiber, Three.js, drei y Tailwind CSS. Las dependencias y sus versiones resueltas están incluidas en `package.json` y `package-lock.json`.

## Validación

```bash
npm run typecheck
npm test
npm run build
```

Las pruebas unitarias verifican conciliación del presupuesto, dimensiones del mobiliario, puertas, muros, colisiones sin atravesamiento y acceso a las áreas de trabajo. Para repetir la prueba de navegador, con la aplicación ya iniciada:

```bash
# Dependencia opcional para pruebas; no es necesaria para ejecutar la app.
python3 -m pip install playwright
python3 -m playwright install chromium

# Chromium instalado en el sistema:
BASE_URL=http://127.0.0.1:3000 CHROMIUM_PATH=/usr/bin/chromium python3 tests/browser_smoke.py
```

Para usar el Chromium descargado por Playwright, establece `CHROMIUM_PATH` a la ruta devuelta por `python3 -c "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()"`. En Windows define estas variables con la sintaxis de PowerShell o ejecuta la aplicación y las pruebas en WSL.

La prueba de navegador genera capturas y CSV en `playwright-results/`, una carpeta ignorada. Incluye selección directa en el lienzo WebGL, propuestas, plano, CSV, teclado, captura del mouse, colisiones, puertas y entradas táctiles reales mediante el protocolo de Chromium. No considera una pantalla de carga o un canvas vacío como resultado satisfactorio.

La escena limita el DPR a 1,5, utiliza geometrías sencillas, usa una única luz con sombras estáticas que se actualizan al cambiar el espacio, renderiza bajo demanda en vista aérea y no carga modelos externos. La velocidad real depende de la GPU; el entorno de pruebas usa renderizado por software y no sustituye una medición en una computadora de gama media. La compatibilidad con Edge se basa en WebGL/Chromium; Edge no se ejecutó por separado. Si WebGL falla, la interfaz ofrece el plano 2D y reintento.

## Despliegue en Vercel

1. Sube **esta carpeta como proyecto independiente** a un repositorio Git; incluye `package-lock.json` y excluye `node_modules`, `.next` y resultados de pruebas.
2. En Vercel, importa ese repositorio. Si guardas esta aplicación dentro de otro repositorio, selecciona `pet-shop-casma` como **Root Directory**.
3. Selecciona framework **Next.js**, Node.js **24.x**, instalación `npm ci` y build `npm run build`. Mantén la salida predeterminada de Next.js.
4. No se necesitan variables de entorno, almacenamiento ni funciones adicionales. Despliega y comprueba las tres vistas en la URL HTTPS asignada por Vercel.
5. Verifica que el navegador permita captura de mouse y WebGL. Si integras el proyecto en un iframe, este debe permitir `pointer-lock` y `fullscreen`; los controles táctiles y el plano funcionan sin captura de mouse.

La compilación de producción es local y reproducible con el lockfile. No se ha publicado en una cuenta de Vercel desde esta entrega.
