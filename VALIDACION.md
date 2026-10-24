# Validación de Brío Pet, versión 3

Fecha: 24 de octubre de 2026.

- `npm run typecheck`: correcto.
- `npm test`: 9 pruebas aprobadas, ninguna fallida u omitida. Se verificaron 10 tamaños de local y 3 prioridades: límites, mobiliario sin superposiciones, distribución compacta, módulos, presupuesto, puertas y rutas de acceso a exhibidores, baño y grooming.
- `npm run build`: compilación de producción de Next.js correcta.
- `npm run build:standalone`: HTML autónomo generado con recursos incluidos.
- `tests/browser_smoke.py`: correcto sobre el HTML autónomo servido por HTTP, en Chromium 154, escritorio de 1440 × 1000 y dispositivo táctil emulado de 390 × 844.

La regresión de navegador verificó cambios de medidas, un local compacto de 21 m², un local grande de 96 m², regeneración del mobiliario y plano, recálculo del presupuesto, exportación CSV, persistencia de la configuración, las tres opciones de acceso, independencia del cierre metálico y la puerta del cuarto, captura y liberación del mouse, desplazamiento con colisiones, puertas y controles táctiles.

Resultado: ningún error JavaScript de página y ninguna solicitud de recursos externos durante la prueba. El renderizado se activa bajo demanda; teclado y entradas táctiles inician el movimiento y se detienen al soltarlos.

Las capturas de validación están en la carpeta ignorada `playwright-results`. No forman parte del funcionamiento de la aplicación.

## Alcance

La escena usa geometría 3D, materiales PBR, sombras de contacto, texturas e iluminación de entorno para reflejos. La configuración inicial es 7 × 10 m (70 m²). Recepción y espera están al fondo; el cuarto de servicios tiene muros de altura completa y puerta opaca al recorrer. En la vista aérea los muros se cortan expresamente. La barra y los estantes muestran seis familias de premios, además de sacos, conservas y sobres. Se revisaron visualmente las capturas del recorrido y del exhibidor para comprobar que los carteles principales son legibles. Es un diseño preliminar interactivo, sin afirmar fotorealismo ni equivalencia con un proyecto técnico. Los presupuestos se calculan a partir de cantidades y precios de referencia, con 10% de contingencia; no son cotizaciones locales verificadas.

La prueba móvil utiliza emulación de Chromium, no un teléfono físico. Edge no se ejecutó por separado. No se afirma una tasa de cuadros en hardware del usuario. El navegador administrado bloquea `file://`; el HTML se verificó por HTTP.

## Publicación

La aplicación se publica desde `gh-pages` en https://psioluz.github.io/pet-shop-casma-pruebas/ . El HTML publicado es el mismo archivo autónomo validado localmente. El estado de publicación se comprueba mediante GitHub Actions y la API de GitHub Pages; el acceso HTTP a github.io desde este entorno está restringido por el proxy.
