import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { User, Mail, Phone, CreditCard, Shield, Edit2, Save, X, Key, CheckCircle } from 'lucide-react'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useApi'
import api from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const roleGradients = {
  admin:          'linear-gradient(135deg, #26658C, #54ACBF)',
  moderator:      'linear-gradient(135deg, #1E5278, #54ACBF)',
  university_mod: 'linear-gradient(135deg, #26658C, #54ACBF)',
  bus_mod:        'linear-gradient(135deg, #54ACBF, #A7EBF2)',
  student:        'linear-gradient(135deg, #26658C, #54ACBF)',
  driver:         'linear-gradient(135deg, #1E5278, #54ACBF)',
}

export default function ProfilePage() {
  const isMobile = useIsMobile()
  const { user, role }         = useAuth()
  const { t }                  = useLanguage()
  const { toasts, showToast }  = useToast()
  const [editing,  setEditing]  = useState(false)
  const [changePw, setChangePw] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({ user_name: user?.user_name||'', phone: user?.phone||'', national_id: user?.national_id||'' })
  const [pwForm,   setPwForm]   = useState({ old_password:'', new_password:'', confirm_password:'' })

  const roleLabels = {
    admin:     t('role_admin'),
    moderator: t('role_moderator'),
    student:   t('role_student'),
    driver:    t('role_driver'),
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/auth/users/${user?.id}/`, form)
      const updated = { ...user, ...form }
      localStorage.setItem('user', JSON.stringify(updated))
      showToast(t('save_success'))
      setEditing(false)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm_password) { showToast(t('pw_mismatch'), 'error'); return }
    setSaving(true)
    try {
      await api.post('/auth/change-password/', pwForm)
      showToast(t('pw_changed'))
      setChangePw(false)
      setPwForm({ old_password:'', new_password:'', confirm_password:'' })
    } catch { showToast(t('pw_change_fail'), 'error') }
    finally { setSaving(false) }
  }

  const infoItems = [
    { icon: Mail,       label: t('email'),       value: user?.email,       field: null },
    { icon: Phone,      label: t('phone'),        value: user?.phone,       field: 'phone' },
    { icon: CreditCard, label: t('national_id'),  value: user?.national_id, field: 'national_id' },
    { icon: Shield,     label: t('role_label'),   value: roleLabels[role],  field: null },
  ]

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>

      {/* Cover + Avatar */}
      <div className="card" style={{ overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:140, background:roleGradients[role]||roleGradients.admin, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)' }}/>
        </div>

        <div style={{ padding:'0 28px 24px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:20 }}>
              <div style={{ width:90, height:90, borderRadius:20, background:roleGradients[role]||roleGradients.admin, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:800, color:'white', border:'4px solid var(--navy-2)', marginTop:-45, flexShrink:0, boxShadow:'0 8px 30px rgba(0,0,0,0.4)' }}>
                {user?.user_name?.[0] || 'م'}
              </div>
              <div style={{ paddingBottom:4 }}>
                <h2 style={{ fontSize:20, fontWeight:800 }}>{user?.user_name}</h2>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                  <span className={`badge ${role==='admin'?'badge-red':role==='driver'?'badge-teal':role==='moderator'?'badge-amber':'badge-blue'}`}>
                    <Shield size={14}/> {roleLabels[role] || role}
                  </span>
                  <span className="badge badge-green"><CheckCircle size={14}/> {t('active_badge')}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, paddingBottom:4 }}>
              {!editing ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 size={17}/> {t('edit')}</button>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setEditing(false)}><X size={17}/> {t('cancel')}</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setChangePw(!changePw)}><Key size={17}/> {t('change_password')}</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
        {/* Personal Info */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:19, fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <User size={22} color="var(--matcha)"/> {t('personal_info')}
          </h3>

          {!editing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--surface)', borderRadius:9 }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={18} color="var(--matcha)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
                    <div style={{ fontSize:17, fontWeight:600, marginTop:2 }}>{value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">{t('full_name')}</label>
                <input className="form-input" value={form.user_name} onChange={e => setForm({...form, user_name:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity:0.6 }}/>
              </div>
              <div className="form-group">
                <label className="form-label">{t('phone')}</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">{t('national_id')}</label>
                <input className="form-input" value={form.national_id} onChange={e => setForm({...form, national_id:e.target.value})}/>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width:'100%' }}>
                <Save size={18}/> {saving ? t('saving') : t('save_changes')}
              </button>
            </form>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {changePw && (
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:19, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                <Key size={22} color="var(--amber)"/> {t('change_password')}
              </h3>
              <form onSubmit={handleChangePw} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group">
                  <label className="form-label">{t('current_password')}</label>
                  <input type="password" className="form-input" value={pwForm.old_password} onChange={e => setPwForm({...pwForm, old_password:e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('new_password')}</label>
                  <input type="password" className="form-input" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password:e.target.value})} required minLength={6}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('confirm_new_password')}</label>
                  <input type="password" className="form-input" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password:e.target.value})} required/>
                </div>
                <button type="submit" className="btn btn-amber" disabled={saving} style={{ width:'100%' }}>
                  {saving ? t('saving') : t('change_password')}
                </button>
              </form>
            </div>
          )}

          {/* Account Summary */}
          <div className="card" style={{ padding:24 }}>
            <h3 style={{ fontSize:19, fontWeight:700, marginBottom:16 }}>{t('account_summary')}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label: t('account_number'), value: `#${user?.id || '—'}` },
                { label: t('account_type'),   value: roleLabels[role] || '—' },
                { label: t('account_status'), value: t('active') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--surface)', borderRadius:8 }}>
                  <span style={{ fontSize:16, color:'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize:16, fontWeight:600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
