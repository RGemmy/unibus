import React, { useState } from 'react'
import { Plus, Search, Route, Edit2, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import { useApi, useToast } from '../../hooks/useApi'
import { useLanguage } from '../../context/LanguageContext'
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const emptyForm = { start_point: '', end_point: '' }

export default function BusModRoutes() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: routes, loading, error, refetch } = useApi(getRoutes)
  const { toasts, showToast } = useToast()

  const filtered = (routes||[]).filter(r => r.start_point?.includes(search) || r.end_point?.includes(search))
  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (r) => { setForm({ start_point: r.start_point, end_point: r.end_point }); setEditId(r.id); setModal('form') }

  const handleDelete = async (id) => {
    if (!confirm('حذف المسار؟')) return
    try { await deleteRoute(id); refetch(); showToast('تم حذف المسار') }
    catch { showToast('فشل الحذف', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updateRoute(editId, form); showToast('تم تعديل المسار') }
      else        { await createRoute(form);          showToast('تمت إضافة المسار') }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>المسارات</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(routes||[]).length} مسار</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> مسار جديد</button>
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>
      {loading && <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }}/>)}</div>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {filtered.map((route,i) => (
            <div key={route.id} className="card" style={{ display:"flex", flexDirection:"column", padding: isMobile ? '12px 12px' : 20, animation: `fadeUp ${0.1+i*0.05}s ease` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 10 : 16 }}>
                <div style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: 10, background: 'rgba(38,101,140,0.12)', border: '1px solid rgba(38,101,140,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Route size={isMobile ? 17 : 22} color="var(--evergreen)"/>
                </div>
                <span className="badge badge-blue">{route.schedules?.length || 0} جدول</span>
              </div>
              {isMobile ? (
                <div style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700, minWidth:22 }}>من</span>
                    <span style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{route.start_point}</span>
                  </div>
                  <div style={{ width:'100%', height:1, background:'var(--border)', margin:'4px 0' }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700, minWidth:22 }}>إلى</span>
                    <span style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{route.end_point}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, background: 'var(--surface)', borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>من</div>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.start_point}</div>
                  </div>
                  <div style={{ width: 40, height: 1, background: 'var(--calm)', flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>إلى</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.end_point}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: isMobile ? 6 : 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: isMobile ? 12 : undefined }} onClick={() => openEdit(route)}><Edit2 size={14}/>{!isMobile && ' تعديل'}</button>
                <button className="btn btn-danger btn-sm" style={{ padding: isMobile ? '4px 10px' : undefined }} onClick={() => handleDelete(route.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modal==='form'} onClose={() => setModal(null)} title={editId?'تعديل مسار':'إضافة مسار جديد'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group"><label className="form-label">نقطة البداية</label><input className="form-input" value={form.start_point} onChange={e=>setForm({...form,start_point:e.target.value})} required/></div>
          <div className="form-group"><label className="form-label">نقطة النهاية</label><input className="form-input" value={form.end_point} onChange={e=>setForm({...form,end_point:e.target.value})} required/></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?'حفظ':t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
