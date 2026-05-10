import React, { useState } from 'react'
import { Plus, Search, Bus, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import EmptyState from '../components/EmptyState'
import { useApi, useToast } from '../hooks/useApi'
import { getBuses, createBus, updateBus, deleteBus } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function BusesPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({ plate_number:'', capacity:45, color:'' })
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)

  const { data:buses, loading, refetch } = useApi(getBuses)
  const { toasts, showToast } = useToast()

  const colors = [t('color_white'), t('color_yellow'), t('color_blue'), t('color_red'), t('color_silver')]
  const colorHex = { [t('color_white')]:'#f8fafc', [t('color_yellow')]:'#fbbf24', [t('color_blue')]:'#3b82f6', [t('color_red')]:'#ef4444', [t('color_silver')]:'#94a3b8', 'أبيض':'#f8fafc','أصفر':'#fbbf24','أزرق':'#3b82f6','أحمر':'#ef4444','فضي':'#94a3b8','White':'#f8fafc','Yellow':'#fbbf24','Blue':'#3b82f6','Red':'#ef4444','Silver':'#94a3b8' }
  const statusCfg = { active:{ label:t('status_active'), cls:'badge-green' }, maintenance:{ label:t('status_maintenance'), cls:'badge-amber' }, inactive:{ label:t('status_inactive'), cls:'badge-red' } }

  const filtered = (buses||[]).filter(b =>
    b.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.color?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm({ plate_number:'', capacity:45, color:colors[0] }); setEditId(null); setModal('form') }
  const openEdit = (b) => { setForm({ plate_number:b.plate_number, capacity:b.capacity, color:b.color }); setEditId(b.id); setModal('form') }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_bus'))) return
    try { await deleteBus(id); refetch(); showToast(t('bus_deleted')) }
    catch { showToast(t('save_fail'), 'error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updateBus(editId, form); showToast(t('bus_updated')) }
      else        { await createBus(form);          showToast(t('bus_added'))   }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1300, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('bus_fleet')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(buses||[]).length} {t('buses')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> {t('add_bus')}</button>
      </div>

      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>

      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:180, borderRadius:14 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={Bus} message={t('no_data')}/>}

      {!loading && filtered.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
          {filtered.map((bus,i)=>{
            const c  = colorHex[bus.color] || '#94a3b8'
            const sc = statusCfg[bus.status] || statusCfg.active
            return (
              <div key={bus.id} className="card" style={{ display:"flex", flexDirection:"column", padding:20, animation:`fadeUp ${0.1+i*0.05}s ease` }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                  <div style={{ width:56, height:56, borderRadius:14, flexShrink:0, background:`${c}22`, border:`2px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bus size={30} color={c}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:19, fontWeight:700, fontFamily:'monospace' }}>{bus.plate_number}</div>
                    <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }}/>
                      {bus.color}
                    </div>
                  </div>
                  <span className={`badge ${sc.cls}`}>{sc.label}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10, marginBottom:16 }}>
                  <div style={{ padding:10, background:'var(--surface)', borderRadius:8, textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:800 }}>{bus.capacity}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{t('seats')}</div>
                  </div>
                  <div style={{ padding:10, background:'var(--surface)', borderRadius:8, textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:700 }}>{bus.trips_count||0}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{t('trips_count')}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(bus)}><Edit2 size={16}/> {t('edit_btn')}</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(bus.id)}><Trash2 size={16}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?t('edit_bus'):t('add_bus')}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="form-label">{t('plate_number')}</label>
              <input className="form-input" value={form.plate_number} onChange={e=>setForm({...form,plate_number:e.target.value})} placeholder={lang==='ar'?'أ ب ت 1234':'ABC 1234'} required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('capacity')}</label>
              <input type="number" className="form-input" value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})} min="10" max="80" required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('color')}</label>
              <select className="form-input" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}>
                {colors.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?t('save_changes'):t('add_bus')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
