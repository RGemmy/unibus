import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Bus, User, Route, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useApi } from '../../hooks/useApi'
import { getTrips, getStudents, getBuses, getDrivers } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const colorMap = {
  blue:  { bg:'rgba(38,101,140,0.12)',  border:'rgba(38,101,140,0.25)',  icon:'var(--evergreen)' },
  teal:  { bg:'rgba(84,172,191,0.12)',  border:'rgba(84,172,191,0.25)',  icon:'var(--calm)'      },
  green: { bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  icon:'#34d399'           },
  amber: { bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  icon:'var(--amber)'      },
}

export default function UniModHome() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { data: trips,    loading: tl } = useApi(getTrips)
  const { data: students, loading: sl } = useApi(getStudents)
  const { data: buses,    loading: bl } = useApi(getBuses)
  const { data: drivers,  loading: dl } = useApi(getDrivers)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening')

  const statCards = [
    { label: t('total_trips'),    value: (trips||[]).length,    icon: Calendar, color: 'blue',  loading: tl },
    { label: t('total_students'), value: (students||[]).length, icon: Users,    color: 'teal',  loading: sl },
    { label: t('total_buses'),    value: (buses||[]).length,    icon: Bus,      color: 'amber', loading: bl },
    { label: t('drivers'),        value: (drivers||[]).length,  icon: User,     color: 'green', loading: dl },
  ]

  const links = [
    { to:'/uni-mod/trips',        icon: Calendar, label: t('trips'),    desc: lang==='ar'?'عرض جميع الرحلات':'View all trips',   color:'blue'  },
    { to:'/uni-mod/students',     icon: Users,    label: t('students'), desc: lang==='ar'?'بيانات الطلاب':'Student records',      color:'teal'  },
    { to:'/uni-mod/buses',        icon: Bus,      label: t('buses'),    desc: lang==='ar'?'عرض الباصات':'View buses',             color:'amber' },
    { to:'/uni-mod/drivers',      icon: User,     label: t('drivers'),  desc: lang==='ar'?'عرض السائقين':'View drivers',          color:'green' },
    { to:'/uni-mod/users',        icon: Users,    label: t('users'),    desc: lang==='ar'?'عرض المستخدمين':'View users',          color:'blue'  },
    { to:'/uni-mod/routes',       icon: Route,    label: t('routes'),   desc: lang==='ar'?'عرض المسارات':'View routes',           color:'teal'  },
    { to:'/uni-mod/reservations', icon: BookOpen, label: t('reservations'), desc: lang==='ar'?'متابعة الحجوزات':'Track reservations', color:'amber' },
  ]

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{greeting}، {user?.user_name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'var(--text-muted)', fontSize:17 }}>{t('uni_mod_desc')}</p>
      </div>

      {/* Stat cards — 4 per row desktop, 2 mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap:14, marginBottom:28 }}>
        {statCards.map(({ label, value, icon:Icon, color, loading }) => {
          const c = colorMap[color]
          return (
            <div key={label} className="card" style={{ padding:'18px 16px' }}>
              {loading
                ? <div className="skeleton" style={{ height:80, borderRadius:8 }}/>
                : <>
                    <div style={{ width:44, height:44, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                      <Icon size={24} color={c.icon}/>
                    </div>
                    <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', lineHeight:1, marginBottom:5 }}>{value ?? '—'}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
                  </>
              }
            </div>
          )
        })}
      </div>

      {/* Quick links — 4 per row desktop, 2 mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap:14 }}>
        {links.map(({ to, icon:Icon, label, desc, color }) => {
          const c = colorMap[color]
          return (
            <Link key={to} to={to} style={{ textDecoration:'none' }}>
              <div className="card card-clickable" style={{ padding:18 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <Icon size={24} color={c.icon}/>
                </div>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:4, color:'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize:15, color:'var(--text-muted)' }}>{desc}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
