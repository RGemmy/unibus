import React, { useState } from 'react'
import { Plus, Search, Shield, XCircle } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { useLanguage } from '../context/LanguageContext'
import { getSubscriptions, createSubscription, cancelSubscription } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const statusConfig = {
  active:    { label: 'فعال',   class: 'badge-green' },
  cancelled: { label: 'ملغي',  class: 'badge-red'   },
  expired:   { label: 'منتهي', class: 'badge-amber' },
}
const emptyForm = { student: '', plan: 'سداسي', start_date: '', end_date: '', amount: '' }

export default function SubscriptionsPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const { data: subs, loading, error, refetch } = useApi(getSubscriptions)
  const { toasts, showToast } = useToast()

  const filtered = (subs||[]).filter(s => s.student_name?.includes(search))
  const activeCount  = (subs||[]).filter(s=>s.status==='active').length
  const totalRevenue = (subs||[]).filter(s=>s.status!=='cancelled').reduce((acc,s)=>acc+Number(s.amount),0)

  const handleCancel = async (id) => {
    try { await cancelSubscription(id); refetch(); showToast('تم إلغاء الاشتراك') }
    catch { showToast('فشل الإلغاء', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await createSubscription(form); refetch(); setModal(null); showToast('تمت إضافة الاشتراك') }
    catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>الاشتراكات</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{activeCount} اشتراك فعال</p></div>
        <button className="btn btn-primary" onClick={()=>{ setForm(emptyForm); setModal('form') }}><Plus size={20}/> اشتراك جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'اشتراكات فعالة',    value: activeCount,                                 color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
          { label: 'إجمالي الإيرادات',  value: `${totalRevenue.toLocaleString('ar-SA')} ر.س`, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: 'var(--amber)' },
          { label: 'إجمالي الاشتراكات', value: (subs||[]).length,                           color: 'rgba(114,138,110,0.12)', border: 'rgba(114,138,110,0.25)', text: 'var(--blue-light)' },
        ].map(({ label, value, color, border, text }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', background: color, borderColor: border }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: text }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder="بحث باسم الطالب..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead><tr><th>الطالب</th><th>الباقة</th><th>البداية</th><th>الانتهاء</th><th>المبلغ</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {s.student_name?.[0]||'ط'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{s.student_name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{s.plan||'—'}</span></td>
                  <td style={{ fontSize: 13 }}>{s.start_date}</td>
                  <td style={{ fontSize: 13 }}>{s.end_date}</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--amber-light)' }}>{Number(s.amount).toLocaleString('ar-SA')} ر.س</span></td>
                  <td><span className={`badge ${statusConfig[s.status]?.class}`}>{statusConfig[s.status]?.label}</span></td>
                  <td>{s.status==='active' && <button className="btn btn-danger btn-sm" onClick={()=>handleCancel(s.id)}><XCircle size={16}/> إلغاء</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title="إضافة اشتراك جديد">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group"><label className="form-label">رقم الطالب (Student ID)</label><input type="number" className="form-input" value={form.student} onChange={e=>setForm({...form,student:e.target.value})} required/></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">الباقة</label>
              <select className="form-input" value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}>
                {['شهري','ربعي','سداسي','سنوي'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">المبلغ (ر.س)</label><input type="number" className="form-input" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">تاريخ البداية</label><input type="date" className="form-input" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">تاريخ الانتهاء</label><input type="date" className="form-input" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} required/></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
