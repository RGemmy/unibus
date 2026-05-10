import React, { useState } from 'react'
import { Plus, Search, User, Edit2, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useApi, useToast } from '../../hooks/useApi'
import { getDrivers, createDriver, deleteDriver } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const emptyForm = { user_name:'', email:'', phone:'', license_number:'', experience_years:1 }

export default function BusModDrivers() {
  const isMobile = useIsMobile()
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const { data:drivers, loading, refetch } = useApi(getDrivers)
  const { toasts, showToast } = useToast()

  const filtered = (drivers||[]).filter(d => d.user_name?.toLowerCase().includes(search.toLowerCase()) || d.license_number?.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (id) => {
    if (!confirm(t('delete') + '?')) return
    try { await deleteDriver(id); refetch(); showToast(t('driver_deleted')) }
    catch { showToast(t('save_fail'),'error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await createDriver(form); showToast(t('driver_added')); refetch(); setModal(null) }
    catch { showToast(t('save_fail'),'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('drivers')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(drivers||[]).length}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{ setForm(emptyForm); setModal('form') }}><Plus size={20}/> {t('add_driver')}</button>
      </div>
      <div style={{ position:'relative', marginBottom:18, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
      </div>
      {loading && <div>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:70, borderRadius:10, marginBottom:8 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={User} message={t('no_drivers')}/>}
      {!loading && filtered.length>0 && (
        <div className="card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {[t('user_name'), t('email_label'), t('phone'), t('license_number'), t('experience'), t('actions')].map(h=>(
                  <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-muted)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d=>(
                <tr key={d.id||d.user_id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'rgba(142,164,139,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <User size={18} color="var(--evergreen)"/>
                      </div>
                      {d.user_name}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:16, color:'var(--text-muted)' }}>{d.email}</td>
                  <td style={{ padding:'12px 16px', fontSize:16 }}>{d.phone}</td>
                  <td style={{ padding:'12px 16px', fontSize:16, fontFamily:'monospace' }}>{d.license_number}</td>
                  <td style={{ padding:'12px 16px', fontSize:16 }}>{d.experience_years} {t('years')}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(d.id||d.user_id)}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={t('add_driver')}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{t('full_name')}</label>
              <input className="form-input" value={form.user_name} onChange={e=>setForm({...form,user_name:e.target.value})} required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('email_label')}</label>
              <input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('license_number')}</label>
              <input className="form-input" value={form.license_number} onChange={e=>setForm({...form,license_number:e.target.value})} required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('experience')}</label>
              <input type="number" className="form-input" value={form.experience_years} onChange={e=>setForm({...form,experience_years:e.target.value})} min="0" max="40"/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):t('add_driver')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
