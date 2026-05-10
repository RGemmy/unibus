import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Globe, Check, Trash2, AlertTriangle, Sun, Moon, LogOut } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

export default function SettingsPage() {
  const isMobile = useIsMobile()
  const { lang, switchLang, t } = useLanguage()
  const { clearNotifications }   = useNotifications()
  const { logout }               = useAuth()
  const { theme, toggleTheme }   = useTheme()
  const [cleared, setCleared]    = useState(false)

  const languages = [
    { code:'ar', label:'العربية', flag:'🇸🇦', dir:'RTL' },
    { code:'en', label:'English', flag:'🇺🇸', dir:'LTR' },
  ]

  const handleClearData = () => {
    if (!confirm(lang==='ar'?'سيتم مسح جميع البيانات المحلية (الرحلات، الحجوزات، الباصات، الإشعارات). هل تريد المتابعة؟':'This will clear all local data (trips, reservations, buses, notifications). Continue?')) return
    // Clear all mock data keys
    const keysToRemove = Object.keys(localStorage).filter(k =>
      k.startsWith('mock_') || k.startsWith('notifications_') || k === 'demoDB' || k.startsWith('gps_')
    )
    keysToRemove.forEach(k => localStorage.removeItem(k))
    clearNotifications()
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:700, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{t('settings')}</h1>
        <p style={{ color:'var(--text-muted)', fontSize:17 }}>
          {lang==='ar'?'تخصيص إعدادات البرنامج':'Customize app settings'}
        </p>
      </div>

      {/* ── Language + Theme compact toggles ── */}
      <div className="card" style={{ padding:20, marginBottom:20 }}>
        {/* Language row */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            <Globe size={14} color="var(--matcha)"/>
            {lang==='ar' ? 'اللغة' : 'Language'}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {languages.map(l => (
              <button key={l.code} onClick={() => switchLang(l.code)}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px', borderRadius:10, cursor:'pointer',
                  border: lang===l.code ? '2px solid var(--calm)' : '2px solid var(--border)',
                  background: lang===l.code ? 'rgba(30,107,212,0.10)' : 'var(--surface)',
                  transition:'all 0.2s',
                }}>
                <span style={{ fontSize:20 }}>{l.flag}</span>
                <span style={{ fontSize:15, fontWeight:700, color: lang===l.code ? 'var(--calm)' : 'var(--text-primary)' }}>{l.label}</span>
                {lang===l.code && (
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--calm)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={12} color="white"/>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'var(--border)', marginBottom:16 }}/>

        {/* Theme row */}
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            {theme === 'light' ? <Sun size={14} color="var(--amber)"/> : <Moon size={14} color="var(--matcha)"/>}
            {lang==='ar' ? 'المظهر' : 'Appearance'}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[
              { mode:'light', label: lang==='ar' ? 'فاتح' : 'Light', icon: <Sun size={18} color="#f59e0b"/> },
              { mode:'dark',  label: lang==='ar' ? 'داكن' : 'Dark',  icon: <Moon size={18} color="var(--matcha)"/> },
            ].map(({ mode, label, icon }) => (
              <button key={mode} onClick={() => theme !== mode && toggleTheme()}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px', borderRadius:10, cursor:'pointer',
                  border: theme===mode ? '2px solid var(--calm)' : '2px solid var(--border)',
                  background: theme===mode ? 'rgba(30,107,212,0.10)' : 'var(--surface)',
                  transition:'all 0.2s',
                }}>
                {icon}
                <span style={{ fontSize:15, fontWeight:700, color: theme===mode ? 'var(--calm)' : 'var(--text-primary)' }}>{label}</span>
                {theme===mode && (
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--calm)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={12} color="white"/>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear data */}
      <div className="card" style={{ padding:24, border:'1px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ fontSize:19, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:8, color:'var(--red-light)' }}>
          <Trash2 size={22}/> {lang==='ar'?'مسح البيانات المحلية':'Clear Local Data'}
        </h3>
        <p style={{ color:'var(--text-muted)', fontSize:16, marginBottom:16 }}>
          {lang==='ar'
            ? 'يمسح جميع البيانات المحفوظة محلياً: الرحلات، الحجوزات، الباصات، الإشعارات، وبيانات الحسابات.'
            : 'Clears all locally stored data: trips, reservations, buses, notifications, and account data.'}
        </p>
        <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, marginBottom:16, display:'flex', gap:10 }}>
          <AlertTriangle size={18} color="var(--red-light)" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:15, color:'var(--red-light)', lineHeight:1.6 }}>
            {lang==='ar'?'هذا الإجراء لا يمكن التراجع عنه. ستحتاج لتسجيل الدخول مرة أخرى.':'This action cannot be undone. You will need to log in again.'}
          </p>
        </div>
        {cleared ? (
          <div style={{ padding:'12px 16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:9, fontSize:16, color:'#34d399', fontWeight:600 }}>
            ✅ {lang==='ar'?'تم مسح البيانات بنجاح':'Data cleared successfully'}
          </div>
        ) : (
          <button className="btn btn-danger" onClick={handleClearData}>
            <Trash2 size={18}/> {lang==='ar'?'مسح جميع البيانات':'Clear All Data'}
          </button>
        )}
      </div>
      {/* Logout */}
      <div className="card" style={{ padding:24, marginTop:20 }}>
        <h3 style={{ fontSize:19, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
          <LogOut size={22} color="var(--matcha)"/>
          {lang==='ar' ? 'تسجيل الخروج' : 'Sign Out'}
        </h3>
        <p style={{ color:'var(--text-muted)', fontSize:16, marginBottom:16 }}>
          {lang==='ar' ? 'سيتم إنهاء جلستك الحالية وستحتاج لتسجيل الدخول مرة أخرى.' : 'Your current session will end and you will need to log in again.'}
        </p>
        <button
          onClick={() => { if (confirm(lang==='ar' ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to sign out?')) logout() }}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 22px', borderRadius:10, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:16, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; e.currentTarget.style.color='var(--red)' }}
          onMouseOut={e  => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-primary)' }}
        >
          <LogOut size={18}/>
          {lang==='ar' ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
