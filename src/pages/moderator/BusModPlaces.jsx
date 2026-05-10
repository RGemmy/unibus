import React, { useState } from 'react'
import { Plus, Search, MapPin, Edit2, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import { useApi, useToast } from '../../hooks/useApi'
import { useLanguage } from '../../context/LanguageContext'
import { getPlaces, createPlace, updatePlace, deletePlace } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function BusModPlaces() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ place_name: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: places, loading, error, refetch } = useApi(getPlaces)
  const { toasts, showToast } = useToast()

  const filtered = (places||[]).filter(p => p.place_name?.includes(search))
  const openAdd  = () => { setForm({ place_name:'' }); setEditId(null); setModal('form') }
  const openEdit = (p) => { setForm({ place_name: p.place_name }); setEditId(p.id); setModal('form') }
  const handleDelete = async (id) => {
    try { await deletePlace(id); refetch(); showToast('تم الحذف') }
    catch { showToast('فشل الحذف', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updatePlace(editId, form); showToast('تم التعديل') }
      else        { await createPlace(form);          showToast('تمت الإضافة') }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>الأماكن والمحطات</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(places||[]).length} مكان</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> إضافة مكان</button>
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>
      {loading && <div style={{ display:'grid', gridTemplateColumns: '1fr', gap:14 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:80, borderRadius:14 }}/>)}</div>}
      {error && <div style={{ padding:20, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'var(--red-light)' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((place,i) => (
            <div key={place.id} className="card" style={{ padding: isMobile ? '12px 16px' : 18, display:'flex', alignItems:'center', gap:14, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{place.place_name}</div>
              </div>
              <div style={{ display:'flex', gap: isMobile ? 4 : 6, flexShrink:0 }}>
                <button className="btn btn-secondary btn-sm" style={{ padding: isMobile ? '5px 10px' : undefined }} onClick={()=>openEdit(place)}><Edit2 size={14}/></button>
                <button className="btn btn-danger btn-sm" style={{ padding: isMobile ? '5px 10px' : undefined }} onClick={()=>handleDelete(place.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?'تعديل مكان':'إضافة مكان'}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group"><label className="form-label">اسم المكان</label><input className="form-input" value={form.place_name} onChange={e=>setForm({place_name:e.target.value})} required/></div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?'حفظ':t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
