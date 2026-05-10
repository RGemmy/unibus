import React from 'react'
import { Link } from 'react-router-dom'
import { Bus, Calendar, User, Plus, Layers, DollarSign, Route, MapPin, BookOpen, CreditCard, Users, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useApi } from '../../hooks/useApi'
import { getBuses, getTrips, getDrivers, getStudents } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const colorMap = {
  blue:  { bg:'rgba(38,101,140,0.12)',  border:'rgba(38,101,140,0.25)',  icon:'var(--evergreen)' },
  teal:  { bg:'rgba(84,172,191,0.12)',  border:'rgba(84,172,191,0.25)',  icon:'var(--calm)'      },
  green: { bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  icon:'#34d399'           },
  amber: { bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  icon:'var(--amber)'      },
  red:   { bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   icon:'#f87171'           },
}

export default function BusModHome() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const { data: buses }    = useApi(getBuses)
  const { data: trips }    = useApi(getTrips)
  const { data: drivers }  = useApi(getDrivers)
  const { data: students } = useApi(getStudents)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening')

  const statCards = [
    { label: t('total_buses'),    value: (buses||[]).length,                                 icon: Bus,         color: 'blue'  },
    { label: t('trips'),          value: (trips||[]).length,                                 icon: Calendar,    color: 'teal'  },
    { label: t('drivers'),        value: (drivers||[]).length,                               icon: User,        color: 'amber' },
    { label: t('total_students'), value: (students||[]).length,                              icon: Users,       color: 'green' },
    { label: t('status_active'),  value: (buses||[]).filter(b=>b.status==='active').length,  icon: CheckCircle, color: 'green' },
  ]

  const links = [
    { to:'/bus-mod/buses',        icon: Bus,        label: t('buses'),                                desc: lang==='ar'?'إدارة الأسطول':'Manage fleet',               color:'blue'  },
    { to:'/bus-mod/trips',        icon: Calendar,   label: t('trips'),                                desc: lang==='ar'?'إدارة الرحلات':'Manage trips',               color:'teal'  },
    { to:'/bus-mod/routes',       icon: Route,      label: t('routes'),                               desc: lang==='ar'?'إدارة المسارات':'Manage routes',             color:'green' },
    { to:'/bus-mod/places',       icon: MapPin,      label: t('places'),                              desc: lang==='ar'?'إدارة الأماكن':'Manage places',              color:'amber' },
    { to:'/bus-mod/drivers',      icon: User,        label: t('drivers'),                             desc: lang==='ar'?'إدارة السائقين':'Manage drivers',            color:'blue'  },
    { to:'/bus-mod/reservations', icon: BookOpen,    label: t('reservations'),                        desc: lang==='ar'?'متابعة الحجوزات':'Track reservations',       color:'teal'  },
    { to:'/bus-mod/payments',     icon: CreditCard,  label: t('payments'),                            desc: lang==='ar'?'العمليات المالية':'Financial operations',     color:'green' },
    { to:'/bus-mod/layout',       icon: Layers,      label: lang==='ar'?'ترتيب المقاعد':'Seat Layout',desc: lang==='ar'?'تحديد عدد المقاعد':'Set seat counts',        color:'amber' },
    { to:'/bus-mod/plans',        icon: DollarSign,  label: lang==='ar'?'باقات الاشتراك':'Sub Plans', desc: lang==='ar'?'إدارة الباقات':'Manage plans',               color:'blue'  },
  ]

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{greeting}، {user?.user_name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'var(--text-muted)', fontSize:17 }}>{t('bus_mod_desc')}</p>
        <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', background:'rgba(38,101,140,0.12)', borderRadius:20, fontSize:14, color:'var(--text-primary)' }}>
          <Plus size={15}/> {lang==='ar'?'صلاحيات الإضافة والتعديل':'Add & Edit permissions'}
        </div>
      </div>

      {/* Stat cards — 4 per row desktop, 2 mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap:14, marginBottom:28 }}>
        {statCards.map(({ label, value, icon:Icon, color }) => {
          const c = colorMap[color]
          return (
            <div key={label} className="card" style={{ padding:'18px 16px' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <Icon size={24} color={c.icon}/>
              </div>
              <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', lineHeight:1, marginBottom:5 }}>{value ?? '—'}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
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
