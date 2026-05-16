import React, { useState } from 'react'
import { Navigation, Square, Bus, Clock, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { useGPS } from '../../context/GPSContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useApi, useToast } from '../../hooks/useApi'
import { getTrips, updateTrip, getDrivers } from '../../services/api'
import ToastContainer from '../../components/Toast'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import LiveMap from '../../components/LiveMap'
import { useIsMobile } from '../../hooks/useIsMobile'

// إحداثيات الجامعة الثابتة — لو عندك إحداثيات مختلفة غيّرها هنا
const UNIVERSITY_COORDS = { lat: 31.2315, lng: 32.2869, name: 'جامعة شرق بورسعيد الأهلية' }

export default function DriverActiveTrip() {
  const isMobile = useIsMobile()
  const { t, lang }  = useLanguage()
  const { user }     = useAuth()
  const { tracking, position, error: gpsError, path, startTrip, endTrip } = useGPS()
  const { addLocalNotification } = useNotifications()
  const { toasts, showToast }    = useToast()
  const { data: trips,   loading: tl } = useApi(getTrips)
  const { data: drivers, loading: dl } = useApi(getDrivers)
  const loading = tl || dl

  const myDriver    = (drivers||[]).find(d => d.user_name === user?.user_name || d.email === user?.email)

  // Split round trips into two separate virtual entries for the driver
  const activeTrips = (trips||[])
    .filter(t => {
      if (t.status !== 'active' && t.status !== 'pending' && t.status !== 'in_progress') return false
      if (user?.id && t.driver_userId && String(t.driver_userId) === String(user.id)) return true
      if (myDriver && Number(t.driver_id) === Number(myDriver?.id)) return true
      return false
    })
    .flatMap(t => {
      if (t.trip_type !== 'round') return [t]
      return [
        { ...t, _leg: 'go',     schedule_time: t.go_time     || t.schedule_time, _legLabel: lang==='ar'?'ذهاب':'Go' },
        { ...t, _leg: 'return', schedule_time: t.return_time || t.schedule_time, _legLabel: lang==='ar'?'عودة':'Return', id: t.id + '_return' },
      ]
    })
    .sort((a,b) => (a.schedule_time||'').localeCompare(b.schedule_time||''))

  // ── هل الرحلة في نطاق الوقت المسموح بالبدء؟ (30 دقيقة قبل الموعد أو أكثر) ──
  function isTripStartable(trip) {
    if (!trip?.schedule_time || !trip?.trip_date) return false
    const now = Date.now()
    const [hh, mm] = trip.schedule_time.split(':').map(Number)
    const tripTime = new Date(`${trip.trip_date}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`).getTime()
    const diffMin  = (tripTime - now) / 60000   // موجب = في المستقبل، سالب = فات
    // مسموح من 30 دقيقة قبل الموعد حتى 60 دقيقة بعده
    return diffMin <= 30 && diffMin >= -60
  }

  function timeUntilTrip(trip) {
    if (!trip?.schedule_time || !trip?.trip_date) return null
    const [hh, mm] = trip.schedule_time.split(':').map(Number)
    const tripTime = new Date(`${trip.trip_date}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`).getTime()
    const diffMin  = Math.round((tripTime - Date.now()) / 60000)
    if (diffMin > 60)  return lang==='ar' ? `تبدأ بعد ${diffMin} دقيقة` : `Starts in ${diffMin} min`
    if (diffMin > 0)   return lang==='ar' ? `تبدأ خلال ${diffMin} دقيقة` : `In ${diffMin} min`
    if (diffMin >= -60) return lang==='ar' ? 'الآن — يمكنك البدء' : 'Now — you can start'
    return lang==='ar' ? 'فات وقتها' : 'Time passed'
  }
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [ending,       setEnding]        = useState(false)
  const [reportSent,   setReportSent]    = useState(false)

  const handleStart = async () => {
    if (!selectedTrip) { showToast(lang==='ar'?'اختر الرحلة أولاً':'Choose a trip first', 'error'); return }
    if (!isTripStartable(selectedTrip)) {
      showToast(lang==='ar'?'لا يمكن بدء الرحلة قبل 30 دقيقة من موعدها':'Cannot start trip more than 30 min before schedule', 'error')
      return
    }
    // السائق يبدأ الرحلة بحرية بدون أي شرط على ركوب الطلاب
    const ok = await startTrip(selectedTrip.id)
    if (ok) {
      const name = lang==='ar' ? selectedTrip.place_name : (selectedTrip.place_name_en||selectedTrip.place_name)
      const msg  = lang==='ar' ? `🟢 بدأت رحلة ${name}` : `🟢 Started trip to ${name}`
      showToast(msg); addLocalNotification(msg, 'success')
      try { await updateTrip(selectedTrip.id, { status:'in_progress' }) } catch {}
    } else showToast(lang==='ar'?'تعذّر الوصول للـ GPS':'Could not access GPS', 'error')
  }

  const handleEnd = async () => {
    if (!confirm(lang==='ar'?'إنهاء الرحلة؟':'End this trip?')) return
    setEnding(true)
    await endTrip()
    const name = lang==='ar' ? selectedTrip?.place_name : (selectedTrip?.place_name_en||selectedTrip?.place_name)
    const leg  = selectedTrip?._leg
    const legLabel = selectedTrip?._legLabel || ''
    const msg  = lang==='ar' ? `✅ اكتملت رحلة ${legLabel} ${name}`.trim() : `✅ ${legLabel} trip to ${name} completed`.trim()
    showToast(msg); addLocalNotification(msg, 'success')
    try {
      const realId = typeof selectedTrip.id === 'string'
        ? Number(selectedTrip.id.replace('_return',''))
        : selectedTrip.id
      if (leg === 'go') {
        // Only mark go leg done — leave return leg active
        await updateTrip(realId, { _go_completed: true, _go_completed_at: new Date().toISOString() })
      } else if (leg === 'return') {
        // Both legs done → mark whole trip completed
        await updateTrip(realId, { status:'completed', completed_at: new Date().toISOString() })
      } else {
        await updateTrip(realId, { status:'completed', completed_at: new Date().toISOString() })
      }
    } catch {}
    setSelectedTrip(null); setEnding(false)
  }

  const handleBreakdown = () => {
    const plate  = selectedTrip?.bus_plate || ''
    const msgAr  = `🚨 الباص ${plate} — السائق ${user?.user_name} يُبلّغ عن عطل`
    const msgEn  = `🚨 Bus ${plate} — Driver ${user?.user_name} reports a breakdown`

    // Show toast to driver (confirmation only — no notification stored for driver)
    showToast(lang==='ar' ? 'تم إرسال بلاغ العطل للمشرفين' : 'Breakdown report sent to supervisors')
    setReportSent(true)

    // Send notification to ALL moderators/admins only — NOT the driver
    try {
      const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
      Object.values(db).forEach(rec => {
        if (
          (rec.user?.role === 'bus_mod' || rec.user?.role === 'university_mod' || rec.user?.role === 'admin') &&
          String(rec.user?.id) !== String(user?.id)
        ) {
          const k        = 'notifications_' + rec.user.id
          const existing = JSON.parse(localStorage.getItem(k) || '[]')
          const n = {
            id:         Date.now() + Math.random(),
            message_ar: msgAr,
            message_en: msgEn,
            message:    msgAr,   // legacy fallback
            type:       'error',
            is_read:    false,
            created_at: new Date().toISOString(),
          }
          localStorage.setItem(k, JSON.stringify([n, ...existing.slice(0, 29)]))
        }
      })
    } catch {}
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('active_trip')} 🚌</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{lang==='ar'?'تحكم في GPS وإدارة رحلتك':'Control GPS and manage your trip'}</p>
      </div>

      {/* GPS bar */}
      <div style={{ padding:'16px 20px', borderRadius:12, marginBottom:20, background:tracking?'rgba(16,185,129,0.08)':'var(--surface)', border:`1px solid ${tracking?'rgba(16,185,129,0.3)':'var(--border)'}`, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:tracking?'rgba(16,185,129,0.15)':'rgba(114,138,110,0.1)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <Navigation size={26} color={tracking?'#34d399':'var(--text-secondary)'}/>
          {tracking && <div style={{ position:'absolute', inset:-4, borderRadius:16, border:'2px solid rgba(16,185,129,0.4)', animation:'pulse 2s infinite' }}/>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:700, color:tracking?'#34d399':'var(--text-primary)' }}>
            {tracking ? (lang==='ar'?'🟢 GPS نشط — يُرسل موقعك للطلاب كل ثانيتين':'🟢 GPS Active — sending to students every 2s')
                      : (lang==='ar'?'⭕ GPS متوقف':'⭕ GPS stopped')}
          </div>
          {position && <div style={{ fontSize:15, color:'var(--text-secondary)', marginTop:3, fontFamily:'monospace' }}>{position.lat.toFixed(5)}, {position.lng.toFixed(5)} · ±{position.accuracy}m</div>}
          {gpsError && <div style={{ fontSize:15, color:'#f87171', marginTop:3 }}>{gpsError}</div>}
          {!tracking && !gpsError && <div style={{ fontSize:14, color:'var(--text-secondary)', marginTop:3 }}>{lang==='ar'?'اختر رحلة واضغط ابدأ لتفعيل GPS':'Select a trip and press Start to activate GPS'}</div>}
        </div>
        {tracking && <div style={{ textAlign:'center', flexShrink:0 }}><div style={{ fontSize:18, fontWeight:800, color:'#34d399' }}>{path.length}</div><div style={{ fontSize:12, color:'var(--text-secondary)' }}>{lang==='ar'?'نقطة':'pts'}</div></div>}
      </div>

      {/* Trip selector */}
      {!tracking && (
        <div className="card" style={{ padding:20, marginBottom:20 }}>
          <h3 style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>{lang==='ar'?'اختر الرحلة':'Select Trip'}</h3>
          {loading ? Array(3).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:60, borderRadius:9, marginBottom:8 }}/>)
            : activeTrips.length===0 ? <EmptyState icon={Bus} message={lang==='ar'?'لا توجد رحلات معيّنة لك':'No trips assigned to you'}/>
            : activeTrips.map(trip => {
              const startable = isTripStartable(trip)
              const timeLabel = timeUntilTrip(trip)
              return (
                <div key={trip.id} onClick={() => startable && setSelectedTrip(trip)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10,
                    cursor: startable ? 'pointer' : 'not-allowed',
                    marginBottom:8,
                    opacity: startable ? 1 : 0.45,
                    background: selectedTrip?.id===trip.id ? 'rgba(114,138,110,0.12)' : 'var(--surface)',
                    border:`2px solid ${selectedTrip?.id===trip.id ? 'var(--calm)' : startable ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
                    transition:'all 0.2s' }}>
                  <Bus size={22} color={startable ? (selectedTrip?.id===trip.id?'var(--blue-light)':'#34d399') : 'var(--text-muted)'}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:17, fontWeight:600 }}>
                      {trip._legLabel && <span style={{ fontSize:12, fontWeight:700, color:'var(--calm)', background:'rgba(84,172,191,0.15)', padding:'2px 8px', borderRadius:6, marginLeft:8 }}>{trip._legLabel}</span>}
                      {lang==='ar'?trip.place_name:(trip.place_name_en||trip.place_name)}
                    </div>
                    <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:2, display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span><Clock size={13} style={{ verticalAlign:'middle' }}/> {trip.schedule_time}</span>
                      <span>{trip.trip_date}</span>
                      <span>🚌 {trip.bus_plate}</span>
                    </div>
                    {timeLabel && (
                      <div style={{ fontSize:13, marginTop:4, fontWeight:600, color: startable ? '#34d399' : 'var(--text-muted)' }}>
                        {startable ? '🟢' : '🕐'} {timeLabel}
                      </div>
                    )}
                  </div>
                  {selectedTrip?.id===trip.id && <CheckCircle size={22} color="var(--blue-light)"/>}
                  {!startable && (
                    <span style={{ fontSize:12, padding:'3px 8px', borderRadius:8, background:'rgba(239,68,68,0.1)', color:'#f87171', fontWeight:600, whiteSpace:'nowrap' }}>
                      {lang==='ar'?'مش وقتها':'Not yet'}
                    </span>
                  )}
                </div>
              )
            })
          }
        </div>
      )}

      {/* Active trip info */}
      {tracking && selectedTrip && (
        <div className="card" style={{ padding:18, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:12, background:'rgba(16,185,129,0.06)', borderRadius:10, border:'1px solid rgba(16,185,129,0.2)' }}>
            <Bus size={26} color="#34d399"/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>{lang==='ar'?selectedTrip.place_name:(selectedTrip.place_name_en||selectedTrip.place_name)}</div>
              <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2 }}><Clock size={14} style={{ verticalAlign:'middle' }}/> {selectedTrip.schedule_time} · {selectedTrip.bus_plate}</div>
            </div>
            <span className="badge badge-green">🟢 {lang==='ar'?'نشطة':'Active'}</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <LiveMap position={position} path={path} tracking={tracking} lang={lang} destCoords={selectedTrip ? { lat: selectedTrip.place_lat || UNIVERSITY_COORDS.lat, lng: selectedTrip.place_lng || UNIVERSITY_COORDS.lng, name: selectedTrip.place_name || UNIVERSITY_COORDS.name } : UNIVERSITY_COORDS}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
        {!tracking ? (
          <button className="btn btn-lg" style={{ gridColumn:'1/-1', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', gap:10, fontSize:19, padding:18 }} onClick={handleStart} disabled={!selectedTrip}>
            <Navigation size={24}/> 🟢 {lang==='ar'?'ابدأ الرحلة الآن':'Start Trip Now'}
          </button>
        ) : (
          <>
            <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#34d399', animation:'pulse 1.5s infinite' }}/>
              <span style={{ fontSize:17, fontWeight:600, color:'#34d399' }}>{lang==='ar'?'الرحلة نشطة':'Trip Active'}</span>
            </div>
            <button className="btn btn-lg btn-danger" style={{ fontSize:18, padding:18 }} onClick={handleEnd} disabled={ending}>
              <Square size={22}/> {ending?(lang==='ar'?'جاري الإنهاء...':'Ending...'):'🔴 '+(lang==='ar'?'إنهاء الرحلة':'End Trip')}
            </button>
          </>
        )}
      </div>
      {/* Breakdown report */}
      <div style={{ marginTop:14 }}>
        {reportSent ? (
          <div style={{ padding:'10px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:9, fontSize:16, color:'var(--red-light)', fontWeight:600 }}>
            🚨 {lang==='ar'?'تم إرسال بلاغ العطل للمشرفين':'Breakdown report sent to supervisors'}
          </div>
        ) : (
          <button className="btn" style={{ width:'100%', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--red-light)', gap:8 }} onClick={handleBreakdown}>
            <AlertTriangle size={18}/> {lang==='ar'?'🚨 الإبلاغ عن عطل في الباص':'🚨 Report Bus Breakdown'}
          </button>
        )}
      </div>

      <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(30,107,212,0.06)', border:'1px solid rgba(114,138,110,0.15)', borderRadius:9, display:'flex', gap:10 }}>
        <AlertCircle size={18} color="var(--blue-light)" style={{ flexShrink:0, marginTop:1 }}/>
        <p style={{ fontSize:15, color:'var(--text-muted)', lineHeight:1.6 }}>
          {lang==='ar'?'عند بدء الرحلة يبدأ GPS بإرسال موقعك للطلاب كل ثانيتين. اضغط "إنهاء الرحلة" عند الوصول.':'GPS sends your location to booked students every 2 seconds. Press "End Trip" when you arrive.'}
        </p>
      </div>
    </div>
  )
}
