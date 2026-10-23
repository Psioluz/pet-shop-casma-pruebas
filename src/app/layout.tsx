import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Miga — Pet Shop & Grooming · Casma',
  description: 'Explora un pet shop de 40 m² en 3D. Recorre su distribución, inspecciona mobiliario y compara inversiones en soles para Casma, Perú.',
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
