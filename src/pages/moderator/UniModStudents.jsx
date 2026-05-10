import React, { useState } from 'react'
import { GraduationCap, Search, Plus, Trash2, Edit2 } from 'lucide-react'
import { useApi, useToast } from '../../hooks/useApi'
import { getStudents, createStudent, deleteStudent, updateStudent } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import { useIsMobile } from '../../hooks/useIsMobile'

const emptyForm = { user_name:'', faculty:'', faculty_en:'', program:'', program_en:'', university:'جامعة شرق بورسعيد الأهلية', university_en:'East Port Said Private University', status:'active', subscription:false }

export default function UniModStudents() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [editId, setEditId]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const { data: students, loading, refetch } = useApi(getStudents)
  const { toasts, showToast } = useToast()

  const filtered = (students||[]).filter(s => {
    const q = search.toLowerCase()
    return s.user_name?.toLowerCase().includes(q) || s.faculty?.toLowerCase().includes(q)
  })

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (s) => {
    setForm({ user_name:s.user_name, faculty:s.faculty, faculty_en:s.faculty_en||'', program:s.program, program_en:s.program_en||'', university:s.university, university_en:s.university_en||'East Port Said Private University', status:s.status, subscription:s.subscription||false })
    setEditId(s.student_id||s.id)
    setModal('form')
  }

  const handleDelete = async (id) => {
    if (!confirm(lang==='ar'?'حذف هذا الطالب؟':'Delete this student?')) return
    try { await deleteStudent(id); refetch(); showToast(lang==='ar'?'تم حذف الطالب':'Student deleted') }
    catch { showToast(lang==='ar'?'فشل الحذف':'Delete failed','error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await updateStudent(editId, form); showToast(lang==='ar'?'تم تعديل بيانات الطالب':'Student updated') }
      else        { await createStudent(form);         showToast(lang==='ar'?'تمت إضافة الطالب':'Student added') }
      refetch(); setModal(null)
    } catch { showToast(lang==='ar'?'فشل الحفظ':'Save failed','error') }
    finally { setSaving(false) }
  }

  const inp = (field, label, placeholder='') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" placeholder={placeholder} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})} required={['user_name','faculty','program'].includes(field)}/>
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('students')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {(students||[]).length} {lang==='ar'?'طالب مسجّل':'registered student(s)'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18}/> {lang==='ar'?'إضافة طالب':'Add Student'}
        </button>
      </div>

      <div style={{ position:'relative', marginBottom:18, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
      </div>

      {loading && Array(5).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:60, borderRadius:10, marginBottom:8 }}/>)}
      {!loading && filtered.length===0 && <EmptyState icon={GraduationCap} message={lang==='ar'?'لا يوجد طلاب':'No students found'}/>}
      {!loading && filtered.length>0 && (
        <div className="card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {[
                  lang==='ar'?'الاسم':'Name',
                  lang==='ar'?'الكلية':'Faculty',
                  lang==='ar'?'البرنامج':'Program',
                  lang==='ar'?'الحالة':'Status',
                  lang==='ar'?'الاشتراك':'Sub',
                  '',
                ].map((h,i)=>(
                  <th key={i} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-muted)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.student_id||s.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--calm),var(--early))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'white', flexShrink:0 }}>
                        {s.user_name?.[0]||'ط'}
                      </div>
                      {s.user_name}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:16, color:'var(--text-muted)' }}>{lang==='ar'?s.faculty:s.faculty_en}</td>
                  <td style={{ padding:'12px 16px', fontSize:16 }}>{lang==='ar'?s.program:s.program_en}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span className={`badge ${s.status==='active'?'badge-green':'badge-red'}`}>
                      {s.status==='active'?(lang==='ar'?'نشط':'Active'):(lang==='ar'?'غير نشط':'Inactive')}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span className={`badge ${s.subscription?'badge-blue':'badge-amber'}`}>
                      {s.subscription?(lang==='ar'?'مشترك':'Subscribed'):(lang==='ar'?'غير مشترك':'No Sub')}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(s)}><Edit2 size={15}/></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(s.student_id||s.id)}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?(lang==='ar'?'تعديل بيانات الطالب':'Edit Student'):(lang==='ar'?'إضافة طالب جديد':'Add New Student')}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {inp('user_name', lang==='ar'?'الاسم الكامل':'Full Name', lang==='ar'?'محمد أحمد':'John Smith')}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:12 }}>
            {inp('faculty',    lang==='ar'?'الكلية (عربي)':'Faculty (AR)',   lang==='ar'?'الهندسة':'الهندسة')}
            {inp('faculty_en', lang==='ar'?'الكلية (إنجليزي)':'Faculty (EN)', 'Engineering')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:12 }}>
            {inp('program',    lang==='ar'?'البرنامج (عربي)':'Program (AR)',   lang==='ar'?'هندسة البرمجيات':'هندسة البرمجيات')}
            {inp('program_en', lang==='ar'?'البرنامج (إنجليزي)':'Program (EN)', 'Software Engineering')}
          </div>
          <div className="form-group">
            <label className="form-label">{lang==='ar'?'الحالة':'Status'}</label>
            <select className="form-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={{ appearance:'none' }}>
              <option value="active">{lang==='ar'?'نشط':'Active'}</option>
              <option value="inactive">{lang==='ar'?'غير نشط':'Inactive'}</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving?(lang==='ar'?'جاري الحفظ...':'Saving...'):(editId?(lang==='ar'?'حفظ التعديلات':'Save Changes'):(lang==='ar'?'إضافة الطالب':'Add Student'))}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
