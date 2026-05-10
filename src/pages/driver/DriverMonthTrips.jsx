import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bus, Clock, Users, MapPin, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { useApi } from '../../hooks/useApi'
import { getTrips, getDrivers } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function DriverMonthTrips() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { lang } = useLanguage()

  const { data: trips,   loading: tl } = useApi(getTrips)
  const { data: drivers, loading: dl } = useApi(getDrivers)

  // المتصفح للشهور — نبدأ بالشهر الحالي
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-based

  const myDriver = (drivers||[]).find(d =>
    d.user_name === user?.user_name ||
    d.user_id   === user?.id ||
    d.email     === user?.email
  )

  const myTrips = (trips||[]).filter(tr =>
    myDriver && Number(tr.driver_id) === Number(myDriver.id)
  )

  const monthTrips = myTrips.filter(t => {
    if (t.status !== 'completed') return false
    const dateStr = t.completed_at || t.updated_at || t.trip_date
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear
  })

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    lang==='ar' ? 'ar-SA' : 'en-GB', { month:'long', year:'numeric' }
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    // لا نسمح بالتنقل لشهور في المستقبل
    const isCurrentOrFuture = viewYear > now.getFullYear() ||
      (viewYear === now.getFullYear() && viewMonth >= now.getMonth())
    if (isCurrentOrFuture) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const loading = tl || dl
  const isRtl = lang === 'ar'
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft  : ChevronRight

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>
          {lang==='ar' ? 'رحلات الشهر' : 'Monthly Trips'}
        </h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
          {lang==='ar' ? 'سجل رحلاتك المكتملة شهرًا بشهر' : 'Your completed trips month by month'}
        </p>
      </div>

      {/* Month navigator */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20,
        padding:'14px 20px', borderRadius:14, background:'var(--surface)', border:'1px solid var(--border)' }}>
        <button onClick={prevMonth}
          style={{ width:38, height:38, borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <PrevIcon size={20} color="var(--text-primary)"/>
        </button>

        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{monthName}</div>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>
            {monthTrips.length} {lang==='ar' ? 'رحلة مكتملة' : 'completed trips'}
          </div>
        </div>

        <button onClick={nextMonth}
          style={{ width:38, height:38, borderRadius:10, border:'1px solid var(--border)', background:'var(--bg)',
            cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
            opacity: isCurrentMonth ? 0.3 : 1,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <NextIcon size={20} color="var(--text-primary)"/>
        </button>
      </div>

      {/* Trips list */}
      {loading && Array(3).fill(0).map((_,i) =>
        <div key={i} className="skeleton" style={{ height:110, borderRadius:14, marginBottom:12 }}/>
      )}

      {!loading && monthTrips.length === 0 && (
        <EmptyState
          icon={Bus}
          message={lang==='ar'
            ? `لا توجد رحلات مكتملة في ${monthName}`
            : `No completed trips in ${monthName}`}
        />
      )}

      {!loading && monthTrips.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {monthTrips.map((trip, i) => (
            <div key={trip.id} className="card" style={{ padding:20, animation:`fadeUp ${0.08+i*0.04}s ease` }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <CheckCircle size={24} color="var(--calm)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>
                    {lang==='en' ? (trip.place_name_en || trip.place_name) : trip.place_name}
                  </div>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:14, color:'var(--text-muted)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Clock size={14}/> {trip.schedule_time}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <MapPin size={14}/> {trip.trip_date}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Bus size={14}/>
                      {lang==='en' ? (trip.bus_plate_en || trip.bus_plate) : trip.bus_plate}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Users size={14}/>
                      {trip.bus_capacity - (trip.available_seats||0)} {lang==='ar'?'راكب':'passengers'}
                    </span>
                  </div>
                  {trip.completed_at && (
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
                      ✅ {lang==='ar'?'اكتملت:':'Completed:'} {new Date(trip.completed_at).toLocaleString(lang==='ar'?'ar-SA':'en-GB')}
                    </div>
                  )}
                </div>
                <span className="badge badge-blue">
                  {lang==='ar'?'مكتملة':'Completed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
