import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const GPSContext = createContext(null)

// ── localStorage keys ─────────────────────────────────────────────────────────
const ACTIVE_KEY  = 'gps_active_trip'   // { tripId, position, timestamp, driverName }
const GPS_PREFIX  = 'gps_trip_'         // gps_trip_<tripId> = { lat, lng, accuracy, timestamp }

export function GPSProvider({ children }) {
  const [tracking,  setTracking]  = useState(false)
  const [position,  setPosition]  = useState(null)
  const [error,     setError]     = useState(null)
  const [path,      setPath]      = useState([])
  const [activeTripId, setActiveTripId] = useState(null)
  const watchRef  = useRef(null)
  const intervalRef = useRef(null)

  // On mount — restore tracking state if driver refreshes page
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY))
      if (saved && saved.tripId) {
        setActiveTripId(saved.tripId)
        setTracking(true)
        if (saved.position) setPosition(saved.position)
      }
    } catch {}
  }, [])

  // Broadcast position to localStorage every 2s while tracking
  useEffect(() => {
    if (!tracking || !activeTripId) return
    intervalRef.current = setInterval(() => {
      if (position) {
        const data = { lat: position.lat, lng: position.lng, accuracy: position.accuracy, timestamp: Date.now() }
        localStorage.setItem(GPS_PREFIX + activeTripId, JSON.stringify(data))
        // Also update the active trip entry
        const existing = JSON.parse(localStorage.getItem(ACTIVE_KEY) || '{}')
        localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...existing, position: data }))
      }
    }, 2000)
    return () => clearInterval(intervalRef.current)
  }, [tracking, activeTripId, position])

  const startTrip = useCallback(async (tripId) => {
    setError(null)
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('جهازك لا يدعم GPS')
        resolve(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }
          setPosition(p)
          setPath([p])
          setTracking(true)
          setActiveTripId(tripId)
          localStorage.setItem(ACTIVE_KEY, JSON.stringify({ tripId, position: p, timestamp: Date.now() }))
          localStorage.setItem(GPS_PREFIX + tripId, JSON.stringify({ ...p, timestamp: Date.now() }))

          // Watch position
          watchRef.current = navigator.geolocation.watchPosition(
            (pos2) => {
              const p2 = { lat: pos2.coords.latitude, lng: pos2.coords.longitude, accuracy: Math.round(pos2.coords.accuracy) }
              setPosition(p2)
              setPath(prev => [...prev.slice(-50), p2])
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 2000 }
          )
          resolve(true)
        },
        (err) => {
          // GPS denied — show clear error to driver
          setError(lang_ref || 'GPS مرفوض — يرجى السماح بالموقع من إعدادات المتصفح')
          resolve(false)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }, [])

  const endTrip = useCallback(async () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    clearInterval(intervalRef.current)
    if (activeTripId) {
      localStorage.removeItem(GPS_PREFIX + activeTripId)
      // Mark trip as ended (students will see this)
      localStorage.setItem(ACTIVE_KEY, JSON.stringify({ tripId: null, ended: true, timestamp: Date.now() }))
    }
    localStorage.removeItem(ACTIVE_KEY)
    setTracking(false)
    setPosition(null)
    setPath([])
    setActiveTripId(null)
  }, [activeTripId])

  // NOTE: No fake movement simulation — real GPS watchPosition handles updates

  return (
    <GPSContext.Provider value={{ tracking, position, error, path, activeTripId, startTrip, endTrip }}>
      {children}
    </GPSContext.Provider>
  )
}

export const useGPS = () => useContext(GPSContext)

// ── Helper for students to read driver GPS ────────────────────────────────────
export function useBusTracking(tripId) {
  const [busPos,     setBusPos]     = useState(null)
  const [tripActive, setTripActive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [path, setPath] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!tripId) return
    const check = () => {
      try {
        const raw = localStorage.getItem('gps_trip_' + tripId)
        if (raw) {
          const data = JSON.parse(raw)
          const age  = Date.now() - (data.timestamp || 0)
          if (age < 30000) {  // fresh within 30s
            setBusPos({ lat: data.lat, lng: data.lng, accuracy: data.accuracy })
            setPath(prev => { const p = [...prev, { lat: data.lat, lng: data.lng }]; return p.slice(-100) })
            setTripActive(true)
            setLastUpdate(new Date(data.timestamp).toLocaleTimeString())
            return
          }
        }
        // Check if trip is active at all
        const active = JSON.parse(localStorage.getItem('gps_active_trip') || '{}')
        if (active.tripId === tripId) {
          setTripActive(true)
          if (active.position) setBusPos(active.position)
        } else {
          setTripActive(false)
        }
      } catch {}
    }
    check()
    intervalRef.current = setInterval(check, 2000)
    return () => clearInterval(intervalRef.current)
  }, [tripId])

  return { busPos, tripActive, lastUpdate, path }
}
