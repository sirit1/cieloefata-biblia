import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Revelatio · Administración',
  description: 'Panel de administración de Revelatio by Efata.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className="bg-[#f5efe3]"><body>{children}</body></html>
}
