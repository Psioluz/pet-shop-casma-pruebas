# Brío Pet · Diseñador 3D de locales

**Brío Pet** es el nombre elegido para la tienda de Luis y Briggite. «Brío» expresa vigor, determinación y vitalidad; la marca interpreta la fortaleza y el carácter decidido de ambos, sin unir fragmentos de sus nombres. La identidad aparece en la web, el mostrador, los empaques y los letreros.

Simulador arquitectónico interactivo de un pet shop con baño y grooming en Casma, Perú. La versión 2 permite definir el local antes de generar la distribución: **frente, fondo, altura, prioridad comercial y acabado**. El modelo se construye con geometría tridimensional real y se puede recorrer.

## Probar la demo

La versión publicada se sirve desde la rama `gh-pages` en GitHub Pages:

https://psioluz.github.io/pet-shop-casma-pruebas/

1. Introduce **Frente**, **Fondo** y **Altura** en el panel del proyecto. En celular abre **Medidas del local**.
2. Elige si prefieres una distribución equilibrada, más tienda o más área de cuidado; selecciona roble o nogal.
3. Pulsa **Diseñar con estas medidas**. Se regeneran el recinto, muebles, plano, colisiones y presupuesto.
4. Usa **Recorrer**, **Vista aérea** o **Plano 2D** para explorar. Selecciona mobiliario para ver medidas y costos.

El navegador conserva la última configuración válida en almacenamiento local. No se envían medidas ni datos personales a un servidor.

## Qué cambia con las medidas

- Rango de frente: **3,20–12 m**; fondo: **5,50–20 m**; altura: **2,50–4,50 m**. El formulario rechaza valores fuera de rango.
- En locales compactos desaparece la isla central y se usan mostrador, banco, tina y mesa compactos. Las medidas del equipamiento mantienen proporciones prácticas.
- Al aumentar el fondo se añaden módulos de estantería; en frentes de al menos 7,20 m se colocan dos islas, si hay profundidad suficiente.
- La prioridad elegida modifica la separación entre comercio y servicios. El acceso a baño y grooming queda controlado por una mampara con puerta.
- Se recalculan las áreas de suelo, pintura, mamparas, mobiliario, stock de referencia e instalación eléctrica. No se escala todo el mobiliario junto con el edificio.
- El motor verifica pasillos mediante colisiones con paredes, puertas y muebles. La distribución es preliminar y presupone una planta rectangular sin columnas u otros obstáculos existentes.

El modelo incluye recepción y POS, espera, alimentos y snacks, higiene, juguetes, correas y arneses, cama y transportadora cuando hay espacio, tina con ducha, mesa de grooming, sopladora/secador, utensilios, almacén y módulo de limpieza y toallas.

## Materiales y visualización

Vista inicial a altura humana, luminarias de techo, sombras interiores, piedra/cerámica con relieve, texturas de madera, empaques con identidad propia, superficies curvas en mobiliario y productos, y materiales PBR para acero y vidrio. Una iluminación HDR incluida se utiliza para reflejos e iluminación; **no se muestra como panorama ni reemplaza la geometría del recinto**. Los recursos están documentados en `ASSETS.md`.

Es una visualización interactiva para explorar y planificar. No se ofrece como fotografía, render de trazado de rayos ni expediente técnico de ejecución. La velocidad depende de la GPU y del tamaño del local.

## Controles

| Acción | Control |
| --- | --- |
| Caminar | W/A/S/D o flechas; cámara a 1,65 m y colisiones |
| Mirar | Clic en el modelo para capturar el mouse; Esc libera el cursor |
| Celular | Deslizar para mirar; mantener pulsadas las flechas para caminar |
| Vista aérea | Arrastrar para girar, rueda o pellizco para zoom |
| Inspección | Seleccionar muebles en 3D, plano o lista; la vista aérea los enfoca |
| Techo | Mostrar u ocultar; las paredes recuperan su altura completa al recorrer |
| Entrada | Botón para volver al punto de inicio del local actual |
| Puertas | Controles durante el recorrido; el vestíbulo impide abrir ambas puertas a la vez |
| Presupuesto | Tres niveles de equipamiento y exportación CSV en soles |

