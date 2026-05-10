import UniBusLogo from '../components/UniBusLogo'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, Eye, EyeOff, LogIn, UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

const ROLES_AR = ['university_mod', 'bus_mod', 'student', 'driver']
const ROLES_LABEL = {
  admin:          { ar: 'مدير النظام',         en: 'System Admin'            },
  university_mod: { ar: 'مشرف الجامعة',        en: 'University Moderator'    },
  bus_mod:        { ar: 'مشرف شركة الباصات',   en: 'Bus Company Moderator'   },
  student:        { ar: 'طالب',                en: 'Student'                 },
  driver:         { ar: 'سائق',               en: 'Driver'                  },
}

function roleFor(role) {
  if (role === 'student')   return '/student'
  if (role === 'driver')    return '/driver'
  if (role === 'moderator') return '/mod'
  return '/dashboard'
}

export default function LoginPage() {
  const navigate              = useNavigate()
  const { login, register }   = useAuth()
  const { t, lang, switchLang } = useLanguage()
  const { theme, toggleTheme }  = useTheme()
  const isRtl                   = lang === 'ar'

  // view: 'login' | 'register'
  const [view, setView] = useState('login')

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showPw,    setShowPw]    = useState(false)
  const [loginErr,  setLoginErr]  = useState('')
  const [loading,   setLoading]   = useState(false)

  // Register form
  const [regForm,     setRegForm]     = useState({ name: '', email: '', password: '', confirm: '', role: 'student' })
  const [showRegPw,   setShowRegPw]   = useState(false)
  const [showRegCon,  setShowRegCon]  = useState(false)
  const [regErr,      setRegErr]      = useState('')

  // Welcome flash
  const [welcome, setWelcome] = useState(null) // { name }

  const flash = (user) => {
    setWelcome(user)
    setTimeout(() => { setWelcome(null); navigate(roleFor(user.role)) }, 1800)
  }

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault()
    setLoginErr('')
    setLoading(true)
    setTimeout(() => {
      const res = login(loginForm.email, loginForm.password)
      setLoading(false)
      if (!res.ok) {
        setLoginErr(res.error === 'email'
          ? (isRtl ? 'البريد الإلكتروني غير موجود' : 'Email not found')
          : (isRtl ? 'كلمة المرور غير صحيحة' : 'Incorrect password'))
        return
      }
      flash(res.user)
    }, 350)
  }

  // ── Register submit ───────────────────────────────────────────────────────
  const handleRegister = (e) => {
    e.preventDefault()
    setRegErr('')
    if (regForm.password !== regForm.confirm) {
      setRegErr(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }
    if (regForm.password.length < 6) {
      setRegErr(isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')
      return
    }
    const res = register(regForm.name.trim(), regForm.email.trim(), regForm.password, regForm.role)
    if (!res.ok) {
      setRegErr(isRtl ? 'هذا البريد الإلكتروني مسجّل بالفعل' : 'This email is already registered')
      return
    }
    flash(res.user)
  }

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle}
      style={{ position:'absolute', [isRtl?'left':'right']:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0 }}>
      {show ? <EyeOff size={20}/> : <Eye size={20}/>}
    </button>
  )

  const pwStyle = { paddingLeft: isRtl ? 42 : 14, paddingRight: isRtl ? 14 : 42 }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative' }}>
      {/* bg blobs */}
      <div style={{ position:'absolute', top:'10%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(114,138,110,0.15) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(38,101,140,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Language + Theme toggles top-right */}
      <div style={{ position:'fixed', top:16, [isRtl?'left':'right']:16, zIndex:100, display:'flex', alignItems:'center', gap:8 }}>
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 12px', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          onClick={() => switchLang(isRtl ? 'en' : 'ar')}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontSize:16, fontWeight:600, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}
        >
          🌐 {isRtl ? 'English' : 'العربية'}
        </button>
      </div>

      {/* Welcome overlay */}
      {welcome && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(10,22,40,0.93)', backdropFilter:'blur(10px)', animation:'fadeUp 0.3s ease' }}>
          <div style={{ textAlign:'center' }}>
            <CheckCircle size={72} color="#22c55e" style={{ marginBottom:22 }}/>
            <h2 style={{ fontSize:34, fontWeight:800, color:'var(--text-primary)', marginBottom:10 }}>
              {isRtl ? `أهلاً، ${welcome.user_name} 👋` : `Welcome, ${welcome.user_name} 👋`}
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:19 }}>
              {isRtl ? 'جاري تحميل لوحة التحكم...' : 'Loading your dashboard...'}
            </p>
          </div>
        </div>
      )}

      <div style={{ width:'100%', maxWidth:460, animation:'fadeUp 0.5s ease' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <UniBusLogo size={110} color="auto" style={{ margin:'0 auto 14px', filter:'drop-shadow(0 4px 16px rgba(30,107,212,0.35))' }} />
          <p style={{ color:'var(--text-muted)', fontSize:17 }}>{t('login_subtitle')}</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', background:'var(--surface)', borderRadius:12, padding:6, marginBottom:20, border:'1px solid var(--border)' }}>
          {[
            { key:'login',    label: isRtl ? 'تسجيل الدخول' : 'Sign In',      icon:<LogIn size={18}/> },
            { key:'register', label: isRtl ? 'إنشاء حساب'   : 'Create Account', icon:<UserPlus size={18}/> },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setView(tab.key); setLoginErr(''); setRegErr('') }}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 0', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:17, fontWeight:600, transition:'all 0.2s',
                background: view === tab.key ? 'var(--calm)' : 'transparent',
                color:      view === tab.key ? 'white' : 'var(--text-muted)',
                boxShadow:  view === tab.key ? '0 2px 12px rgba(30,107,212,0.35)' : 'none',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding:28 }}>

          {/* ══ LOGIN ══ */}
          {view === 'login' && (
            <>
              <h2 style={{ fontSize:19, fontWeight:700, marginBottom:4 }}>
                {isRtl ? 'مرحباً بعودتك' : 'Welcome back'}
              </h2>
              <p style={{ color:'var(--text-muted)', fontSize:16, marginBottom:24 }}>
                {isRtl ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue'}
              </p>

              {loginErr && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'11px 14px', marginBottom:18, fontSize:16, color:'var(--red-light)' }}>{loginErr}</div>}

              <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">{t('email_label')}</label>
                  <input type="email" className="form-input" placeholder="example@university.edu"
                    value={loginForm.email} onChange={e => setLoginForm({...loginForm, email:e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('password_label')}</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} className="form-input" placeholder="••••••••"
                      value={loginForm.password} onChange={e => setLoginForm({...loginForm, password:e.target.value})}
                      style={pwStyle} required/>
                    {eyeBtn(showPw, () => setShowPw(!showPw))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%', marginTop:4 }}>
                  {loading
                    ? <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                    : <><LogIn size={20}/> {isRtl ? 'دخول' : 'Sign In'}</>}
                </button>
              </form>

              <p style={{ textAlign:'center', marginTop:18, fontSize:16, color:'var(--text-muted)' }}>
                {isRtl ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                <button onClick={() => setView('register')} style={{ background:'none', border:'none', color:'var(--matcha)', cursor:'pointer', fontWeight:600, fontSize:16, padding:0 }}>
                  {isRtl ? 'أنشئ حساباً' : 'Create one'}
                </button>
              </p>
            </>
          )}

          {/* ══ REGISTER ══ */}
          {view === 'register' && (
            <>
              <h2 style={{ fontSize:19, fontWeight:700, marginBottom:4 }}>
                {isRtl ? 'إنشاء حساب جديد' : 'Create a new account'}
              </h2>
              <p style={{ color:'var(--text-muted)', fontSize:16, marginBottom:24 }}>
                {isRtl ? 'أدخل بياناتك لإنشاء حسابك' : 'Fill in your details to get started'}
              </p>

              {regErr && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'11px 14px', marginBottom:18, fontSize:16, color:'var(--red-light)' }}>{regErr}</div>}

              <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input type="text" className="form-input" placeholder={isRtl ? 'محمد أحمد' : 'John Smith'}
                    value={regForm.name} onChange={e => setRegForm({...regForm, name:e.target.value})} required/>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('email_label')}</label>
                  <input type="email" className="form-input" placeholder="example@university.edu"
                    value={regForm.email} onChange={e => setRegForm({...regForm, email:e.target.value})} required/>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'نوع الحساب' : 'Account Type'}</label>
                  <select className="form-input" value={regForm.role} onChange={e => setRegForm({...regForm, role:e.target.value})}
                    style={{ appearance:'none', cursor:'pointer' }}>
                    {ROLES_AR.map(r => (
                      <option key={r} value={r}>{ROLES_LABEL[r][isRtl?'ar':'en']}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('password_label')}</label>
                  <div style={{ position:'relative' }}>
                    <input type={showRegPw?'text':'password'} className="form-input" placeholder="••••••••"
                      value={regForm.password} onChange={e => setRegForm({...regForm, password:e.target.value})}
                      style={pwStyle} required minLength={6}/>
                    {eyeBtn(showRegPw, () => setShowRegPw(!showRegPw))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                  <div style={{ position:'relative' }}>
                    <input type={showRegCon?'text':'password'} className="form-input" placeholder="••••••••"
                      value={regForm.confirm} onChange={e => setRegForm({...regForm, confirm:e.target.value})}
                      style={pwStyle} required/>
                    {eyeBtn(showRegCon, () => setShowRegCon(!showRegCon))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:4 }}>
                  <UserPlus size={20}/> {isRtl ? 'إنشاء الحساب' : 'Create Account'}
                </button>
              </form>

              <p style={{ textAlign:'center', marginTop:18, fontSize:16, color:'var(--text-muted)' }}>
                {isRtl ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <button onClick={() => setView('login')} style={{ background:'none', border:'none', color:'var(--matcha)', cursor:'pointer', fontWeight:600, fontSize:16, padding:0 }}>
                  {isRtl ? 'سجّل دخولك' : 'Sign in'}
                </button>
              </p>
            </>
          )}

        </div>

        <p style={{ textAlign:'center', marginTop:18, fontSize:15, color:'var(--text-muted)' }}>
          {t('copyright')}
        </p>
      </div>
    </div>
  )
}
