import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Brío Pet — Diseñador 3D de locales · Casma',
  description: 'Diseña tu pet shop con el ancho, fondo y altura de tu local. Distribución adaptable, recorrido 3D y presupuesto en soles para Casma, Perú.',
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
