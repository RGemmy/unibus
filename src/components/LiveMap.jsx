import React, { useEffect, useRef, useState } from 'react'
import { ExternalLink, Clock, AlertTriangle, Route } from 'lucide-react'

// ── Fetch OSRM route + speed for real traffic calc ────────────────────────────
async function fetchRouteInfo(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.routes?.[0]) {
      const coords   = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distKm   = data.routes[0].distance / 1000
      const durMin   = Math.round(data.routes[0].duration / 60)
      const speedKph = distKm / (data.routes[0].duration / 3600)
      return { coords, distKm, durMin, speedKph }
    }
  } catch {}
  return null
}

function calcTraffic(speedKph, durMin, distKm) {
  const h = new Date().getHours()
  const isRush = (h >= 7 && h <= 9) || (h >= 14 && h <= 16)
  let traffic
  if      (speedKph >= 40) traffic = 'clear'
  else if (speedKph >= 22) traffic = 'moderate'
  else                     traffic = 'heavy'
  if (isRush && traffic === 'clear') traffic = 'moderate'
  const arrivalTime = new Date(Date.now() + durMin * 60000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { minutes: durMin, arrivalTime, traffic, speedKph: Math.round(speedKph), distKm }
}

const TRAFFIC_COLOR = { clear: '#34d399', moderate: '#f59e0b', heavy: '#f87171' }
const TRAFFIC_LABEL = {
  ar: { clear: 'خالي 🟢', moderate: 'ازدحام متوسط 🟡', heavy: 'ازدحام شديد 🔴' },
  en: { clear: 'Clear 🟢', moderate: 'Moderate 🟡',     heavy: 'Heavy 🔴' },
}

export default function LiveMap({ position, path, tracking, lang, destCoords }) {
  const mapRef    = useRef(null)
  const leafRef   = useRef(null)
  const mapInst   = useRef(null)
  const driverMkr = useRef(null)
  const pathLine  = useRef(null)
  const routeLine = useRef(null)
  const destMkr   = useRef(null)
  const [routeEta, setRouteEta] = useState(null)

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    import('leaflet').then(mod => {
      const L = mod.default || mod
      leafRef.current = L
      if (mapInst.current || !mapRef.current) return
      const center = position
        ? [position.lat, position.lng]
        : destCoords ? [destCoords.lat, destCoords.lng]
        : [31.2001, 29.9187]
      mapInst.current = L.map(mapRef.current, { center, zoom: 14 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(mapInst.current)
      if (destCoords) {
        const destIcon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:8px;background:#2563eb;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(37,99,235,0.5);border:2px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [36, 36], iconAnchor: [18, 36],
        })
        destMkr.current = L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
          .addTo(mapInst.current)
          .bindPopup(destCoords.name || (lang === 'ar' ? 'الوجهة' : 'Destination'))
      }
    })
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null } }
  }, [])

  useEffect(() => {
    if (!mapInst.current || !leafRef.current || !position) return
    const L = leafRef.current
    const driverIcon = L.divIcon({
      className: '',
      html: `<div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(16,185,129,0.6);border:3px solid white;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`,
      iconSize: [46, 46], iconAnchor: [23, 23],
    })
    if (driverMkr.current) {
      driverMkr.current.setLatLng([position.lat, position.lng])
    } else {
      driverMkr.current = L.marker([position.lat, position.lng], { icon: driverIcon })
        .addTo(mapInst.current)
        .bindPopup(lang === 'ar' ? 'موقعك' : 'Your location')
      mapInst.current.setView([position.lat, position.lng], 15)
    }
    if (destCoords && tracking) {
      fetchRouteInfo(position, destCoords).then(info => {
        if (!info || !mapInst.current || !leafRef.current) return
        if (routeLine.current) routeLine.current.setLatLngs(info.coords)
        else routeLine.current = L.polyline(info.coords, {
          color: '#2563eb', weight: 4, opacity: 0.7, dashArray: '8,6'
        }).addTo(mapInst.current)
        setRouteEta(calcTraffic(info.speedKph, info.durMin, info.distKm))
      })
    }
  }, [position])

  useEffect(() => {
    if (!mapInst.current || !leafRef.current || !path?.length) return
    const L = leafRef.current
    const latlngs = path.map(p => [p.lat, p.lng])
    if (pathLine.current) pathLine.current.setLatLngs(latlngs)
    else pathLine.current = L.polyline(latlngs, { color: '#10b981', weight: 3, opacity: 0.6 }).addTo(mapInst.current)
  }, [path])

  const tLang = lang === 'ar' ? 'ar' : 'en'

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: 320, borderRadius: 14, overflow: 'hidden', zIndex: 1 }}/>
      {position && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, padding: '7px 12px', background: 'rgba(255,255,255,0.92)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#0A1E2E' }}>
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)} · ±{position.accuracy}m
        </div>
      )}
      {position && (
        <a href={`https://maps.google.com/?q=${position.lat},${position.lng}`} target="_blank" rel="noreferrer"
          style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, padding: '7px 12px', background: 'var(--calm)', borderRadius: 8, color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <ExternalLink size={15}/> Google Maps
        </a>
      )}

      {/* ETA + Traffic + Distance — يظهر للسواق تحت الخريطة لما الرحلة تبدأ */}
      {routeEta && tracking && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Clock size={15} color="var(--calm)"/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'وقت الوصول' : 'ETA'}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{routeEta.arrivalTime}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>~{routeEta.minutes} {lang === 'ar' ? 'دقيقة' : 'min'}</div>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AlertTriangle size={15} color={TRAFFIC_COLOR[routeEta.traffic]}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'الطريق' : 'Traffic'}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TRAFFIC_COLOR[routeEta.traffic] }}>
              {TRAFFIC_LABEL[tLang][routeEta.traffic]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>~{routeEta.speedKph} {lang === 'ar' ? 'كم/س' : 'km/h'}</div>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Route size={15} color="#2563eb"/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'المسافة' : 'Distance'}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {routeEta.distKm < 1 ? `${Math.round(routeEta.distKm * 1000)} م` : `${routeEta.distKm.toFixed(1)} كم`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lang === 'ar' ? 'عبر الطريق' : 'via road'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
