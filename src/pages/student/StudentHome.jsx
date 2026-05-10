import React from 'react'
import { Link } from 'react-router-dom'
import { Bus, BookOpen, Navigation, Shield, Clock, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useApi } from '../../hooks/useApi'
import { getMyReservations, getSubscriptions } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function StudentHome() {
  const isMobile = useIsMobile()
  const { user }    = useAuth()
  const { t, lang } = useLanguage()
  const { data: reservations } = useApi(getMyReservations)
  const { data: subs }         = useApi(getSubscriptions)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening')
  const activeSub   = (subs||[]).find(s => s.status === 'active')
  const upcomingRes = (reservations||[]).filter(r => r.status === 'confirmed').slice(0, 3)

  const dateStr = new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : 'en-US',
    { weekday:'long', year:'numeric', month:'long', day:'numeric' }
  )

  const quickCards = [
    { to:'/student/trips',           icon:Bus,        label:t('book_seat'),        sub:t('available_trips'),                          color:'blue'  },
    { to:'/student/my-reservations', icon:BookOpen,   label:t('my_reservations'),  sub:`${(reservations||[]).length} ${lang==='ar'?'حجز':'bookings'}`, color:'teal'  },
    { to:'/student/track',           icon:Navigation, label:t('track_bus'),        sub:lang==='ar'?'اعرف موقع باصك':'Know your bus location', color:'green' },
    { to:'/student/subscription',    icon:Shield,     label:t('my_subscription'),  sub:activeSub ? t('subscription_active') : t('no_active_subscription'), color:activeSub?'green':'amber' },
  ]

  const colorMap = {
    blue:  { bg:'rgba(114,138,110,0.12)', border:'rgba(114,138,110,0.25)', icon:'var(--matcha)' },
    teal:  { bg:'rgba(38,101,140,0.12)', border:'rgba(38,101,140,0.25)', icon:'var(--evergreen)' },
    green: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', icon:'#34d399'           },
    amber: { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', icon:'var(--amber)'      },
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{greeting}، {user?.user_name?.split(' ')[0]} 👋</h2>
        <p style={{ color:'var(--text-muted)', fontSize:17, marginTop:4 }}>{dateStr}</p>
      </div>

      {/* Subscription banner — only shown when student has active subscription */}
      {activeSub && (
        <div style={{ padding:'16px 20px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, marginBottom:24, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Shield size={24} color="#34d399"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'#34d399' }}>{t('subscription_active')} ✅</div>
            <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2 }}>
              {lang==='ar'?'باقة':'Plan'} {activeSub.plan} · {lang==='ar'?'ينتهي':'Expires'} {activeSub.end_date}
            </div>
          </div>
          <Link to="/student/subscription" className="btn btn-sm" style={{ background:'rgba(16,185,129,0.2)', color:'#34d399', border:'1px solid rgba(16,185,129,0.3)', textDecoration:'none' }}>
            {t('subscription_details')}
          </Link>
        </div>
      )}

      {/* Quick cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:28 }}>
        {quickCards.map(({ to, icon:Icon, label, sub, color }) => {
          const c = colorMap[color]
          return (
            <Link key={to} to={to} style={{ textDecoration:'none' }}>
              <div className="card card-clickable" style={{ padding:20 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <Icon size={26} color={c.icon}/>
                </div>
                <div style={{ fontSize:18, fontWeight:700 }}>{label}</div>
                <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Upcoming reservations */}
      {upcomingRes.length > 0 && (
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:19, fontWeight:700 }}>{lang==='ar'?'رحلاتك القادمة':'Upcoming Trips'}</h3>
            <Link to="/student/my-reservations" style={{ fontSize:15, color:'var(--matcha)', textDecoration:'none' }}>
              {lang==='ar'?'عرض الكل':'View all'}
            </Link>
          </div>
          {upcomingRes.map(r=>(
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Bus size={22} color="var(--matcha)"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:600 }}>{r.trip_place}</div>
                <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2, display:'flex', gap:10 }}>
                  <span><Clock size={14} style={{ verticalAlign:'middle' }}/> {r.schedule_time}</span>
                  <span><MapPin size={14} style={{ verticalAlign:'middle' }}/> {r.trip_date}</span>
                </div>
              </div>
              <span className="badge badge-green">{t('status_confirmed')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
