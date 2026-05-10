import React from 'react'
import { Link } from 'react-router-dom'
import { Bus, MapPin, Clock, Navigation, Users, CalendarCheck } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { useApi } from '../../hooks/useApi'
import { getTrips, getDrivers } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const statusCfg = {
  active:      { ar:'نشطة',           en:'Active',      cls:'badge-green' },
  in_progress: { ar:'جارية',          en:'In Progress', cls:'badge-green' },
  full:        { ar:'مكتملة المقاعد', en:'Full',        cls:'badge-blue'  },
  completed:   { ar:'انتهت',          en:'Ended',       cls:'badge-blue'  },
  pending:     { ar:'قيد الانتظار',   en:'Pending',     cls:'badge-amber' },
  cancelled:   { ar:'ملغية',          en:'Cancelled',   cls:'badge-red'   },
}

export default function DriverTrips() {
  const isMobile = useIsMobile()
  const { user }  = useAuth()
  const { lang }  = useLanguage()

  const { data: trips,   loading: tl } = useApi(getTrips)
  const { data: drivers, loading: dl } = useApi(getDrivers)

  const myDriver = (drivers||[]).find(d =>
    d.user_name === user?.user_name ||
    d.user_id   === user?.id ||
    d.email     === user?.email
  )

  // الرحلات المُعيَّنة — بس اللي لسه ما اتكملتش
  // الرحلات ذهاب وعودة تظهر كـ رحلتين منفصلتين
  const myTrips = (trips||[])
    .filter(tr =>
      myDriver &&
      Number(tr.driver_id) === Number(myDriver.id) &&
      tr.status !== 'completed' &&
    tr.status !== 'cancelled'
    )
    .flatMap(tr => {
      if (tr.trip_type !== 'round') return [tr]
      return [
        { ...tr, _leg:'go',     schedule_time: tr.go_time     || tr.schedule_time, _legLabel: lang==='ar'?'ذهاب':'Go',     _legColor:'#34d399' },
        { ...tr, _leg:'return', schedule_time: tr.return_time || tr.schedule_time, _legLabel: lang==='ar'?'عودة':'Return', _legColor:'#60a5fa', id: tr.id + '_return' },
      ]
    })
    .sort((a,b) => (a.schedule_time||'').localeCompare(b.schedule_time||''))

  const loading = tl || dl

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>
            {lang==='ar'?'رحلاتي':'My Trips'}
          </h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {myTrips.length} {lang==='ar'?'رحلة مُعيَّنة لك':'trips assigned to you'}
            {myDriver && (
              <span style={{ marginRight:8 }}> · {myDriver.user_name}</span>
            )}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/driver/month-trips" className="btn btn-secondary">
            <CalendarCheck size={16}/> {lang==='ar'?'رحلات الشهر':'Monthly'}
          </Link>
        </div>
      </div>

      {loading && Array(3).fill(0).map((_,i) =>
        <div key={i} className="skeleton" style={{ height:130, borderRadius:14, marginBottom:12 }}/>
      )}

      {!loading && myTrips.length === 0 && (
        <EmptyState
          icon={Bus}
          message={lang==='ar'
            ? 'لا توجد رحلات مُعيَّنة لك — ستصلك إشعارات عند التعيين'
            : 'No trips assigned to you yet — you will be notified when assigned'}
        />
      )}

      {!loading && myTrips.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {myTrips.map((trip, i) => (
            <div key={trip.id} className="card" style={{ padding:20, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Bus size={26} color="var(--calm)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>
                      {lang==='en' ? (trip.place_name_en || trip.place_name) : trip.place_name}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {trip._legLabel && (
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background: trip._leg==='go' ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)', color: trip._leg==='go' ? '#34d399' : '#60a5fa', border:`1px solid ${trip._leg==='go'?'rgba(52,211,153,0.3)':'rgba(96,165,250,0.3)'}` }}>
                          {trip._legLabel}
                        </span>
                      )}
                      <span className={`badge ${statusCfg[trip.status]?.cls}`}>
                        {statusCfg[trip.status]?.[lang==='en'?'en':'ar']}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:15, color:'var(--text-muted)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Clock size={15}/> {trip.schedule_time}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Bus size={15}/>
                      {lang==='en' ? (trip.bus_plate_en || trip.bus_plate) : trip.bus_plate}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <Users size={15}/>
                      {trip.bus_capacity - (trip.available_seats||0)} {lang==='ar'?'راكب':'passengers'}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <MapPin size={15}/> {trip.trip_date}
                    </span>
                  </div>
                </div>
              </div>

              {(trip.status === 'active' || trip.status === 'pending') && (
                <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                  {trip.status === 'active' ? (
                    <Link to="/driver/active" className="btn btn-secondary btn-sm">
                      <Navigation size={16}/> {lang==='ar'?'إدارة هذه الرحلة':'Manage this trip'}
                    </Link>
                  ) : (
                    <Link to="/driver/active" className="btn btn-primary btn-sm">
                      <Navigation size={16}/> {lang==='ar'?'ابدأ الرحلة':'Start Trip'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
