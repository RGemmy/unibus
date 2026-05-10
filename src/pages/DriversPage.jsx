import React, { useState } from 'react'
import { Plus, Search, User, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const emptyForm = { user: '', license_number: '', license_expiry_date: '', last_drug_test_date: '', next_drug_test_date: '' }

function isExpiringSoon(dateStr, days=14) {
  if (!dateStr) return false
  const diff = (new Date(dateStr) - new Date()) / (1000*60*60*24)
  return diff >= 0 && diff < days
}
// Drug test every 3 months — auto-calc next date
function calcNextDrugTest(lastDate) {
  if (!lastDate) return null
  const d = new Date(lastDate)
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
}

export default function DriversPage() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: drivers, loading, error, refetch } = useApi(getDrivers)
  const { toasts, showToast } = useToast()

  const filtered = (drivers||[]).filter(d => d.user_name?.includes(search) || d.license_number?.includes(search))
  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (d) => { setForm({ user: d.user, license_number: d.license_number, license_expiry_date: d.license_expiry_date||'', last_drug_test_date: d.last_drug_test_date||'', next_drug_test_date: d.next_drug_test_date||'' }); setEditId(d.id); setModal('form') }

  const handleDelete = async (id) => {
    if (!confirm('حذف السائق؟')) return
    try { await deleteDriver(id); refetch(); showToast('تم الحذف') }
    catch { showToast('فشل الحذف', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updateDriver(editId, form); showToast('تم تعديل السائق') }
      else        { await createDriver(form);          showToast('تمت إضافة السائق') }
      refetch(); setModal(null)
    } catch { showToast('حدث خطأ', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>السائقون</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(drivers||[]).length} سائق</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> إضافة سائق</button>
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>
      {loading && <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height: 200, borderRadius: 14 }}/>)}</div>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
          {filtered.map((driver,i) => {
            const licExp = isExpiringSoon(driver.license_expiry_date)
            const testExp = isExpiringSoon(driver.next_drug_test_date)
            return (
              <div key={driver.id} className="card" style={{ display:"flex", flexDirection:"column", padding: 20, animation: `fadeUp ${0.1+i*0.05}s ease` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white' }}>
                    {driver.user_name?.[0]||'س'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{driver.user_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>{driver.license_number}</div>
                  </div>
                  <span className={`badge ${driver.is_active?'badge-green':'badge-red'}`}>{driver.is_active?'نشط':'غير نشط'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ padding: '9px 6px', background: licExp?'rgba(245,158,11,0.1)':'var(--surface)', borderRadius: 8, border: licExp?'1px solid rgba(245,158,11,0.3)':'1px solid transparent' }}>
                    {licExp && <AlertTriangle size={10} color="var(--amber)" style={{ marginBottom: 2 }}/>}
                    <div style={{ fontSize: 9, color: licExp?'var(--amber)':'var(--text-muted)', fontWeight: licExp?700:400 }}>انتهاء الرخصة</div>
                    <div style={{ fontSize: 10, color: licExp?'var(--amber)':'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{driver.license_expiry_date||'—'}</div>
                  </div>
                  <div style={{ padding: '9px 6px', background: testExp?'rgba(239,68,68,0.1)':'var(--surface)', borderRadius: 8, border: testExp?'1px solid rgba(239,68,68,0.3)':'1px solid transparent' }}>
                    {testExp && <AlertTriangle size={10} color="var(--red-light)" style={{ marginBottom: 2 }}/>}
                    <div style={{ fontSize: 9, color: testExp?'var(--red-light)':'var(--text-muted)', fontWeight: testExp?700:400 }}>فحص مخدرات</div>
                    <div style={{ fontSize: 10, color: testExp?'var(--red-light)':'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{driver.next_drug_test_date||'—'}</div>
                  </div>
                </div>
                {(licExp || testExp) && (
                  <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--amber)' }}>
                    <AlertTriangle size={16}/> تحذير: يحتاج تجديد قريباً
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={()=>openEdit(driver)}><Edit2 size={16}/> تعديل</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(driver.id)}><Trash2 size={16}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?'تعديل سائق':'إضافة سائق'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">رقم المستخدم (User ID)</label>
              <input type="number" className="form-input" value={form.user} onChange={e=>setForm({...form,user:e.target.value})} required/>
            </div>
            <div className="form-group"><label className="form-label">رقم الرخصة</label><input className="form-input" value={form.license_number} onChange={e=>setForm({...form,license_number:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">انتهاء الرخصة</label><input type="date" className="form-input" value={form.license_expiry_date} onChange={e=>setForm({...form,license_expiry_date:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">آخر فحص مخدرات</label><input type="date" className="form-input" value={form.last_drug_test_date} onChange={e=>setForm({...form,last_drug_test_date:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">الفحص القادم</label><input type="date" className="form-input" value={form.next_drug_test_date} onChange={e=>setForm({...form,next_drug_test_date:e.target.value})}/></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'جاري الحفظ...':editId?'حفظ':'إضافة'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
