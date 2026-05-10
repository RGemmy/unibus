import React, { useState } from 'react'
import { Plus, Search, GraduationCap, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { getStudents, updateStudent, deleteUser, getUniversities } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function StudentsPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)

  const { data: students, loading, error, refetch } = useApi(getStudents)
  const { data: unis } = useApi(getUniversities)
  const { toasts, showToast } = useToast()

  const filtered = (students||[]).filter(s =>
    s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.faculty?.toLowerCase().includes(search.toLowerCase()) ||
    s.university_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openView = (s) => { setSelected(s); setModal('view') }
  const openEdit = (s) => {
    setForm({ faculty: s.faculty||'', faculty_en: s.faculty_en||'', program: s.program||'', program_en: s.program_en||'', level: s.level||'', university: s.university })
    setSelected(s); setModal('form')
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await updateStudent(selected.id, form)
      showToast(lang==='ar' ? 'تم تعديل بيانات الطالب' : 'Student updated successfully')
      refetch(); setModal(null)
    } catch { showToast(lang==='ar' ? 'حدث خطأ' : 'An error occurred', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{t('manage_students')}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {(students||[]).length} {lang==='ar' ? 'طالب مسجل' : 'registered students'}
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input
          className="form-input"
          placeholder={lang==='ar' ? 'بحث بالاسم أو الكلية أو الجامعة...' : 'Search by name, faculty, or university...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: 38 }}
        />
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{lang==='ar' ? 'الطالب' : 'Student'}</th>
                <th>{lang==='ar' ? 'الجامعة' : 'University'}</th>
                <th>{lang==='ar' ? 'الكلية' : 'Faculty'}</th>
                <th>{lang==='ar' ? 'البرنامج' : 'Program'}</th>
                <th>{lang==='ar' ? 'الاشتراك' : 'Subscription'}</th>
                <th>{lang==='ar' ? 'الحالة' : 'Status'}</th>
                <th>{lang==='ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {s.user_name?.[0] || 'S'}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.user_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{(lang==='en' && s.university_name_en) ? s.university_name_en : s.university_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{(lang==='en' && s.faculty_en) ? s.faculty_en : s.faculty || '—'}</td>
                  <td style={{ fontSize: 13 }}>{(lang==='en' && s.program_en) ? s.program_en : s.program || '—'}</td>
                  <td>{s.has_subscription
                    ? <span className="badge badge-green"><CheckCircle size={14}/> {lang==='ar'?'فعال':'Active'}</span>
                    : <span className="badge badge-red"><XCircle size={14}/> {lang==='ar'?'غير فعال':'Inactive'}</span>}
                  </td>
                  <td><span className={`badge ${s.is_active ? 'badge-blue' : 'badge-red'}`}>{s.is_active ? (lang==='ar'?'نشط':'Active') : (lang==='ar'?'غير نشط':'Inactive')}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openView(s)}><GraduationCap size={16}/></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Edit2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: 16 }}/>
          <p>{t('no_students')}</p>
        </div>
      )}

      <Modal isOpen={modal==='view'} onClose={() => setModal(null)} title={lang==='ar' ? 'تفاصيل الطالب' : 'Student Details'}>
        {selected && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--surface)', borderRadius: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'white' }}>
                {selected.user_name?.[0]}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>{selected.user_name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {(lang==='en'&&selected.faculty_en)?selected.faculty_en:selected.faculty} · {(lang==='en'&&selected.program_en)?selected.program_en:selected.program}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 12 }}>
              {[
                { label: lang==='ar'?'البريد الإلكتروني':'Email', value: selected.email },
                { label: lang==='ar'?'الجوال':'Phone', value: selected.phone },
                { label: lang==='ar'?'الجامعة':'University', value: (lang==='en'&&selected.university_name_en)?selected.university_name_en:selected.university_name },
                { label: lang==='ar'?'البرنامج':'Program', value: (lang==='en'&&selected.program_en)?selected.program_en:selected.program },
                { label: lang==='ar'?'الاشتراك':'Subscription', value: selected.has_subscription?(lang==='ar'?'فعال':'Active'):(lang==='ar'?'غير فعال':'Inactive') },
                { label: lang==='ar'?'الحالة':'Status', value: selected.is_active?(lang==='ar'?'نشط':'Active'):(lang==='ar'?'غير نشط':'Inactive') },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 9 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modal==='form'} onClose={() => setModal(null)} title={lang==='ar' ? 'تعديل بيانات الطالب' : 'Edit Student'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'الكلية (عربي)' : 'Faculty (Arabic)'}</label>
              <input className="form-input" value={form.faculty||''} onChange={e=>setForm({...form,faculty:e.target.value})} placeholder="مثال: طب بشري" dir="rtl"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'الكلية (إنجليزي)' : 'Faculty (English)'}</label>
              <input className="form-input" value={form.faculty_en||''} onChange={e=>setForm({...form,faculty_en:e.target.value})} placeholder="e.g. Medicine" dir="ltr"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'البرنامج (عربي)' : 'Program (Arabic)'}</label>
              <input className="form-input" value={form.program||''} onChange={e=>setForm({...form,program:e.target.value})} placeholder="مثال: بكالوريوس طب" dir="rtl"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'البرنامج (إنجليزي)' : 'Program (English)'}</label>
              <input className="form-input" value={form.program_en||''} onChange={e=>setForm({...form,program_en:e.target.value})} placeholder="e.g. Bachelor of Medicine" dir="ltr"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'الجامعة' : 'University'}</label>
              <select className="form-input" value={form.university||''} onChange={e=>setForm({...form,university:e.target.value})}>
                <option value="">{lang==='ar' ? 'اختر الجامعة' : 'Select university'}</option>
                {(unis||[]).map(u=><option key={u.id} value={u.id}>{lang==='en'?(u.name_en||u.name):u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar' ? 'المستوى' : 'Level'}</label>
              <select className="form-input" value={form.level||''} onChange={e=>setForm({...form,level:e.target.value})}>
                <option value="">{lang==='ar' ? 'اختر المستوى' : 'Select level'}</option>
                {[1,2,3,4,5,6,7,8].map(l=><option key={l} value={l}>{lang==='ar'?`المستوى ${l}`:`Level ${l}`}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('save_changes')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
