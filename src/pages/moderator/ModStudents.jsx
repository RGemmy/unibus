import React, { useState } from 'react'
import { Search, GraduationCap, Eye, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../../components/Modal'
import { useApi } from '../../hooks/useApi'
import { getStudents } from '../../services/api'

export default function ModStudents() {
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [modal,    setModal]    = useState(null)

  const { data: students, loading, error } = useApi(getStudents)

  const filtered = (students||[]).filter(s =>
    s.user_name?.includes(search) || s.faculty?.includes(search) || s.university_name?.includes(search)
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>الطلاب</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(students||[]).length} طالب مسجل</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder="بحث بالاسم أو الكلية..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>الطالب</th><th>الجامعة</th><th>الكلية</th><th>الاشتراك</th><th>الحالة</th><th>عرض</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {s.user_name?.[0]||'ط'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{s.user_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{s.university_name||'—'}</td>
                  <td style={{ fontSize: 13 }}>{s.faculty||'—'}</td>
                  <td>{s.has_subscription ? <span className="badge badge-green"><CheckCircle size={14}/> فعال</span> : <span className="badge badge-red"><XCircle size={14}/> غير فعال</span>}</td>
                  <td><span className={`badge ${s.is_active?'badge-blue':'badge-red'}`}>{s.is_active?'نشط':'غير نشط'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(s); setModal('view') }}>
                      <Eye size={16}/> عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal==='view'} onClose={() => setModal(null)} title="تفاصيل الطالب" size="sm">
        {selected && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: 'var(--surface)', borderRadius: 12, marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {selected.user_name?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{selected.user_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{selected.faculty} · {selected.program}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'البريد الإلكتروني', value: selected.email },
                { label: 'الجوال',            value: selected.phone },
                { label: 'الجامعة',           value: selected.university_name },
                { label: 'الاشتراك',          value: selected.has_subscription ? '✅ فعال' : '❌ غير فعال' },
                { label: 'الحالة',            value: selected.is_active ? '🟢 نشط' : '🔴 غير نشط' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{value||'—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
