import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RevelatiO by Efata · Una mente renovada comienza aquí',
  description: 'Biblia, estudio profundo y acompañamiento para renovar la mente por medio de la Palabra de Dios.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className="bg-[#f5efe3]"><body>{children}</body></html>
}
