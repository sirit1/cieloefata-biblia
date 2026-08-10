'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpen, ChevronRight, Megaphone, Plus, Search, Settings2, Tags, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Section = 'overview' | 'contacts' | 'campaigns' | 'segments' | 'settings'
type Contact = { id:string; full_name:string; email:string|null; whatsapp:string|null; status:string; source:string; consent_whatsapp:boolean; created_at:string }

const nav: {id:Section; label:string; icon:typeof Users}[] = [
  {id:'overview', label:'Resumen', icon:BarChart3}, {id:'contacts', label:'Contactos', icon:Users},
  {id:'campaigns', label:'Campañas', icon:Megaphone}, {id:'segments', label:'Segmentos', icon:Tags}, {id:'settings', label:'Configuración', icon:Settings2},
]

export default function AdminPage() {
  const [section, setSection] = useState<Section>('overview')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { void loadContacts() }, [])
  async function loadContacts() {
    setLoading(true)
    const { data, error } = await supabase.from('crm_contacts').select('id,full_name,email,whatsapp,status,source,consent_whatsapp,created_at').order('created_at', { ascending:false }).limit(50)
    if (error) setMessage('No se pudo cargar el CRM. Verifica que tu usuario esté en la lista de administradores.')
    setContacts((data as Contact[]) || [])
    setLoading(false)
  }
  async function addContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('crm_contacts').insert({ full_name:String(form.get('full_name')), email:String(form.get('email') || '') || null, whatsapp:String(form.get('whatsapp') || '') || null, consent_whatsapp:form.get('consent_whatsapp') === 'on' })
    setMessage(error ? 'No se pudo crear el contacto.' : 'Contacto creado correctamente.'); setShowNew(false); if (!error) void loadContacts()
  }
  const filtered = contacts.filter(c => `${c.full_name} ${c.email || ''} ${c.whatsapp || ''}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="admin-shell">
    <aside className="admin-sidebar"><div className="mb-8 px-2"><p className="text-xs uppercase tracking-[.25em] text-[#c89b3c]">Revelatio</p><h1 className="mt-1 text-xl font-semibold">Centro de mando</h1><p className="mt-1 text-xs text-white/55">by Efata · CRM privado</p></div><nav aria-label="Administración">{nav.map(item => { const Icon=item.icon; return <button key={item.id} className="admin-nav" data-active={section===item.id} onClick={() => setSection(item.id)}><Icon size={17}/><span>{item.label}</span></button> })}</nav><div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60"><BookOpen size={16} className="mb-2 text-[#c89b3c]"/><p>WhatsApp en modo sandbox</p><p className="mt-1">Los mensajes reales no se envían.</p></div></aside>
    <main className="admin-main"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e3d8c2] bg-[#fefbf4] px-5 py-5 md:px-8"><div><p className="text-sm text-[#756a58]">Administración / {nav.find(n=>n.id===section)?.label}</p><h2 className="mt-1 text-2xl font-semibold">{section === 'overview' ? 'El pulso de la comunidad' : nav.find(n=>n.id===section)?.label}</h2></div><button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#1c2e4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#29466c]"><Plus size={17}/> Nuevo contacto</button></header>
      <div className="space-y-6 p-5 md:p-8">{message && <div role="status" className="rounded-xl border border-[#c89b3c]/40 bg-[#c89b3c]/10 px-4 py-3 text-sm">{message}</div>}
      {section==='overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Contactos',contacts.length,'Base total'],['Consentimiento WhatsApp',contacts.filter(c=>c.consent_whatsapp).length,'Opt-in confirmado'],['Campañas activas','0','En sandbox'],['Entregabilidad','100%','Simulada']].map(([label,value,sub])=><div className="admin-card p-5" key={String(label)}><p className="text-sm text-[#756a58]">{label}</p><p className="mt-3 text-3xl font-semibold text-[#1c2e4a]">{value}</p><p className="mt-1 text-xs text-[#756a58]">{sub}</p></div>)}</div><div className="admin-card p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Actividad reciente</h3><p className="mt-1 text-sm text-[#756a58]">Control operativo de tu audiencia.</p></div><ChevronRight size={18} className="text-[#756a58]"/></div><div className="mt-6 h-32 rounded-xl bg-[#1c2e4a]/5 p-4"><div className="flex h-full items-end gap-2">{[35,48,30,64,55,78,66,88,72,94,80,100].map((height,i)=><div key={i} className="flex-1 rounded-t bg-[#c89b3c]" style={{height:`${height}%`}}/>)}</div></div></div></>}
      {section==='contacts' && <div className="admin-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3d8c2] p-4"><div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-3 text-[#756a58]"/><input aria-label="Buscar contactos" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre, email o WhatsApp" className="w-full rounded-xl border border-[#e3d8c2] bg-[#f5efe3] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c89b3c]"/></div><span className="text-sm text-[#756a58]">{filtered.length} contactos</span></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#1c2e4a] text-xs uppercase tracking-wide text-white/75"><tr><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3">Alta</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-8 text-center text-[#756a58]">Cargando contactos…</td></tr> : filtered.map(c=><tr key={c.id} className="border-b border-[#e3d8c2] last:border-0"><td className="px-4 py-4"><p className="font-medium">{c.full_name}</p><p className="text-xs text-[#756a58]">{c.email || 'Sin email'}</p></td><td className="px-4 py-4">{c.whatsapp || 'Sin WhatsApp'}{c.consent_whatsapp && <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-[10px] text-green-800">OPT-IN</span>}</td><td className="px-4 py-4 capitalize">{c.status}</td><td className="px-4 py-4 capitalize">{c.source}</td><td className="px-4 py-4 text-[#756a58]">{new Date(c.created_at).toLocaleDateString('es-ES')}</td></tr>)}</tbody></table></div></div>}
      {section==='campaigns' && <div className="admin-card p-6"><Megaphone className="text-[#c89b3c]"/><h3 className="mt-3 text-lg font-semibold">Campañas WhatsApp</h3><p className="mt-2 max-w-xl text-sm text-[#756a58]">Crea campañas, selecciona un segmento y revisa una simulación completa antes de conectar Twilio.</p><button className="mt-5 rounded-xl border border-[#1c2e4a] px-4 py-2 text-sm font-semibold text-[#1c2e4a]">Crear campaña sandbox</button></div>}
      {section==='segments' && <div className="admin-card p-6"><Tags className="text-[#c89b3c]"/><h3 className="mt-3 text-lg font-semibold">Segmentos inteligentes</h3><p className="mt-2 text-sm text-[#756a58]">Agrupa por consentimiento, origen, actividad y etiquetas para preparar comunicaciones relevantes.</p></div>}
      {section==='settings' && <div className="admin-card p-6"><Settings2 className="text-[#c89b3c]"/><h3 className="mt-3 text-lg font-semibold">Configuración segura</h3><p className="mt-2 text-sm text-[#756a58]">Twilio está desactivado. El sandbox no realiza envíos externos ni guarda secretos en el navegador.</p></div>}
      </div></main>
    {showNew && <div className="fixed inset-0 z-50 grid place-items-center bg-[#1c2e4a]/60 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-[#fefbf4] p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Nuevo contacto</h3><button aria-label="Cerrar" onClick={()=>setShowNew(false)}><X size={20}/></button></div><form onSubmit={addContact} className="mt-5 space-y-4"><label className="block text-sm font-medium">Nombre<input required name="full_name" className="mt-1 w-full rounded-xl border border-[#e3d8c2] bg-[#f5efe3] p-3"/></label><label className="block text-sm font-medium">Email<input name="email" type="email" className="mt-1 w-full rounded-xl border border-[#e3d8c2] bg-[#f5efe3] p-3"/></label><label className="block text-sm font-medium">WhatsApp<input name="whatsapp" placeholder="+34…" className="mt-1 w-full rounded-xl border border-[#e3d8c2] bg-[#f5efe3] p-3"/></label><label className="flex items-center gap-2 text-sm"><input name="consent_whatsapp" type="checkbox"/> Tiene consentimiento para WhatsApp</label><button className="w-full rounded-xl bg-[#1c2e4a] py-3 font-semibold text-white">Guardar contacto</button></form></div></div>}
  </div>
}
