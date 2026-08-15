'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Bell, ChevronRight, FileUp, Filter, LayoutDashboard, Mail, Megaphone, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings2, Tags, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'leads' | 'campaigns' | 'automation'
type Lead = { id: string; full_name: string; email: string | null; whatsapp: string | null; status: string; source: string; consent_whatsapp: boolean; created_at: string }

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'campaigns', label: 'Campañas', icon: Megaphone },
  { id: 'automation', label: 'Automatizaciones', icon: Settings2 },
]

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<Tab>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showComposer, setShowComposer] = useState(false)
  const [campaignBody, setCampaignBody] = useState('Hola {nombre}, descubre RevelatiO by Efata: estudio bíblico gratuito para crecer en la Palabra. Responde ALTA si quieres recibir información.')
  const [campaignSid, setCampaignSid] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<'signed-out' | 'unauthorized' | 'authorized'>('signed-out')
  const [authError, setAuthError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    async function verifyAdmin() {
      setLoading(true)
      setAuthError('')
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error('La verificación de sesión tardó demasiado.')), 8000)
          }),
        ])
        const { data: { session } } = sessionResult
        const user = session?.user ?? null
        if (cancelled) return
        if (!user) {
          setAuthState('signed-out')
          return
        }
        const { data: admin, error } = await supabase.from('admin_allowlist').select('email').eq('email', user.email || '').maybeSingle()
        if (error) throw error
        if (cancelled) return
        if (!admin) {
          setAuthState('unauthorized')
          return
        }
        setAuthState('authorized')
        void loadLeads()
      } catch (error) {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : 'No se pudo verificar la sesión.')
        }
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        if (!cancelled) setLoading(false)
      }
    }

    void verifyAdmin()
    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [supabase, retryCount])

  async function loadLeads() {
    const { data, error } = await supabase.from('crm_contacts').select('id,full_name,email,whatsapp,status,source,consent_whatsapp,created_at').order('created_at', { ascending: false }).limit(100)
    if (error) setNotice('No se pudo cargar el CRM. Comprueba que tu usuario sea administrador.')
    setLeads((data as Lead[]) || [])
  }
  async function sendWhatsApp() {
    if (!selected?.whatsapp || !selected.consent_whatsapp) {
      setNotice('Este lead necesita un WhatsApp válido y consentimiento confirmado.')
      return
    }
    setSending(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Tu sesión venció. Inicia sesión de nuevo.')
      const response = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: selected.whatsapp, body: `Hola ${selected.full_name}, somos RevelatiO by Cielo-Efata. ¿En qué podemos ayudarte?`, consent: selected.consent_whatsapp }),
      })
      const result = await response.json()
      setNotice(response.ok ? `Mensaje enviado correctamente (${result.status || 'enviado'}).` : result.error || 'No se pudo enviar el mensaje.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }
  async function sendCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const recipients = leads.filter((lead) => selectedIds.includes(lead.id) && lead.whatsapp && lead.consent_whatsapp)
    if (!recipients.length) { setNotice('Selecciona leads externos con WhatsApp válido y consentimiento confirmado.'); return }
    if (!campaignSid.trim()) { setNotice('Para leads externos necesitas un Content SID de Twilio aprobado.'); return }
    setSending(true)
    try {
      const { data } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/whatsapp/campaign', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` }, body: JSON.stringify({ contentSid: campaignSid.trim(), body: campaignBody, recipients: recipients.map((lead) => ({ id: lead.id, name: lead.full_name, whatsapp: lead.whatsapp })) }) })
      const result = await response.json()
      setNotice(response.ok ? `Campaña procesada: ${result.sent || 0} enviados, ${result.failed || 0} fallidos.` : result.error || 'No se pudo enviar la campaña.')
      if (response.ok) { setShowComposer(false); setSelectedIds([]) }
    } catch { setNotice('No se pudo conectar con el servicio de campañas.') } finally { setSending(false) }
  }
  async function addLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('crm_contacts').insert({ full_name: String(form.get('full_name')), email: String(form.get('email') || '') || null, whatsapp: String(form.get('whatsapp') || '') || null, consent_whatsapp: form.get('consent_whatsapp') === 'on' })
    setNotice(error ? 'No se pudo crear el lead.' : 'Lead creado correctamente.'); if (!error) { setShowComposer(false); void loadLeads() }
  }
  function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setNotice(`Archivo ${file.name} preparado. La importación requiere confirmar el mapeo de columnas.`); reader.readAsText(file)
  }
  const filtered = leads.filter(lead => (status === 'all' || lead.status === status) && `${lead.full_name} ${lead.email || ''} ${lead.whatsapp || ''}`.toLowerCase().includes(query.toLowerCase()))
  const optedIn = leads.filter(lead => lead.consent_whatsapp).length

  if (loading || authError || authState !== 'authorized') {
    const message = loading
      ? 'Verificando sesión…'
      : authError
        ? authError
        : authState === 'signed-out'
          ? 'Inicia sesión para acceder al panel'
          : 'No tienes permisos de administración'
    return <main className="admin-shell" aria-live="polite"><section className="admin-main" style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '2rem' }}><div className="empty-panel"><h1>{message}</h1>{authError && <button className="button-primary" type="button" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button>}</div></section></main>
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="brand-lockup"><div className="brand-mark">R</div><div><p className="brand-name">Revelatio</p><p className="brand-sub">Centro de mando</p></div></div>
      <nav aria-label="Administración" className="sidebar-nav"><button className="admin-nav" data-active="true"><LayoutDashboard size={17} /><span>Vista general</span></button><button className="admin-nav" data-active={tab === 'leads'} onClick={() => setTab('leads')}><Users size={17} /><span>Audiencia</span></button><button className="admin-nav" data-active={tab === 'campaigns'} onClick={() => setTab('campaigns')}><Megaphone size={17} /><span>Campañas</span></button><button className="admin-nav" data-active={tab === 'automation'} onClick={() => setTab('automation')}><BarChart3 size={17} /><span>Automatizaciones</span></button></nav>
      <div className="sidebar-bottom"><div className="sandbox-badge"><span className="status-dot" /> WhatsApp sandbox</div><button className="admin-nav"><Settings2 size={17} /><span>Configuración</span></button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><p className="eyebrow">Revelatio / Administración</p><h1>Tu audiencia, con propósito.</h1><p className="topbar-copy">Gestiona relaciones, conversaciones y próximos pasos desde un solo lugar.</p></div><div className="topbar-actions"><button className="icon-button" aria-label="Notificaciones"><Bell size={18} /></button><button className="profile-chip"><span className="avatar">AS</span><span className="hidden sm:inline">Alejandro Sirit</span></button></div></header>
      <div className="admin-content">
        {notice && <div className="notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={15} /></button></div>}
        <section className="metric-grid"><div className="metric-card metric-featured"><div className="metric-icon"><Users size={18} /></div><p>Leads totales</p><strong>{leads.length}</strong><span>+12% este mes</span></div><div className="metric-card"><div className="metric-icon soft"><MessageCircle size={18} /></div><p>Opt-in WhatsApp</p><strong>{optedIn}</strong><span>Consentimiento confirmado</span></div><div className="metric-card"><div className="metric-icon soft"><Send size={18} /></div><p>Conversaciones</p><strong>24</strong><span>En seguimiento</span></div><div className="metric-card"><div className="metric-icon soft"><BarChart3 size={18} /></div><p>Conversión</p><strong>18.4%</strong><span>+4.2% vs. anterior</span></div></section>
        <div className="section-tabs" role="tablist">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'tab active' : 'tab'} onClick={() => setTab(item.id)}><Icon size={16} />{item.label}</button> })}</div>
        {tab === 'leads' && <section className="workspace"><div className="workspace-header"><div><h2>Leads recientes</h2><p>Las personas que están dando el siguiente paso.</p></div><div className="workspace-actions"><input ref={inputRef} type="file" accept=".csv,.xlsx" className="sr-only" onChange={importCsv} /><button className="button-secondary" onClick={() => inputRef.current?.click()}><FileUp size={16} /> Importar</button><button className="button-secondary" disabled={!selectedIds.length} onClick={() => setShowComposer(true)}><Megaphone size={16} /> Campaña ({selectedIds.length})</button><button className="button-primary" onClick={() => setShowComposer(true)}><Plus size={16} /> Nuevo lead</button></div></div><div className="filters"><div className="search-field"><Search size={16} /><input aria-label="Buscar leads" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, email o teléfono" /></div><select aria-label="Filtrar estado" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="new">Nuevos</option></select><button className="filter-button"><Filter size={15} /> Filtros</button></div><div className="table-wrap"><table><thead><tr><th>Lead</th><th>Canal preferido</th><th>Estado</th><th>Origen</th><th>Última actividad</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{filtered.map(lead => <tr key={lead.id} onClick={() => setSelected(lead)}><td><input aria-label={`Seleccionar ${lead.full_name}`} type="checkbox" checked={selectedIds.includes(lead.id)} onChange={(event) => { event.stopPropagation(); setSelectedIds((current) => event.target.checked ? [...current, lead.id] : current.filter((id) => id !== lead.id)) }} /></td><td><div className="lead-cell"><span className="lead-avatar">{lead.full_name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><strong>{lead.full_name}</strong><small>{lead.email || 'Sin email'}</small></div></div></td><td><span className="channel"><MessageCircle size={14} />{lead.whatsapp || 'Sin WhatsApp'}</span>{lead.consent_whatsapp && <span className="opt-in">OPT-IN</span>}</td><td><span className={`state state-${lead.status}`}>{lead.status === 'new' ? 'Nuevo' : 'Activo'}</span></td><td>{lead.source}</td><td>{new Date(lead.created_at).toLocaleDateString('es-ES')}</td><td><button className="row-action" aria-label={`Opciones de ${lead.full_name}`}><MoreHorizontal size={17} /></button></td></tr>)}{!filtered.length && <tr><td colSpan={6} className="empty-state">No hay leads que coincidan con la búsqueda.</td></tr>}</tbody></table></div><div className="table-footer"><span>Mostrando {filtered.length} de {leads.length} leads</span><button>Ver todos los leads <ChevronRight size={15} /></button></div></section>}
        {tab === 'campaigns' && <section className="empty-panel"><div className="panel-icon"><Megaphone size={24} /></div><h2>Campañas que acompañan</h2><p>Prepara mensajes por Email o WhatsApp, segmenta tu audiencia y revisa cada envío en sandbox antes de conectar Twilio.</p><button className="button-primary" onClick={() => setShowComposer(true)}><Plus size={16} /> Crear campaña</button></section>}
        {tab === 'automation' && <section className="automation-grid"><div className="automation-card"><div className="panel-icon"><Mail size={21} /></div><h2>Bienvenida por email</h2><p>Se activa cuando un lead completa el registro.</p><span className="state state-active">Borrador</span></div><div className="automation-card"><div className="panel-icon"><MessageCircle size={21} /></div><h2>Seguimiento WhatsApp</h2><p>Listo para probar con el proveedor sandbox.</p><span className="sandbox-badge"><span className="status-dot" /> Sandbox</span></div></section>}
      </div>
    </main>
    {selected && <aside className="detail-drawer" aria-label="Detalle del lead"><button className="drawer-close" aria-label="Cerrar detalle" onClick={() => setSelected(null)}><X size={18} /></button><span className="drawer-kicker">Detalle del lead</span><div className="drawer-avatar">{selected.full_name.split(' ').map(part => part[0]).slice(0, 2).join('')}</div><h2>{selected.full_name}</h2><p className="drawer-muted">{selected.email || 'Sin email registrado'}</p><div className="drawer-list"><div><span>WhatsApp</span><strong>{selected.whatsapp || 'No registrado'}</strong></div><div><span>Origen</span><strong>{selected.source}</strong></div><div><span>Consentimiento</span><strong>{selected.consent_whatsapp ? 'Confirmado' : 'Pendiente'}</strong></div></div><button className="button-primary full" onClick={() => void sendWhatsApp()} disabled={sending}><MessageCircle size={16} /> {sending ? 'Enviando…' : 'Enviar WhatsApp'}</button></aside>}
    {showComposer && <div className="modal-backdrop"><div className="composer-modal" role="dialog" aria-modal="true"><div className="modal-header"><div><span className="drawer-kicker">Nueva acción</span><h2>Crear comunicación</h2></div><button aria-label="Cerrar" onClick={() => setShowComposer(false)}><X size={18} /></button></div><div className="channel-toggle"><button className="selected"><Mail size={15} /> Email</button><button><MessageCircle size={15} /> WhatsApp</button></div>{selectedIds.length ? <form onSubmit={sendCampaign} className="composer-form"><p className="drawer-muted">{selectedIds.length} destinatarios seleccionados. Solo se enviará a contactos externos con consentimiento WhatsApp.</p><label>Content SID de Twilio aprobado<input value={campaignSid} onChange={(event) => setCampaignSid(event.target.value)} required placeholder="HX..." /></label><label>Mensaje de referencia<textarea value={campaignBody} onChange={(event) => setCampaignBody(event.target.value)} rows={4} /></label><p className="drawer-muted">Sin plantilla aprobada, Twilio bloqueará los mensajes a leads que nunca iniciaron conversación.</p><button className="button-primary full" type="submit" disabled={sending}><Send size={16} /> {sending ? 'Enviando…' : 'Enviar campaña'}</button></form> : <form onSubmit={addLead} className="composer-form"><label>Nombre del lead<input name="full_name" required placeholder="Nombre completo" /></label><label>Email<input name="email" type="email" placeholder="nombre@correo.com" /></label><label>WhatsApp<input name="whatsapp" placeholder="+34 600 000 000" /></label><label className="consent-check"><input name="consent_whatsapp" type="checkbox" /> Cuenta con consentimiento para WhatsApp</label><button className="button-primary full" type="submit"><Send size={16} /> Guardar en sandbox</button></form>}</div></div>}
  </div>
}
