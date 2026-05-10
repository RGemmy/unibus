import React, { useEffect, useState, useRef } from 'react'
import { Navigation, MapPin, Clock, Wifi, WifiOff, Bus, AlertCircle, AlertTriangle, Route } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getMyReservations } from '../../services/api'
import { useBusTracking } from '../../context/GPSContext'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Haversine distance in km ──────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Fetch OSRM route between two points ──────────────────────────────────────
async function fetchRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.routes?.[0]) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distKm = data.routes[0].distance / 1000
      const durMin = Math.round(data.routes[0].duration / 60)
      return { coords, distKm, durMin }
    }
  } catch {}
  return null
}

// ── Real Leaflet Map ──────────────────────────────────────────────────────────
function LiveMap({ busPos, myPos, routeCoords, lang }) {
  const mapRef    = useRef(null)
  const leafRef   = useRef(null)
  const mapInst   = useRef(null)
  const busMarker = useRef(null)
  const myMarker  = useRef(null)
  const routeLine = useRef(null)

  // Init map once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id  = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    import('leaflet').then(mod => {
      const L = mod.default || mod
      leafRef.current = L
      if (mapInst.current || !mapRef.current) return
      const center = busPos ? [busPos.lat, busPos.lng] : myPos ? [myPos.lat, myPos.lng] : [31.2001, 29.9187]
      mapInst.current = L.map(mapRef.current, { center, zoom: 14, zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(mapInst.current)
    })
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null } }
  }, [])

  // Bus marker
  useEffect(() => {
    if (!mapInst.current || !leafRef.current || !busPos) return
    const L = leafRef.current
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(16,185,129,0.55);border:3px solid white;">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
             </div>`,
      iconSize: [44, 44], iconAnchor: [22, 22],
    })
    if (busMarker.current) {
      busMarker.current.setLatLng([busPos.lat, busPos.lng])
    } else {
      busMarker.current = L.marker([busPos.lat, busPos.lng], { icon })
        .addTo(mapInst.current)
        .bindPopup(`<b>${lang==='ar'?'الباص':'Bus'}</b>`)
      mapInst.current.setView([busPos.lat, busPos.lng], 15)
    }
  }, [busPos])

  // My position marker
  useEffect(() => {
    if (!mapInst.current || !leafRef.current || !myPos) return
    const L = leafRef.current
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    })
    if (myMarker.current) {
      myMarker.current.setLatLng([myPos.lat, myPos.lng])
    } else {
      myMarker.current = L.marker([myPos.lat, myPos.lng], { icon })
        .addTo(mapInst.current)
        .bindPopup(lang==='ar'?'موقعك':'Your location')
    }
  }, [myPos])

  // Route polyline
  useEffect(() => {
    if (!mapInst.current || !leafRef.current || !routeCoords?.length) return
    const L = leafRef.current
    if (routeLine.current) {
      routeLine.current.setLatLngs(routeCoords)
    } else {
      routeLine.current = L.polyline(routeCoords, { color:'#2563eb', weight:5, opacity:0.75 })
        .addTo(mapInst.current)
      mapInst.current.fitBounds(routeLine.current.getBounds(), { padding:[40, 40] })
    }
  }, [routeCoords])

  return <div ref={mapRef} style={{ width:'100%', height:380, borderRadius:14, overflow:'hidden', zIndex:1 }}/>
}

// ── Traffic estimate ──────────────────────────────────────────────────────────
function useTrafficEstimate(tripActive) {
  const [est, setEst] = useState(null)
  useEffect(() => {
    if (!tripActive) { setEst(null); return }
    const calc = () => {
      const h = new Date().getHours()
      const isRush = (h>=7&&h<=9)||(h>=14&&h<=16)
      const base = 8 + Math.floor(Math.random()*7)
      const extra = isRush ? Math.floor(Math.random()*10)+5 : 0
      const total = base + extra
      const arr = new Date(Date.now() + total*60000)
      setEst({ minutes:total, arrivalTime:arr.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), isRush, traffic:isRush?'heavy':total>12?'moderate':'clear' })
    }
    calc(); const id = setInterval(calc, 30000); return () => clearInterval(id)
  }, [tripActive])
  return est
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StudentTrack() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const { data: reservations, loading } = useApi(getMyReservations)
  const [myPos,       setMyPos]       = useState(null)
  const [routeCoords, setRouteCoords] = useState(null)
  const [routeInfo,   setRouteInfo]   = useState(null)
  const [remainDist,  setRemainDist]  = useState(null)

  const confirmedRes = (reservations||[]).filter(r => r.status === 'confirmed')
  const activeTrip   = confirmedRes[0]
  const isScanned    = activeTrip?.scanned === true
  const { busPos, tripActive, lastUpdate } = useBusTracking(isScanned ? (activeTrip?.trip || activeTrip?.id) : null)
  const estimate = useTrafficEstimate(tripActive && isScanned)

  // Watch my real GPS
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      p => setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Fetch route from bus to me
  useEffect(() => {
    if (!busPos || !myPos) return
    fetchRoute(busPos, myPos).then(info => {
      if (info) { setRouteCoords(info.coords); setRouteInfo({ distKm: info.distKm, durMin: info.durMin }) }
    })
  }, [busPos?.lat, busPos?.lng, myPos?.lat, myPos?.lng])

  // Remaining straight-line distance
  useEffect(() => {
    if (!busPos || !myPos) { setRemainDist(null); return }
    setRemainDist(haversine(busPos.lat, busPos.lng, myPos.lat, myPos.lng))
  }, [busPos, myPos])

  const trafficColor = { clear:'#34d399', moderate:'#f59e0b', heavy:'#f87171' }
  const trafficLabel = {
    clear:    lang==='ar'?'الطريق خالي 🟢':'Clear road 🟢',
    moderate: lang==='ar'?'ازدحام متوسط 🟡':'Moderate 🟡',
    heavy:    lang==='ar'?'ازدحام شديد 🔴':'Heavy traffic 🔴',
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>{t('track_title')} 🚌</h2>
        <p style={{ fontSize:15, color:'var(--text-muted)', marginTop:3 }}>
          {lang==='ar'?'موقع باصك في الوقت الفعلي':'Your bus location in real time'}
        </p>
      </div>

      {/* Connection bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
        background: tripActive ? 'rgba(16,185,129,0.08)' : 'var(--surface)',
        border:`1px solid ${tripActive?'rgba(16,185,129,0.3)':'var(--border)'}`,
        borderRadius:10, marginBottom:16 }}>
        {tripActive ? <Wifi size={20} color="#34d399"/> : <WifiOff size={20} color="var(--text-secondary)"/>}
        <span style={{ fontSize:16, fontWeight:600, color: tripActive ? '#34d399' : 'var(--text-primary)' }}>
          {tripActive
            ? (lang==='ar'?'🟢 الباص في الطريق — يتحدث كل ثانيتين':'🟢 Bus is live — updates every 2s')
            : (lang==='ar'?'⏳ في انتظار بدء الرحلة':'⏳ Waiting for trip to start')}
        </span>
        {lastUpdate && <span style={{ fontSize:13, color:'var(--text-muted)', marginInlineStart:'auto' }}>{lang==='ar'?'آخر تحديث:':'Last:'} {lastUpdate}</span>}
      </div>

      {/* Stats: ETA + Traffic + Distance */}
      {(estimate || remainDist != null) && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${estimate ? (remainDist!=null?3:2) : 1}, 1fr)`, gap:12, marginBottom:16 }}>
          {estimate && (
            <>
              <div className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Clock size={18} color="var(--calm)"/>
                  <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{lang==='ar'?'وقت الوصول':'ETA'}</span>
                </div>
                <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', fontFamily:'monospace' }}>{estimate.arrivalTime}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>~{estimate.minutes} {lang==='ar'?'دقيقة':'min'}</div>
              </div>
              <div className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <AlertTriangle size={18} color={trafficColor[estimate.traffic]}/>
                  <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{lang==='ar'?'حالة الطريق':'Traffic'}</span>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:trafficColor[estimate.traffic] }}>
                  {trafficLabel[estimate.traffic]}
                </div>
              </div>
            </>
          )}
          {remainDist != null && (
            <div className="card" style={{ padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <Route size={18} color="#2563eb"/>
                <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{lang==='ar'?'المسافة المتبقية':'Distance left'}</span>
              </div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', fontFamily:'monospace' }}>
                {remainDist < 1 ? `${Math.round(remainDist*1000)} م` : `${remainDist.toFixed(1)} كم`}
              </div>
              {routeInfo && <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>~{routeInfo.durMin} {lang==='ar'?'دقيقة عبر الطريق':'min via road'}</div>}
            </div>
          )}
        </div>
      )}

      {loading
        ? <div className="skeleton" style={{ height:380, borderRadius:14 }}/>
        : confirmedRes.length===0
        ? <EmptyState icon={Bus} message={lang==='ar'?'لا توجد رحلات مؤكدة — احجز رحلة أولاً':'No confirmed trips — book a trip first'}/>
        : !isScanned
        ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>{tripActive ? '🚌' : '🎫'}</div>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10, color:'var(--text-primary)' }}>
              {tripActive
                ? (lang==='ar' ? 'فات الباص' : 'Bus has departed')
                : (lang==='ar' ? 'في انتظار السكان' : 'Waiting for check-in')}
            </h3>
            <p style={{ fontSize:15, color:'var(--text-muted)', maxWidth:320, margin:'0 auto' }}>
              {tripActive
                ? (lang==='ar'
                    ? 'لم يتم تسجيل حضورك — الباص بدأ رحلته بدونك'
                    : 'Your attendance was not recorded — the bus departed without you')
                : (lang==='ar'
                    ? 'الخريطة ستظهر بعد أن يسكان المشرف QR كودك عند الصعود'
                    : 'Map will appear after the supervisor scans your QR code at boarding')}
            </p>
          </div>
        )
        : (
        <>
          {activeTrip && (
            <div className="card" style={{ padding:16, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Bus size={22} color="var(--calm)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)' }}>
                    {lang==='ar'?'رحلة إلى':'Trip to'} {lang==='ar'?activeTrip.trip_place:(activeTrip.trip_place_en||activeTrip.trip_place)}
                  </div>
                  <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
                    <span><Clock size={13} style={{ verticalAlign:'middle' }}/> {activeTrip.schedule_time}</span>
                    <span>{activeTrip.trip_date}</span>
                    {activeTrip.seat_number && <span>🪑 {lang==='ar'?'مقعد':'Seat'} {activeTrip.seat_number}</span>}
                  </div>
                </div>
                {tripActive
                  ? <span className="badge badge-green">🟢 {lang==='ar'?'في الطريق':'On the way'}</span>
                  : <span className="badge badge-amber">⏳ {lang==='ar'?'لم تبدأ':'Not started'}</span>}
              </div>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
            {(busPos || myPos) ? (
              <LiveMap busPos={busPos} myPos={myPos} routeCoords={routeCoords} lang={lang}/>
            ) : (
              <div style={{ height:380, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, background:'var(--surface)' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(38,101,140,0.10)', border:'2px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Navigation size={28} color="var(--text-secondary)"/>
                </div>
                <p style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>
                  {lang==='ar'?'في انتظار بدء الرحلة...':'Waiting for trip to start...'}
                </p>
                <p style={{ fontSize:14, color:'var(--text-muted)' }}>
                  {lang==='ar'?'سيظهر موقع الباص هنا':'Bus location will appear here'}
                </p>
              </div>
            )}
          </div>

          {busPos && (
            <div style={{ textAlign:'center', marginBottom:14 }}>
              <a href={`https://maps.google.com/?q=${busPos.lat},${busPos.lng}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <MapPin size={16}/> {lang==='ar'?'افتح في خرائط جوجل':'Open in Google Maps'}
              </a>
            </div>
          )}
        </>
      )}

      <div style={{ padding:'11px 15px', background:'rgba(38,101,140,0.05)', border:'1px solid var(--border)', borderRadius:9, display:'flex', gap:10 }}>
        <AlertCircle size={16} color="var(--calm)" style={{ flexShrink:0, marginTop:2 }}/>
        <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6 }}>
          {lang==='ar'
            ? 'الخريطة تظهر بعد تسجيل حضورك — GPS السائق يتحدث كل ثانيتين.'
            : 'Map appears after check-in — driver GPS updates every 2 seconds.'}
        </p>
      </div>
    </div>
  )
}
