import React, { useState } from 'react'
import { Plus, Search, Users, Edit2, Trash2, Shield } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { getUsers, updateUser, deleteUser } from '../services/api'
import api from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const roleConfig = {
  admin:     { label: { ar:'مدير النظام', en:'Admin'      }, class: 'badge-red'   },
  moderator: { label: { ar:'مشرف',        en:'Moderator'  }, class: 'badge-amber' },
  uni_mod:   { label: { ar:'مشرف جامعة',  en:'Uni Mod'    }, class: 'badge-teal'  },
  bus_mod:   { label: { ar:'مشرف باص',    en:'Bus Mod'    }, class: 'badge-blue'  },
  student:   { label: { ar:'طالب',        en:'Student'    }, class: 'badge-blue'  },
  driver:    { label: { ar:'سائق',        en:'Driver'     }, class: 'badge-teal'  },
}

export default function UsersPage() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const { data: users, loading, error, refetch } = useApi(getUsers)
  const { toasts, showToast } = useToast()

  const filtered = (users||[]).filter(u => {
    const matchSearch = u.user_name?.includes(search) || u.email?.includes(search)
    const matchRole = roleFilter==='all' || u.role_name===roleFilter
    return matchSearch && matchRole
  })

  const openEdit = (u) => { setSelected(u); setForm({ user_name: u.user_name, phone: u.phone||'', national_id: u.national_id||'', is_active: u.is_active }); setModal('form') }

  const handleDelete = async (id) => {
    if (!confirm('حذف المستخدم؟')) return
    try { await deleteUser(id); refetch(); showToast('تم الحذف') }
    catch { showToast('فشل الحذف', 'error') }
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await updateUser(selected.id, form); refetch(); setModal(null); showToast('تم التعديل') }
    catch { showToast('حدث خطأ', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>إدارة المستخدمين</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(users||[]).length} مستخدم</p></div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input className="form-input" placeholder="بحث بالاسم أو البريد..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
        </div>
        {['all','admin','moderator','student','driver'].map(r=>(
          <button key={r} onClick={()=>setRoleFilter(r)} className="btn" style={{ background: roleFilter===r?'var(--calm)':'var(--surface)', color: roleFilter===r?'white':'var(--text-secondary)', border: `1px solid ${roleFilter===r?'var(--calm)':'var(--border)'}`, fontFamily: 'var(--font)' }}>
            {{ all:'الكل', admin:'مديرون', moderator:'مشرفون', student:'طلاب', driver:'سائقون' }[r]}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead><tr><th>المستخدم</th><th>البريد الإلكتروني</th><th>الجوال</th><th>رقم الهوية</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {u.user_name?.[0]||'م'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{u.user_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{u.phone||'—'}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{u.national_id||'—'}</td>
                  <td>
                    {(() => {
                      const cfg = roleConfig[u.role_name]
                      const label = cfg ? (cfg.label.ar) : (u.role_name || '—')
                      const cls   = cfg ? cfg.class : 'badge-blue'
                      return <span className={`badge ${cls}`}><Shield size={10}/> {label}</span>
                    })()}
                  </td>
                  <td><span className={`badge ${u.is_active?'badge-green':'badge-red'}`}>{u.is_active?'نشط':'غير نشط'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(u)}><Edit2 size={16}/></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(u.id)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title="تعديل مستخدم">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">الاسم الكامل</label><input className="form-input" value={form.user_name||''} onChange={e=>setForm({...form,user_name:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">رقم الجوال</label><input className="form-input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">رقم الهوية</label><input className="form-input" value={form.national_id||''} onChange={e=>setForm({...form,national_id:e.target.value})}/></div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">الحالة</label>
              <select className="form-input" value={form.is_active?'true':'false'} onChange={e=>setForm({...form,is_active:e.target.value==='true'})}>
                <option value="true">نشط</option><option value="false">غير نشط</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'جاري الحفظ...':'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
