import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Navigation, Bus, Clock, Bell, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { useApi } from '../../hooks/useApi'
import { getTrips, getDrivers } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const statusCfg = {
  active:    { label: { ar:'نشطة',         en:'Active'    }, cls:'badge-green' },
  pending:   { label: { ar:'قيد الانتظار', en:'Pending'   }, cls:'badge-amber' },
  completed: { label: { ar:'مكتملة',       en:'Completed' }, cls:'badge-blue'  },
  cancelled: { label: { ar:'ملغية',        en:'Cancelled' }, cls:'badge-red'   },
}

export default function DriverHome() {
  const isMobile = useIsMobile()
  const { user }  = useAuth()
  const { lang, t } = useLanguage()
  const { notifications, unreadCount } = useNotifications()

  const { data: trips,   loading: tl } = useApi(getTrips)
  const { data: drivers, loading: dl } = useApi(getDrivers)

  // Find the driver record that matches the current logged-in user
  const myDriver = (drivers||[]).find(d =>
    d.user_name === user?.user_name ||
    d.email     === user?.email
  )

  // Filter trips assigned to this driver
  const myTrips = (trips||[]).filter(tr => {
    if (user?.id && tr.driver_userId && String(tr.driver_userId) === String(user.id)) return true
    if (myDriver && Number(tr.driver_id) === Number(myDriver.id)) return true
    return false
  })
  const completedTrips = myTrips.filter(t => t.status === 'completed')

  // رحلات الشهر الحالي — بتعتمد على completed_at اللي بنحطه لما الرحلة تتنهي
  const nowMonth = new Date().getMonth()
  const nowYear  = new Date().getFullYear()
  const monthTrips = completedTrips.filter(t => {
    const dateStr = t.completed_at || t.updated_at || t.trip_date
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === nowMonth && d.getFullYear() === nowYear
  })

  // بس الرحلات اللي لسه ما اتكملتش (active/pending)
  const activeAndPendingTrips = myTrips.filter(t => t.status === 'active' || t.status === 'pending')
  const recentNotifs  = notifications.filter(n => !n.is_read).slice(0, 3)

  const hour = new Date().getHours()
  const greeting = (hour<12 ? t('greeting_morning') : hour<17 ? t('greeting_afternoon') : t('greeting_evening'))

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{greeting}، {user?.user_name?.split(' ')[0]} 🚌</h2>
        <p style={{ color:'var(--text-muted)', fontSize:17, marginTop:4 }}>
          {new Date().toLocaleDateString(lang==='ar'?'ar-SA':'en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* New trip notifications banner */}
      {recentNotifs.length > 0 && (
        <div style={{ marginBottom:20, padding:'14px 18px', background:'rgba(30,107,212,0.08)', border:'1px solid rgba(38,101,140,0.30)', borderRadius:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Bell size={20} color="var(--matcha)"/>
            <span style={{ fontSize:17, fontWeight:700, color:'var(--matcha)' }}>
              {lang==='ar' ? `${recentNotifs.length} إشعار جديد` : `${recentNotifs.length} new notification(s)`}
            </span>
          </div>
          {recentNotifs.map(n => (
            <div key={n.id} style={{ fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, padding:'6px 0', borderTop:'1px solid rgba(38,101,140,0.12)' }}>
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Quick cards — رحلاتي, الإجمالي, رحلات الشهر, ثم ابدأ الرحلة في الآخر */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:24, alignItems:'stretch' }}>

        {/* رحلاتي */}
        <Link to="/driver/trips" style={{ textDecoration:'none', display:'flex' }}>
          <div className="card card-clickable" style={{ padding:22, flex:1, display:'flex', flexDirection:'column' }}>
            <div style={{ width:50, height:50, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <Calendar size={28} color="var(--calm)"/>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>{lang==='ar'?'رحلاتي':'My Trips'}</div>
            <div style={{ fontSize:16, color:'var(--text-primary)', fontWeight:600, marginTop:4 }}>
              {myTrips.length} <span style={{ fontWeight:400, color:'var(--text-muted)' }}>{lang==='ar'?'رحلة مُعيَّنة':'assigned'}</span>
            </div>
          </div>
        </Link>

        {/* إجمالي الرحلات المكتملة */}
        <div className="card" style={{ padding:22, display:'flex', flexDirection:'column' }}>
          <div style={{ width:50, height:50, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <Bus size={28} color="var(--calm)"/>
          </div>
          <div style={{ fontSize:28, fontWeight:900, color:'var(--text-primary)', lineHeight:1 }}>
            {completedTrips.length}
          </div>
          <div style={{ fontSize:15, color:'var(--text-primary)', marginTop:6 }}>
            {lang==='ar'?'إجمالي الرحلات المكتملة':'Total trips completed'}
          </div>
        </div>

        {/* رحلات الشهر — يودي للصفحة المنفصلة */}
        <Link to="/driver/month-trips" style={{ textDecoration:'none', display:'flex' }}>
          <div className="card card-clickable" style={{ padding:22, flex:1, display:'flex', flexDirection:'column' }}>
            <div style={{ width:50, height:50, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <Clock size={28} color="var(--calm)"/>
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:'var(--text-primary)', lineHeight:1 }}>
              {monthTrips.length}
            </div>
            <div style={{ fontSize:15, color:'var(--text-primary)', marginTop:6 }}>
              {lang==='ar'
                ? `رحلات ${new Date().toLocaleDateString('ar-SA',{month:'long'})}`
                : `${new Date().toLocaleDateString('en-GB',{month:'long'})} trips`}
            </div>
          </div>
        </Link>

        {/* ابدأ الرحلة — آخر كارت */}
        <Link to="/driver/active" style={{ textDecoration:'none', display:'flex' }}>
          <div className="card card-clickable" style={{ padding:22, flex:1, display:'flex', flexDirection:'column' }}>
            <div style={{ width:50, height:50, borderRadius:12, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <Navigation size={28} color="#34d399"/>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>
              {lang==='ar'?'ابدأ الرحلة':'Start Trip'} <span style={{ color:'#34d399' }}>🟢</span>
            </div>
            <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:4 }}>
              {lang==='ar'?'تحكم في GPS وإدارة رحلتك':'Control GPS & manage trip'}
            </div>
          </div>
        </Link>
      </div>

      {/* My assigned trips */}
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>
          {lang==='ar'?'رحلاتي اليوم والقادمة':'My upcoming trips'}
        </h3>

        {(tl || dl) && Array(2).fill(0).map((_,i) =>
          <div key={i} className="skeleton" style={{ height:70, borderRadius:10, marginBottom:8 }}/>
        )}

        {!tl && !dl && activeAndPendingTrips.length === 0 && (
          <div style={{ textAlign:'center', padding:'30px 20px', color:'var(--text-muted)' }}>
            <Bus size={36} style={{ opacity:0.25, marginBottom:10 }}/>
            <p style={{ fontSize:16 }}>
              {lang==='ar'?'لا توجد رحلات مُعيَّنة لك حالياً':'No trips assigned to you yet'}
            </p>
            <p style={{ fontSize:15, marginTop:6 }}>
              {lang==='ar'?'ستصلك إشعارات عند تعيينك لرحلة جديدة':'You will receive a notification when assigned a new trip'}
            </p>
          </div>
        )}

        {!tl && !dl && activeAndPendingTrips.slice(0, 5).map(tr => (
          <div key={tr.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Bus size={22} color="var(--matcha)"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:17, fontWeight:600 }}>
                {lang==='en' ? (tr.place_name_en || tr.place_name) : tr.place_name}
              </div>
              <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2, display:'flex', gap:10 }}>
                <span><Clock size={14} style={{ verticalAlign:'middle' }}/> {tr.schedule_time}</span>
                <span><MapPin size={14} style={{ verticalAlign:'middle' }}/> {tr.trip_date}</span>
                <span>🚌 {lang==='en'?(tr.bus_plate_en||tr.bus_plate):tr.bus_plate}</span>
              </div>
            </div>
            <span className={`badge ${statusCfg[tr.status]?.cls}`}>
              {statusCfg[tr.status]?.label[lang==='en'?'en':'ar']}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
