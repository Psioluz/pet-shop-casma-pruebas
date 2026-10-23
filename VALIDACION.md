# Validación de la entrega

Fecha: 23 de octubre de 2026.

- `npm run build`: correcto; aplicación generada en producción con Next.js 16.4.3.
- `npm run typecheck`: correcto.
- `npm test`: 6 pruebas ejecutadas, 6 aprobadas, 0 fallidas y 0 omitidas.
- `tests/browser_smoke.py` contra el servidor de producción: correcto en Chromium 154, con escritorio de 1440 × 1000 y dispositivo táctil emulado de 390 × 844.

La prueba de navegador verificó selección directa del mostrador sobre WebGL, selección de tina en el plano, cambios entre las tres propuestas, exportación CSV, captura y liberación del mouse, movimiento con teclado, detención ante mobiliario y puertas, entrada al área de cuidado tras abrir su acceso, enclavamiento del vestíbulo, reinicio a la entrada, ayuda y movimiento mediante entradas táctiles reales del protocolo de Chromium.

Resultado final: **ningún error JavaScript de página y ninguna solicitud de recursos externos** durante la prueba. Las capturas generadas son evidencia interna de verificación y no forman parte del funcionamiento de la aplicación.

Presupuestos conciliados con las partidas y 10% de contingencia:

| Propuesta | Total referencial | Objetivo | Excedente |
| --- | ---: | ---: | ---: |
| Económica | S/ 13.613 | S/ 10.000 | S/ 3.613 |
| Intermedia | S/ 20.884 | S/ 15.000 | S/ 5.884 |
| Completa | S/ 33.044 | S/ 25.000 | S/ 8.044 |

Los precios son supuestos para planificación, sin cotización local comprobada. El documento README explica alcance y exclusiones.

Se verificó el build y su ejecución local en producción. **No se realizó una publicación en Vercel** ni se ejecutó Edge por separado. La prueba móvil usa emulación de Chromium, no un teléfono físico. El renderizado del entorno de pruebas es por software; no se afirma una tasa de cuadros medida en hardware de gama media.
