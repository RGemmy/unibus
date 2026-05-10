import React, { useState, useRef, useEffect } from 'react'
import { useLocation, NavLink } from 'react-router-dom'
import { Bell, Search, X, CheckCheck, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

const roleGradients = {
  admin:          'linear-gradient(135deg,#26658C,#54ACBF)',
  moderator:      'linear-gradient(135deg,#26658C,#54ACBF)',
  university_mod: 'linear-gradient(135deg,#1E5278,#54ACBF)',
  bus_mod:        'linear-gradient(135deg,#54ACBF,#A7EBF2)',
  student:        'linear-gradient(135deg,#26658C,#54ACBF)',
  driver:         'linear-gradient(135deg,#1E5278,#54ACBF)',
}
const typeIcon = { info:'📌', success:'✅', warning:'⚠️', error:'❌' }

export default function Header({ isMobile = false }) {
  const { user, role }                        = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const { t, lang, switchLang }               = useLanguage()
  const { theme, toggleTheme }                = useTheme()
  const location                              = useLocation()
  const [showNotif, setShowNotif]             = useState(false)
  const [search,    setSearch]                = useState('')
  const notifRef = useRef(null)

  // Dynamic page titles based on current lang
  const pageTitles = {
    '/dashboard':               { title: t('dashboard'),        sub: lang==='ar'?'نظرة عامة على النظام':'System overview' },
    '/trips':                   { title: t('trips'),            sub: lang==='ar'?'إدارة وجدولة رحلات الباصات':'Manage and schedule bus trips' },
    '/routes':                  { title: t('routes'),           sub: lang==='ar'?'إدارة مسارات الخطوط':'Manage route lines' },
    '/buses':                   { title: t('buses'),            sub: lang==='ar'?'إدارة أسطول الباصات':'Manage bus fleet' },
    '/students':                { title: t('students'),         sub: lang==='ar'?'إدارة بيانات الطلاب':'Manage student records' },
    '/reservations':            { title: t('reservations'),     sub: lang==='ar'?'متابعة وإدارة الحجوزات':'Track and manage reservations' },
    '/payments':                { title: t('payments'),         sub: lang==='ar'?'إدارة العمليات المالية':'Manage financial operations' },
    '/subscriptions':           { title: t('subscriptions'),    sub: lang==='ar'?'إدارة اشتراكات الطلاب':'Manage student subscriptions' },
    '/drivers':                 { title: t('drivers'),          sub: lang==='ar'?'إدارة بيانات السائقين':'Manage driver records' },
    '/users':                   { title: t('users'),            sub: lang==='ar'?'إدارة حسابات المستخدمين':'Manage user accounts' },
    '/universities':            { title: t('universities'),     sub: lang==='ar'?'إدارة الجامعات المشتركة':'Manage partner universities' },
    '/places':                  { title: t('places'),           sub: lang==='ar'?'إدارة نقاط الوصول':'Manage access points' },
    '/profile':                 { title: t('profile'),          sub: lang==='ar'?'بياناتك الشخصية':'Your personal information' },
    '/settings':                { title: t('settings'),         sub: lang==='ar'?'إعدادات التطبيق':'App settings' },
    '/mod':                     { title: t('mod_dashboard'),    sub: lang==='ar'?'نظرة عامة':'Overview' },
    '/mod/trips':               { title: t('trips'),            sub: lang==='ar'?'متابعة وإدارة الرحلات':'Track and manage trips' },
    '/mod/reservations':        { title: t('reservations'),     sub: lang==='ar'?'مراجعة وتأكيد الحجوزات':'Review and confirm reservations' },
    '/mod/students':            { title: t('students'),         sub: lang==='ar'?'عرض بيانات الطلاب':'View student records' },
    '/mod/buses':               { title: t('buses'),            sub: lang==='ar'?'عرض الأسطول':'View fleet' },
    '/student':                 { title: t('home'),             sub: lang==='ar'?'مرحباً بك في UniBus':'Welcome to UniBus' },
    '/student/trips':           { title: t('available_trips'),  sub: lang==='ar'?'اختر رحلتك واحجز مقعدك':'Choose your trip and book your seat' },
    '/student/my-reservations': { title: t('my_reservations'),  sub: lang==='ar'?'رحلاتك المحجوزة':'Your booked trips' },
    '/student/track':           { title: t('track_bus'),        sub: lang==='ar'?'موقع باصك الحالي':'Your bus current location' },
    '/student/subscription':    { title: t('my_subscription'),  sub: lang==='ar'?'تفاصيل اشتراكك':'Your subscription details' },
    '/driver':                  { title: t('home'),             sub: lang==='ar'?'رحلاتك اليوم':'Your trips today' },
    '/driver/trips':            { title: t('trips'),            sub: lang==='ar'?'الرحلات المعينة لك':'Assigned trips' },
    '/driver/active':           { title: t('active_trip'),      sub: lang==='ar'?'تحكم في GPS وإدارة رحلتك':'GPS control and trip management' },
  }

  const page   = pageTitles[location.pathname] || { title: 'UniBus', sub: '' }
  const isRtl  = lang === 'ar'

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <header style={{
      height: isMobile ? 56 : 64,
      background:'var(--navy)', backdropFilter:'blur(12px)',
      borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center',
      padding: isMobile ? '0 14px' : '0 24px',
      gap: isMobile ? 10 : 16,
      position:'sticky', top:0, zIndex:50,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 18, fontWeight:700, lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{page.title}</h1>
        {!isMobile && <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{page.sub}</p>}
      </div>

      {/* Search — hidden on mobile */}
      {!isMobile && (
        <div style={{ position:'relative', maxWidth:260, width:'100%' }}>
          <Search size={18} style={{ position:'absolute', [isRtl?'right':'left']:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
          <input
            type="text" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontFamily:'var(--font)', fontSize:18, padding: isRtl ? '8px 38px 8px 14px' : '8px 14px 8px 38px', outline:'none', transition:'all 0.2s' }}
            onFocus={e => { e.target.style.borderColor='var(--calm)'; e.target.style.background='rgba(30,107,212,0.05)' }}
            onBlur={e  => { e.target.style.borderColor='var(--border)'; e.target.style.background='var(--surface)' }}
          />
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', cursor:'pointer', padding: isMobile ? '5px 8px' : '6px 10px', fontSize:isMobile?17:19, transition:'all 0.2s', lineHeight:1 }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Language quick toggle */}
      <button
        onClick={() => switchLang(lang === 'ar' ? 'en' : 'ar')}
        style={{ display:'flex', alignItems:'center', gap:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', cursor:'pointer', padding: isMobile ? '5px 8px' : '6px 10px', fontSize:14, fontWeight:600, transition:'all 0.2s', whiteSpace:'nowrap' }}
        title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
      >
        <Globe size={15}/>
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position:'relative' }}>
        <button
          onClick={() => { setShowNotif(!showNotif); if (!showNotif && unreadCount > 0) markAllRead() }}
          style={{ position:'relative', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', cursor:'pointer', padding: isMobile ? 7 : 10, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
        >
          <Bell size={isMobile ? 20 : 26}/>
          {unreadCount > 0 && (
            <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--amber)', color:'var(--navy)', fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--navy)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <div style={{
            position:'absolute', top:'calc(100% + 10px)',
            [isRtl?'left':'right']:0,
            width: isMobile ? 'calc(100vw - 28px)' : 320,
            background:'var(--navy-2)', border:'1px solid var(--border)',
            borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,0.5)',
            animation:'fadeUp 0.2s ease', zIndex:1000, overflow:'hidden',
          }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, fontSize:19 }}>{t('notifications')}</span>
              <div style={{ display:'flex', gap:8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background:'none', border:'none', color:'var(--matcha)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', gap:4 }}>
                    <CheckCheck size={13}/> {t('mark_all_read')}
                  </button>
                )}
                <button onClick={() => setShowNotif(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  <X size={18}/>
                </button>
              </div>
            </div>
            <div style={{ maxHeight:340, overflowY:'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding:'30px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:16 }}>
                  <Bell size={32} style={{ opacity:0.3, marginBottom:10 }}/><br/>{t('no_notifications')}
                </div>
              ) : notifications.slice(0,15).map(n => (
                <div key={n.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(142,164,139,0.06)', background: n.is_read ? 'transparent' : 'rgba(114,138,110,0.08)' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{typeIcon[n.type]||'📌'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:18, color:'var(--text-primary)', fontWeight: n.is_read ? 400 : 600 }}>
                        {lang === 'ar' ? (n.message_ar || n.message) : (n.message_en || n.message)}
                      </div>
                      <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : ''}
                      </div>
                    </div>
                    {!n.is_read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--calm)', flexShrink:0, marginTop:4 }}/>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar → Profile */}
      <NavLink to="/profile" style={{ display:'block', textDecoration:'none' }}>
        <div
          style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius:9, background:roleGradients[role]||roleGradients.admin, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, border:'2px solid transparent', transition:'border-color 0.2s' }}
          title={t('profile')}
        >
          <span style={{ fontSize: isMobile ? 16 : 19, fontWeight:700, color:'white' }}>{user?.user_name?.[0]||'م'}</span>
        </div>
      </NavLink>
    </header>
  )
}
