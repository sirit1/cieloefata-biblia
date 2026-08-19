'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Expand, MoreHorizontal, Sparkles, Type, Volume2, X } from 'lucide-react'

type SelectionToolbarProps = { children: React.ReactNode }

type SelectionState = { text: string; rect: DOMRect; color: string }

const colors = [
  { name: 'Oro', value: 'oro', className: 'selection-color-oro' },
  { name: 'Salvia', value: 'salvia', className: 'selection-color-salvia' },
  { name: 'Cielo', value: 'cielo', className: 'selection-color-cielo' },
  { name: 'Terracota', value: 'terracota', className: 'selection-color-terracota' },
]

export function SelectionToolbar({ children }: SelectionToolbarProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [status, setStatus] = useState('')

  const updateSelection = useCallback(() => {
    const current = window.getSelection()
    if (!current || current.isCollapsed || !current.toString().trim()) {
      setSelection(null)
      setExpanded(false)
      setMoreOpen(false)
      return
    }
    const node = current.anchorNode?.parentElement
    if (!node || node.closest('[data-selection-toolbar]') || node.closest('input, textarea, button, a')) return
    const rect = current.getRangeAt(0).getBoundingClientRect()
    if (!rect.width && !rect.height) return
    setSelection((previous) => ({ text: current.toString().trim(), rect, color: previous?.color || 'oro' }))
    setCopied(false)
    setStatus('')
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', updateSelection)
    window.addEventListener('resize', updateSelection)
    window.addEventListener('scroll', updateSelection, true)
    return () => {
      document.removeEventListener('selectionchange', updateSelection)
      window.removeEventListener('resize', updateSelection)
      window.removeEventListener('scroll', updateSelection, true)
    }
  }, [updateSelection])

  const position = useMemo(() => {
    if (!selection) return null
    const width = Math.min(490, window.innerWidth - 24)
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, selection.rect.right - width + 8))
    const top = selection.rect.bottom + 16 > window.innerHeight - 90 ? Math.max(12, selection.rect.top - 64) : selection.rect.bottom + 16
    return { left, top, width }
  }, [selection])

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges()
    setSelection(null)
    setExpanded(false)
    setMoreOpen(false)
  }

  const copy = async () => {
    if (!selection) return
    await navigator.clipboard?.writeText(selection.text)
    setCopied(true)
    setStatus('Copiado')
    window.setTimeout(() => setCopied(false), 1500)
  }

  const changeColor = (color: string) => {
    setSelection((current) => current ? { ...current, color } : current)
    setStatus(`Marcador ${colors.find((item) => item.value === color)?.name.toLowerCase()}`)
  }

  const extend = () => {
    setExpanded(true)
    setMoreOpen(false)
    setStatus('Contexto ampliado')
  }

  const speak = () => {
    if (!selection) return
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(selection.text))
    setStatus('Lectura iniciada')
  }

  return <>
    <div className="selection-toolbar-content">{children}</div>
    {selection && position && <>
      <span className="selection-handle selection-handle-start" style={{ left: selection.rect.left, top: selection.rect.top - 2 }} aria-hidden="true" />
      <span className="selection-handle selection-handle-end" style={{ left: selection.rect.right - 10, top: selection.rect.bottom - 2 }} aria-hidden="true" />
      <aside className="floating-selection-toolbar" data-selection-toolbar style={{ left: position.left, top: position.top, width: position.width }} role="toolbar" aria-label="Herramientas para el texto seleccionado">
        <button type="button" onClick={copy} aria-label="Copiar selección"><span>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}</span><b>{copied ? 'Copied' : 'Copy'}</b></button>
        <button type="button" onClick={extend} aria-label="Ampliar contexto"><Expand data-icon="inline-start" /><b>Extend</b></button>
        <button type="button" onClick={() => setExpanded(true)} aria-label="Ver texto seleccionado"><Type data-icon="inline-start" /><b>Text</b></button>
        <i className="floating-toolbar-divider" />
        <div className="floating-color-group" aria-label="Colores de marcador">{colors.map((color) => <button key={color.value} type="button" className={`floating-color ${color.className} ${selection.color === color.value ? 'selected' : ''}`} onClick={() => changeColor(color.value)} aria-label={`Marcar en ${color.name}`} />)}</div>
        <i className="floating-toolbar-divider" />
        <button type="button" className="floating-more" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><b>More</b><MoreHorizontal data-icon="inline-end" /></button>
        <button type="button" className="floating-close" onClick={clearSelection} aria-label="Cerrar herramientas"><X data-icon="inline-start" /></button>
        {moreOpen && <div className="floating-more-menu"><button type="button" onClick={speak}><Volume2 data-icon="inline-start" /> Leer en voz alta</button><button type="button" onClick={() => { setStatus('Pregunta preparada en RevelatiO IA'); setMoreOpen(false) }}><Sparkles data-icon="inline-start" /> Preguntar a RevelatiO IA</button></div>}
      </aside>
      {(expanded || status) && <div className="selection-detail-panel" data-selection-toolbar style={{ left: position.left, top: position.top + 58, width: position.width }}><div><span className="selection-detail-kicker">{status || 'TEXTO SELECCIONADO'}</span>{expanded && <p>{selection.text}</p>}</div><button type="button" onClick={() => { setExpanded(false); setStatus('') }} aria-label="Cerrar detalle"><X data-icon="inline-start" /></button></div>}
    </>}
  </>
}
