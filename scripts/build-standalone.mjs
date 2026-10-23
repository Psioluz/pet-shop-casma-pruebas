import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=await build({
  absWorkingDir:root,
  entryPoints:['scripts/standalone-entry.tsx'],
  bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:'es2020',
  jsx:'automatic',tsconfig:'tsconfig.json',
  alias:{'next/dynamic':path.join(root,'scripts/browser-dynamic.tsx')},
  define:{'process.env.NODE_ENV':'"production"'},legalComments:'none',
});
// All interface rules are local CSS. Avoid external style imports in the offline file.
const css=(await readFile(path.join(root,'src/app/globals.css'),'utf8')).replace(/^@import\s+"tailwindcss";\s*/,'');
const icon=await readFile(path.join(root,'src/app/icon.svg'),'utf8');
const script=result.outputFiles[0].text.replaceAll('</script','<\\/script');
const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f7f0"><title>Miga · Pet Shop 3D · Casma</title><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}"><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`;
await mkdir(path.join(root,'docs'),{recursive:true});
await writeFile(path.join(root,'docs/index.html'),html);
await writeFile(path.join(root,'docs/.nojekyll'),'');
console.log(`Modelo 3D autónomo generado: docs/index.html (${Math.round(Buffer.byteLength(html)/1024)} KiB). Sin recursos externos.`);