## Presupuesto

Las propuestas mantienen objetivos de **S/ 10.000, S/ 15.000 y S/ 25.000**. El costo real estimado depende de las medidas y la distribución; se muestra cualquier excedente, sin ajustar partidas para aparentar que se alcanza el objetivo. Incluye 10% de contingencia.

Los valores son **supuestos de planificación sin cotizaciones locales verificadas**. El stock se estima según longitud de exhibición, no a partir del número de productos dibujados. Acabados e instalaciones se presupuestan con cantidades y factores de referencia; no son análisis de precios unitarios profesionales.

Se asume un local con estructura, cubierta y acometidas existentes. No incluye alquiler, licencias, obra estructural, flete a Casma ni capital de trabajo. Validar en el inmueble los obstáculos, evacuación, instalaciones, ventilación, pendientes y requerimientos municipales.

## Ejecutar y desarrollar

Node.js **24 LTS** recomendado, npm y un navegador con WebGL 2. Chrome y Edge actuales son los navegadores objetivo.

```bash
npm ci
npm run dev
```

Para producción:

```bash
npm run build
npm start
```

No se necesitan claves, base de datos ni variables de entorno. Modelos, texturas y recursos de iluminación se incluyen en el proyecto; la demo no solicita recursos externos durante su uso.

## HTML autónomo y descarga

```bash
npm run build:standalone
```

Genera `docs/index.html` con la misma aplicación y todas sus dependencias incluidas. Ese archivo puede servirse con cualquier servidor estático. `modelo-3d-listo.zip` contiene el HTML autónomo y las instrucciones. La aplicación Next.js y el HTML comparten componentes y datos; solo se sustituye el cargador de componentes para el empaquetado del navegador.

## Componentes

```text
src/components/DesignerForm.tsx   Medidas, prioridades, acabados y validación
src/lib/shop.ts                   Catálogo, generador paramétrico, presupuesto y colisiones
src/components/Simulator.tsx      Interfaz, estado, persistencia, fichas y CSV
src/components/ShopScene.tsx      Arquitectura 3D adaptable, equipos, luces y controles
src/components/surfaces.ts        Materiales y texturas
src/lib/visual-assets.ts          Recursos de madera e iluminación incluidos
src/components/FloorPlan.tsx      Plano a escala y minimapa según medidas
scripts/build-standalone.mjs      Empaquetado del HTML autónomo
tests/                           Pruebas del generador y de navegador
```

## Validación

```bash
npm run typecheck
npm test
npm run build
npm run build:standalone
```

Las pruebas de lógica cubren 7 tamaños y 3 prioridades, superposiciones, límites, módulos, equipamiento, áreas, presupuestos, puertas y acceso a las zonas mediante búsqueda de pasillos.

La regresión de navegador requiere Python Playwright y Chromium instalados, además de servir la aplicación o el HTML:

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
BASE_URL=http://127.0.0.1:3000 CHROMIUM_PATH=/usr/bin/chromium python3 tests/browser_smoke.py
```

Adapta `CHROMIUM_PATH` a tu instalación. El runner verifica cambios de dimensiones, distribuciones compacta y grande, presupuesto, CSV, navegación, puertas, controles táctiles y persistencia. Sus resultados y capturas van a la carpeta ignorada `playwright-results`.

## Publicar

### GitHub Pages

La rama `gh-pages` debe contener `index.html` y `.nojekyll`. En Settings → Pages se selecciona `gh-pages / (root)`. Tras actualizar `docs/index.html`, subir su contenido a esa rama y verificar que la ejecución de publicación termine correctamente.

### Vercel

Importar el repositorio como proyecto Next.js, Node.js 24.x, instalación `npm ci` y compilación `npm run build`. Mantener la salida predeterminada. No se necesitan variables de entorno. Si está en un monorepo, elegir la carpeta de esta aplicación como Root Directory.
