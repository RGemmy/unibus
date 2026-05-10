import React, { useState } from 'react'
import { Plus, Search, GraduationCap, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { useLanguage } from '../context/LanguageContext'
import { getUniversities, createUniversity, updateUniversity, deleteUniversity } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

export default function UniversitiesPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: unis, loading, error, refetch } = useApi(getUniversities)
  const { toasts, showToast } = useToast()

  const filtered = (unis||[]).filter(u => u.name?.includes(search))
  const openAdd  = () => { setForm({ name:'' }); setEditId(null); setModal('form') }
  const openEdit = (u) => { setForm({ name: u.name }); setEditId(u.id); setModal('form') }
  const handleDelete = async (id) => {
    try { await deleteUniversity(id); refetch(); showToast('تم الحذف') }
    catch { showToast('فشل الحذف', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updateUniversity(editId, form); showToast('تم التعديل') }
      else        { await createUniversity(form);          showToast('تمت الإضافة') }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1300, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize:20, fontWeight:800 }}>الجامعات</h2><p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(unis||[]).length} جامعة</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> إضافة جامعة</button>
      </div>
      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>
      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:16 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:160, borderRadius:14 }}/>)}</div>}
      {!loading && !error && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:16 }}>
          {filtered.map((uni,i) => (
            <div key={uni.id} className="card" style={{ padding:20, animation:`fadeUp ${0.1+i*0.05}s ease` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:13, background:'rgba(114,138,110,0.12)', border:'1px solid rgba(114,138,110,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <GraduationCap size={26} color="var(--matcha)"/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:17, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{uni.name}</div>
                </div>
              </div>
              <div style={{ padding:12, background:'var(--surface)', borderRadius:9, marginBottom:14, textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:800, color:'var(--matcha)' }}>{uni.student_count||0}</div>
                <div style={{ fontSize:14, color:'var(--text-muted)' }}>طالب مسجل</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(uni)}><Edit2 size={16}/> تعديل</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(uni.id)}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?'تعديل جامعة':'إضافة جامعة'}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group"><label className="form-label">اسم الجامعة</label><input className="form-input" value={form.name} onChange={e=>setForm({ name:e.target.value })} required/></div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?'حفظ':t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
