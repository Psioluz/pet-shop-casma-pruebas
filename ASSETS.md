# Recursos visuales incluidos

- Iluminación HDR `studio_small_03_1k.hdr`: preset de drei-assets, recurso de Poly Haven (CC0). Fuente: https://raw.githubusercontent.com/pmndrs/drei-assets/master/hdri/studio_small_03_1k.hdr ; https://polyhaven.com/a/studio_small_03 . Se utiliza únicamente para iluminación y reflejos PBR, sin mostrar la imagen como fondo ni sustituir la geometría 3D.
- Textura de madera `hardwood2_diffuse.jpg`: recursos de ejemplos de Three.js, fuente https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg . Three.js se distribuye bajo licencia MIT: https://github.com/mrdoob/three.js/blob/dev/LICENSE . Se toma una sección de la tabla para el material del mobiliario.
- Cerámica, tela, empaques, rótulos y geometrías: generados por la aplicación. También se generan las ilustraciones decorativas de perro y gato, las prendas, perchas, accesorios, juguetes, plantas y lámparas; no requieren descargas de modelos ni imágenes externas.

Los recursos de madera e iluminación están incluidos en `src/lib/visual-assets.ts` para que la versión publicada y el HTML autónomo no dependan de peticiones externas.
