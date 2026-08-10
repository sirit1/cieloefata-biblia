import Link from 'next/link'

export default function Home() {
  return <main className="grid min-h-screen place-items-center p-6"><section className="admin-card w-full max-w-xl p-8 text-center"><p className="text-xs uppercase tracking-[.25em] text-[#9a6b12]">Revelatio by Efata</p><h1 className="mt-3 text-4xl font-semibold text-[#1c2e4a]">Plataforma bíblica viva</h1><p className="mx-auto mt-4 max-w-md text-[#756a58]">La nueva arquitectura está preparada. Accede al centro de administración para gestionar tu comunidad.</p><Link href="/admin" className="mt-6 inline-flex rounded-xl bg-[#1c2e4a] px-5 py-3 font-semibold text-white">Abrir administración</Link></section></main>
}
