import { runAutoNoShow } from '../../services/mockDb'
import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bus, MapPin, Clock, CheckCircle, Search, X, User, Wind, Thermometer, QrCode, Phone, Banknote, Upload, ArrowRight } from 'lucide-react'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useApi, useToast } from '../../hooks/useApi'
import { getTrips, createReservation, updateTrip, getMyReservations } from '../../services/api'
import { useNotifications } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'


// Bus color hex lookup
const BUS_COLOR_HEX = {
  White:'#f8fafc', Yellow:'#fbbf24', Blue:'#3b82f6', Red:'#ef4444',
  Silver:'#94a3b8', Green:'#22c55e', Orange:'#f97316', 'Light Blue':'#54ACBF',
  Brown:'#92400e', Black:'#475569', Gold:'#d97706', Pink:'#ec4899',
}

const INSTAPAY_NUMBER = '01001234567'
const INSTAPAY_NAME   = 'UniBus - نظام النقل الجامعي'

// ── QR Code generator (simple data URL) ─────────────────────────────────────
function generateQR(data) {
  // Encode data as a simple visual QR-like pattern for display
  // We'll use a data URI with a canvas-drawn pattern
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}




function SeatMap({ trip, onBook, onClose, lang, myReservations, userId, hasSubscription, bookingAs, isHalfHourBooking, pendingGoPrice }) {
  const [selected,  setSelected]  = useState(null)
  const [booking,   setBooking]   = useState(false)
  const [err,       setErr]       = useState('')
  const isMobile = useIsMobile()

  // ── Check if this user already has a booking for this exact trip+type ─────
  const existingRes = (myReservations||[]).find(r => {
    if (r.status === 'cancelled') return false
    if (Number(r.trip) !== trip.id) return false
    if (!(String(r.userId) === String(userId) || String(r.student) === String(userId))) return false
    // For virtual round trips: only match same trip_type
    if (trip._virtual_type != null) return (r.trip_type || 'go') === bookingAs
    return true
  })

  // ── If already booked: show a clear info screen instead of seat picker ────
  if (existingRes) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
        <div style={{ background:'var(--navy-2)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:420, padding:32, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', animation:'fadeUp 0.25s ease', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
          <h3 style={{ fontSize:20, fontWeight:800, color:'#34d399', marginBottom:8 }}>
            {lang==='ar' ? 'تم حجز مقعد بالفعل!' : 'Seat Already Booked!'}
          </h3>
          <p style={{ fontSize:15, color:'var(--text-muted)', marginBottom:20 }}>
            {lang==='ar'
              ? `لقد حجزت مسبقاً في هذه الرحلة`
              : `You have already booked a seat on this trip`}
          </p>
          {existingRes.seat_number && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'10px 24px', background:'rgba(59,130,246,0.15)', border:'2px solid rgba(59,130,246,0.4)', borderRadius:12, marginBottom:24 }}>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>{lang==='ar'?'رقم مقعدك:':'Your seat:'}</span>
              <span style={{ fontSize:28, fontWeight:900, color:'#60a5fa' }}>{existingRes.seat_number}</span>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>
              {lang==='ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const capacity = Math.max(Number(trip.bus_capacity) || 45, 9)
  const seats    = trip.seats || Array(capacity).fill(null)
  const isAC     = trip.has_ac || trip.bus_ac
  const price    = trip.price || 25

  // Layout: rows of 4 (2+aisle+2), LAST ROW = 5 (2+aisle+3)
  const mainRows  = Math.max(Math.floor((capacity - 5) / 4), 1)
  const totalRows = mainRows + 1 // +1 for last row of 5

  const getSeatIdx = (row, col) => {
    if (row < mainRows) return row * 4 + col
    return mainRows * 4 + col
  }
  const getSeatLabel = (row, col) => {
    const labels = ['A', 'B', 'C', 'D', 'E']
    return `${row + 1}${labels[col]}`
  }
  const isValid  = (idx) => idx < capacity
  const isTaken  = (idx) => isValid(idx) && seats[idx] && seats[idx] !== null && seats[idx] !== String(userId)
  const isMine   = (idx) => isValid(idx) && seats[idx] === String(userId)
  const isChosen = (idx) => selected === idx

  const seatBtn = (row, col) => {
    const idx = getSeatIdx(row, col)
    if (!isValid(idx)) return <div key={col} style={{ width:40, height:38 }}/>
    const mine   = isMine(idx)
    const taken  = isTaken(idx)
    const chosen = isChosen(idx)
    return (
      <button key={col} disabled={taken || mine}
        onClick={() => { if (!mine) { setSelected(chosen ? null : idx); setErr('') } }}
        title={mine ? (lang==='ar'?'مقعدك المحجوز':'Your booked seat') : undefined}
        style={{
          width:40, height:38, borderRadius:7, border:'none',
          cursor: mine ? 'default' : taken ? 'not-allowed' : 'pointer',
          fontSize:10, fontWeight:700, transition:'all 0.15s',
          background: mine   ? 'rgba(59,130,246,0.25)'   : taken  ? 'rgba(239,68,68,0.18)' : chosen ? 'rgba(16,185,129,0.3)' : 'var(--surface)',
          color:       mine   ? '#60a5fa'                 : taken  ? '#f87171'              : chosen ? '#34d399'               : 'var(--text-secondary)',
          outline:     mine   ? '2px solid #3b82f6'       : chosen ? '2px solid #34d399'    : taken  ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
          boxShadow:   mine   ? '0 0 10px rgba(59,130,246,0.4)' : chosen ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
        }}>
        {mine ? '★' : getSeatLabel(row, col)}
      </button>
    )
  }

  // Confirm seat → book immediately (payment step comes after return seat or at end)
  const handleSeatConfirm = () => {
    if (selected === null) { setErr(lang==='ar'?'اختر مقعداً أولاً':'Please select a seat first'); return }
    setErr('')
    doBook(hasSubscription ? 'subscription' : null)
  }

  const doBook = async (method) => {
    setBooking(true); setErr('')
    try { await onBook(trip, selected + 1, bookingAs, method) }
    catch (e) {
      const msg = e?.message || ''
      const isAlreadyTaken = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('exist')
      if (isAlreadyTaken) {
        setErr(lang==='ar'?'هذا المقعد محجوز بالفعل، اختر مقعداً آخر':'This seat is already taken, please choose another')
      } else {
        setErr(msg || (lang==='ar'?'فشل الحجز':'Booking failed'))
      }
      setBooking(false)
    }
  }

  const takenCount = seats.filter(s => s && s !== null).length
  const freeCount  = capacity - takenCount
  const selectedLabel = selected !== null
    ? getSeatLabel(Math.floor(selected < mainRows*4 ? selected/4 : mainRows), selected < mainRows*4 ? selected%4 : selected - mainRows*4)
    : null

  return (
    <>
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ background:'var(--navy-2)', border:'1px solid var(--border)', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'94vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.7)', animation:'fadeUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:700 }}>{lang==='ar'?'اختر مقعدك':'Choose Your Seat'}</h3>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>
              {lang==='ar' ? trip.place_name : (trip.place_name_en||trip.place_name)} · {trip.schedule_time}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:7, padding:'5px 7px', cursor:'pointer', color:'var(--text-secondary)', display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        {/* AC + Price banner */}
        <div style={{ display:'flex', gap:10, padding:'10px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:isAC?'rgba(114,138,110,0.12)':'rgba(255,255,255,0.05)', border:`1px solid ${isAC?'rgba(38,101,140,0.30)':'var(--border)'}` }}>
            {isAC ? <Wind size={16} color="var(--blue-light)"/> : <Thermometer size={16} color="var(--text-muted)"/>}
            <span style={{ fontSize:15, fontWeight:600, color:isAC?'var(--blue-light)':'var(--text-muted)' }}>
              {isAC ? (lang==='ar'?'مكيف ❄️':'A/C ❄️') : (lang==='ar'?'غير مكيف':'No A/C')}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize:15, fontWeight:700, color:'#34d399' }}>{price} {lang==='ar'?'ج.م':'EGP'}</span>
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ fontSize:14, color:'var(--text-muted)', display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ color:'#34d399' }}>● {freeCount} {lang==='ar'?'متاح':'free'}</span>
            <span style={{ color:'#f87171' }}>● {takenCount} {lang==='ar'?'محجوز':'taken'}</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--border)' }}>
          {[
            { bg:'var(--surface)', border:'1px solid var(--border)',          label:lang==='ar'?'متاح':'Available' },
            { bg:'rgba(16,185,129,0.3)', border:'2px solid #34d399',          label:lang==='ar'?'مختار':'Selected' },
            { bg:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.4)', label:lang==='ar'?'محجوز':'Booked' },
            { bg:'rgba(59,130,246,0.25)', border:'2px solid #3b82f6',         label:lang==='ar'?'مقعدك':'Yours' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:14, height:14, borderRadius:3, background:l.bg, border:l.border, flexShrink:0 }}/>
              <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Seat grid */}
        <div style={{ padding:'14px 20px' }}>
          {/* Driver */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'6px 12px', background:'rgba(30,107,212,0.08)', border:'1px solid rgba(114,138,110,0.2)', borderRadius:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <User size={17} color="var(--blue-light)"/>
              <span style={{ fontSize:14, color:'var(--blue-light)', fontWeight:600 }}>{lang==='ar'?'السائق':'Driver'}</span>
            </div>
            <span style={{ fontSize:10, color:'var(--text-muted)' }}>🚌 {lang==='ar'?'الأمام':'Front'}</span>
          </div>

          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 16px 1fr 28px', gap:5, marginBottom:6, textAlign:'center' }}>
            <div/>
            <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:5 }}>
              {['A','B'].map(l=><div key={l} style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{l}</div>)}
            </div>
            <div/>
            <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:5 }}>
              {['C','D'].map(l=><div key={l} style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{l}</div>)}
            </div>
            <div/>
          </div>

          {/* Main rows */}
          {Array.from({ length: mainRows }, (_, row) => (
            <div key={row} style={{ display:'grid', gridTemplateColumns:'28px 1fr 16px 1fr 28px', gap:5, marginBottom:5, alignItems:'center' }}>
              <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{row+1}</div>
              <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:5 }}>
                {[0,1].map(col => seatBtn(row, col))}
              </div>
              <div style={{ textAlign:'center', color:'var(--border)', fontSize:16 }}>│</div>
              <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:5 }}>
                {[2,3].map(col => seatBtn(row, col))}
              </div>
              <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{row+1}</div>
            </div>
          ))}

          {/* Last row - 5 seats */}
          <div style={{ marginTop:6, marginBottom:4 }}>
            <div style={{ textAlign:'center', fontSize:10, color:'var(--amber)', fontWeight:600, marginBottom:5 }}>
              ── {lang==='ar'?'الصف الأخير':'Last Row'} ({totalRows}) ──
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 16px 1fr 28px', gap:5, alignItems:'center' }}>
              <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{totalRows}</div>
              <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:5 }}>
                {[0,1].map(col => seatBtn(mainRows, col))}
              </div>
              <div style={{ textAlign:'center', color:'var(--border)', fontSize:16 }}>│</div>
              <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr 1fr', gap:5 }}>
                {[2,3,4].map(col => seatBtn(mainRows, col))}
              </div>
              <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:700 }}>{totalRows}</div>
            </div>
          </div>

          {/* Back label */}
          <div style={{ textAlign:'center', marginTop:6, fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ height:1, flex:1, background:'var(--border)' }}/>
            🔚 {lang==='ar'?'المؤخرة':'Back of Bus'}
            <div style={{ height:1, flex:1, background:'var(--border)' }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)' }}>
          {selectedLabel && (
            <div style={{ marginBottom:10, padding:'9px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, fontSize:16, color:'#34d399', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={17}/>
              {lang==='ar'?'المقعد المختار:':'Selected seat:'} <strong>{selectedLabel}</strong>
              {pendingGoPrice > 0 && (
                <span style={{ marginRight:'auto', fontSize:13, color:'var(--text-muted)' }}>
                  {lang==='ar'?`إجمالي: ${pendingGoPrice + price} ج.م`:`Total: ${pendingGoPrice + price} EGP`}
                </span>
              )}
            </div>
          )}
          {err && <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, fontSize:15, color:'var(--red-light)' }}>{err}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>{lang==='ar'?'إلغاء':'Cancel'}</button>
            <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSeatConfirm} disabled={selected===null||booking}>
              {booking
                ? <div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                : <><CheckCircle size={17}/> {lang==='ar'?`تأكيد المقعد`:`Confirm Seat`}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

const ROUND_PRICE = 105
const SINGLE_PRICE = 55

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentTrips() {
  const isMobile = useIsMobile()
  const { t, lang }              = useLanguage()
  const { user }                 = useAuth()
  const navigate                 = useNavigate()
  const location                 = useLocation()
  React.useEffect(() => { runAutoNoShow() }, [])

  // If navigated from MyReservations "Add Return" button → auto-open return tab in bundle mode
  React.useEffect(() => {
    const st = location.state
    if (st?.openReturnTab) {
      setTripTab('return')
      setBookingAs('return')
      if (st.bundleGoRes) {
        setRoundBooking(true)
        setPendingGoRes({
          trip:       st.bundleGoRes,
          seatNumber: st.bundleGoRes.seat_number,
          resId:      st.bundleGoRes.id,
          price:      st.bundleGoRes.amount || 55,
        })
      }
      window.history.replaceState({}, '')
    }
  }, [])
  const [search, setSearch]           = useState('')
  const [seatTrip, setSeatTrip]        = useState(null)
  const [bookingAs, setBookingAs]      = useState('go')
  const [tripTab, setTripTab]          = useState('go')
  const [pendingGoRes, setPendingGoRes] = useState(null) // holds go reservation awaiting return seat pick
  const [paymentModal, setPaymentModal] = useState(null)  // { goRes, returnRes, total } — shown for combined payment
  const [roundBooking, setRoundBooking] = useState(false)  // true = book go+return together
  const [payMethod,    setPayMethod]    = useState('cash')
  const [, setTick] = useState(0) // forces re-render every minute so passed trips disappear
  const { data: trips, loading, refetch } = useApi(getTrips)
  const { data: myReservations, refetch: refetchMyRes } = useApi(getMyReservations)
  const { toasts, showToast }    = useToast()
  const { addLocalNotification } = useNotifications()

  React.useEffect(() => {
    refetchMyRes()
    // Refresh reservations when user cancels one
    const cancelHandler = () => { refetch(); refetchMyRes() }
    window.addEventListener('reservation-cancelled', cancelHandler)
    // Refresh reservations when user comes back to this tab/page
    const focusHandler = () => { refetchMyRes() }
    window.addEventListener('focus', focusHandler)
    // Re-render every minute so trips whose time has passed disappear automatically
    const clockTimer = setInterval(() => setTick(t => t + 1), 60 * 1000)
    return () => {
      window.removeEventListener('reservation-cancelled', cancelHandler)
      window.removeEventListener('focus', focusHandler)
      clearInterval(clockTimer)
    }
  }, [])

  // ── Date logic ───────────────────────────────────────────────────────────────
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`

  // منطق التاريخ:
  // ساعة 6 مساء (18:00) → 5:59 مساء اليوم اللي بعده = اعرض رحلات اليوم اللي بعده
  // ساعة 6 صبح → 5:59 مساء = اعرض رحلات النهارده
  // ملاحظة: 12 بليل → 5:59 صبح = لسه في "فترة بكره" من أمبارح 6م
  const h = now.getHours()
  // afterCutoff = true لو الساعة من 18:00 لـ 23:59 (6م لـ 12ب)
  // الساعات 0→17 = عرض رحلات النهارده (سواء 12ب أو 6 صبح)
  const afterCutoff = h >= 18

  function nextDayStr(from) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1)
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  }

  // السبت 6م → targetDate = الأحد ✓
  // الأحد 12ب → targetDate = الأحد ✓ (h=0, afterCutoff=false)
  // الأحد 5م → targetDate = الأحد ✓
  // الأحد 6م → targetDate = الاتنين ✓
  const targetDate = afterCutoff ? nextDayStr(now) : todayStr

  // active = الرحلة متاحة للحجز (لسه مبدأتش)
  // in_progress = السواق ضغط ابدأ (اختفت من الطالب)
  // completed/cancelled = خلصت أو اتلغت
  const todayTrips = (trips || [])
    .filter(tr =>
      tr.trip_date === targetDate &&
      (tr.status === 'active' || tr.status === 'pending') &&
      tr.status !== 'in_progress' &&  // بدأت — مش بيشوفها
      tr.status !== 'full' &&         // مفيش مقاعد — مش بيشوفها
      tr.status !== 'completed' &&    // خلصت فعلاً
      tr.status !== 'cancelled'
    )
    .sort((a, b) => (a.schedule_time || '').localeCompare(b.schedule_time || ''))

  // مفيش بنر عطلة — المشرف هو المسؤول عن الرحلات في أي يوم
  const showWeekendBanner = false

  // ── Virtual split: expand 'round' trips into a go-view and a return-view ────
  // Done BEFORE time-filtering so each leg can be hidden independently.
  const expandedTrips = todayTrips.flatMap(tr => {
    if (tr.trip_type !== 'round') return [tr]
    const goVirtual = {
      ...tr,
      trip_type:       'go',
      schedule_time:   tr.go_time || tr.schedule_time,
      seats:           tr.seats_go     || tr.seats || [],
      available_seats: tr.available_seats_go ?? tr.available_seats,
      _virtual_type:   'go',
    }
    const returnVirtual = {
      ...tr,
      trip_type:       'return',
      schedule_time:   tr.return_time || tr.schedule_time,
      seats:           tr.seats_return || Array(tr.bus_capacity || 45).fill(null),
      available_seats: tr.available_seats_return ?? tr.available_seats,
      _virtual_type:   'return',
    }
    return [goVirtual, returnVirtual]
  })

  // ── Booking & locking logic ─────────────────────────────────────────────────
  const OPEN_THRESHOLD = 5 // open next trip when available seats <= this

  // Sequential opening for GO trips: trips open one by one as each fills up
  const goTripsSorted     = expandedTrips.filter(t => !t.trip_type || t.trip_type === 'go')
  const returnTripsSorted = expandedTrips.filter(t => t.trip_type === 'return')

  function getOpenTripIdx(tripList) {
    // Returns the index (in tripList) of the currently open trip
    for (let i = 0; i < tripList.length; i++) {
      if (tripList[i].available_seats > OPEN_THRESHOLD) return i
    }
    return tripList.length - 1 // all almost-full → last one stays open
  }
  const openGoIdx     = getOpenTripIdx(goTripsSorted)
  const openReturnIdx = getOpenTripIdx(returnTripsSorted)

  // Student already booked a go trip today? (enables return trips)
  const myGoBooking = (myReservations||[]).find(r =>
    r.status !== 'cancelled' &&
    (r.trip_type === 'go' || !r.trip_type)
  )
  const hasGoBooking = !!myGoBooking

  // Student already booked a return trip?
  const hasReturnBooking = (myReservations||[]).some(r =>
    r.status !== 'cancelled' &&
    r.trip_type === 'return'
  )

  // Apply search filter to expanded trips (virtual go+return for round trips)
  const filtered = expandedTrips.filter(tr => {
    const name = lang==='ar' ? tr.place_name : (tr.place_name_en||tr.place_name)
    return name?.toLowerCase().includes(search.toLowerCase()) || tr.schedule_time?.includes(search)
  })

  // Group by trip_type
  const goTrips     = filtered.filter(tr => !tr.trip_type || tr.trip_type === 'go')
  const returnTrips = filtered.filter(tr => tr.trip_type === 'return')
  const hasGroups   = returnTrips.length > 0

  // Check if current student has active subscription
  const hasSubscription = (() => {
    try {
      const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]')
      const userId = user?.id
      const today = new Date().toISOString().split('T')[0]
      return subs.some(s => (String(s.student_id) === String(userId) || s.student === user?.user_name) && s.status === 'active' && (!s.end_date || s.end_date >= today))
    } catch { return false }
  })()

  // Current time in minutes since midnight
  const currentMinutes = (() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })()

  // Helper: is trip departing within 30 min?
  function isDepartingWithin30(scheduleTime) {
    if (!scheduleTime) return false
    const [hh, mm] = scheduleTime.split(':').map(Number)
    const tripMins = hh * 60 + (isNaN(mm) ? 0 : mm)
    const diff = tripMins - currentMinutes
    return diff >= 0 && diff <= 30
  }

  const handleBook = async (trip, seatNumber, bookingAs, paymentMethod) => {
    // bookingAs = 'go' or 'return' — passed from SeatMap based on which section
    const placeAr  = trip.place_name
    const placeEn  = trip.place_name_en || trip.place_name
    const userId   = String(user?.id || '')
    const isReturn = bookingAs === 'return' || trip.trip_type === 'return'
    const actualTripType = isReturn ? 'return' : 'go'
    // For virtual round trips, schedule_time is already set correctly by the virtual split
    const actualTime = trip.schedule_time

    // ── Guard: prevent booking the same trip+type twice (for round trips) ────
    const alreadyBooked = userId && (myReservations||[]).some(r => {
      if (r.status === 'cancelled') return false
      if (Number(r.trip) !== trip.id) return false
      if (!(String(r.userId) === userId || String(r.student) === userId)) return false
      // For round trips: only block if same trip_type
      const parentIsRound = (trip._virtual_type != null)
      if (parentIsRound) return (r.trip_type || 'go') === actualTripType
      return true
    })
    if (alreadyBooked) {
      setSeatTrip(null)
      navigate('/student/my-reservations')
      return
    }

    // Guard: 1 go booking per day (regardless of place)
    if (!isReturn) {
      const existingGo = (myReservations||[]).find(r =>
        r.trip_date === trip.trip_date &&
        r.status !== 'cancelled' &&
        (r.trip_type === 'go' || !r.trip_type)
      )
      if (existingGo) {
        showToast(lang==='ar'
          ? '⚠️ لديك حجز ذهاب مسبق لهذا اليوم'
          : '⚠️ You already have a go booking for today', 'error')
        setSeatTrip(null)
        return
      }
    }

    // Guard: 1 return booking per day
    if (isReturn) {
      const existingReturn = (myReservations||[]).find(r =>
        r.trip_date === trip.trip_date &&
        r.status !== 'cancelled' &&
        r.trip_type === 'return'
      )
      if (existingReturn) {
        showToast(lang==='ar'
          ? '⚠️ لديك حجز عودة مسبق لهذا اليوم'
          : '⚠️ You already have a return booking for today', 'error')
        setSeatTrip(null)
        return
      }
    }

    // If trip departs within 30 min → instant confirm
    const isHalfHour = trip.trip_date === todayStr && isDepartingWithin30(actualTime) && (trip.available_seats > 0)
    // Status: pending_payment until payment is confirmed (or instant if subscription/half-hour)
    const initialStatus = (isHalfHour || hasSubscription) ? 'confirmed' : 'pending_confirm'

    // Price logic: round trip bundle = 105 shared, single = 55
    const ROUND_BUNDLE_PRICE = 105
    const ROUND_PRICE        = 105
  const SINGLE_PRICE       = 55
    const tripAmount = roundBooking
      ? (isReturn ? Math.round(ROUND_BUNDLE_PRICE / 2) : Math.round(ROUND_BUNDLE_PRICE / 2))
      : SINGLE_PRICE

    // مهلة التأكيد: ساعتين من الآن (أو حتى 30 دقيقة قبل الرحلة، أيهما أقل)
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    // لو الرحلة اليوم، اجعل المهلة 30 دقيقة قبلها
    let deadline = twoHoursLater
    if (trip.trip_date === new Date().toISOString().split('T')[0] && actualTime) {
      const [h, m] = actualTime.split(':').map(Number)
      const tripDateTime = new Date()
      tripDateTime.setHours(h, m, 0, 0)
      const thirtyMinBefore = new Date(tripDateTime.getTime() - 30 * 60 * 1000)
      if (thirtyMinBefore < twoHoursLater) deadline = thirtyMinBefore
    }

    const resData = {
      student: user?.id, student_name: user?.user_name,
      trip: trip.id, trip_place: trip.place_name, trip_place_en: trip.place_name_en||'',
      schedule_time: actualTime, trip_date: trip.trip_date,
      trip_type: actualTripType,
      status: initialStatus, amount: tripAmount, seat_number: seatNumber,
      payment_method: hasSubscription ? 'subscription' : null,
      payment_receipt: null,
      instant_confirm: isHalfHour,
      confirm_deadline: deadline.toISOString(),
    }
    const newRes = await createReservation(resData)
    refetch(); refetchMyRes(); setSeatTrip(null)

    // ── If subscription or instant → no payment screen needed ─────────────────
    if (hasSubscription || isHalfHour) {
      const msgAr = `✅ تم حجز المقعد ${seatNumber} — ${placeAr} ${actualTime}`
      const msgEn = `✅ Seat ${seatNumber} booked — ${placeEn} at ${actualTime}`
      addLocalNotification(msgAr, 'success', null, msgEn)
      navigate('/student/my-reservations')
      return
    }

    // ── If GO booking: navigate to my reservations directly ──────────────────
    if (!isReturn) {
      const msgAr = `✅ تم حجز الذهاب — مقعد ${seatNumber}`
      const msgEn = `✅ Go booked — seat ${seatNumber}`
      addLocalNotification(msgAr, 'success', null, msgEn)
      navigate('/student/my-reservations')
      return
    }

    // ── RETURN booking → navigate to my reservations ──────────────────────────
    const msgAr = `✅ تم حجز العودة — مقعد ${seatNumber}`
    const msgEn = `✅ Return booked — seat ${seatNumber}`
    addLocalNotification(msgAr, 'success', null, msgEn)
    navigate('/student/my-reservations')
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1000, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      {seatTrip && <SeatMap trip={seatTrip} lang={lang} onBook={handleBook} onClose={()=>{ setSeatTrip(null) }} myReservations={myReservations} userId={String(user?.id||'')} hasSubscription={hasSubscription} bookingAs={bookingAs} isHalfHourBooking={seatTrip.trip_date === todayStr && isDepartingWithin30(seatTrip.schedule_time)} pendingGoPrice={0}/>}

      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('available_trips')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {lang==='ar' ? `${todayTrips.length} رحلة متاحة` : `${todayTrips.length} trip(s) available`}
          </p>
        </div>

      </div>

      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>

      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:240, borderRadius:14 }}/>)}</div>}

      {!loading && filtered.length===0 && (
        <EmptyState icon={Bus} message={lang==='ar' ? 'لا توجد رحلات متاحة حالياً' : 'No trips available'}/>
      )}

      {!loading && filtered.length>0 && (
        <>
          {/* ── If there are return trips → show two sections ── */}
          {hasGroups && (
            <div style={{ marginBottom:12, padding:'10px 16px', background:'rgba(84,172,191,0.07)', borderRadius:10, border:'1px solid rgba(84,172,191,0.2)', fontSize:14, color:'var(--text-muted)' }}>
              {lang==='ar'
                ? '🚌 الرحلات مقسمة إلى ذهاب وعودة — احجز كلاً منهما بشكل منفصل'
                : '🚌 Trips are split into Outbound & Return — book each separately'}
            </div>
          )}

          {/* ── Go/Return tab switcher ── */}
          {hasGroups && (
            <div style={{ display:'flex', background:'var(--surface)', borderRadius:10, padding:5, marginBottom:14, border:'1px solid var(--border)', width:'fit-content' }}>
              {[
                { key:'go',     icon:'🚌', label: lang==='ar'?'ذهاب':'Outbound' },
                { key:'return', icon:'🔄', label: lang==='ar'?'عودة':'Return'   },
              ].map(tb => (
                <button key={tb.key} onClick={()=>setTripTab(tb.key)}
                  style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 20px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--font)',fontSize:15,fontWeight:700,transition:'all 0.2s',
                    background: tripTab===tb.key ? 'var(--calm)' : 'transparent',
                    color:      tripTab===tb.key ? 'white' : 'var(--text-muted)',
                  }}>
                  {tb.icon} {tb.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
            {(hasGroups ? (tripTab==='go' ? goTrips : returnTrips) : filtered).map((trip,i) => {
            // All trips are now separate go/return records — no more round type
            const isReturn  = trip.trip_type === 'return'
            const isGo      = !isReturn
            const displayTime = trip.schedule_time
            const displayType = trip.trip_type || 'go'

            // Compute locked state:
            // GO: locked if trip comes after the currently open go trip
            // RETURN: locked if student hasn't booked a go trip yet,
            //         OR if trip comes after the open return trip
            let locked
            if (isGo) {
              const goListIdx = goTripsSorted.findIndex(t => t.id === trip.id)
              locked = goListIdx > openGoIdx
            } else {
              const retListIdx = returnTripsSorted.findIndex(t => t.id === trip.id)
              locked = retListIdx > openReturnIdx
            }
            const full       = trip.available_seats <= 0
            const almostFull = trip.available_seats <= 5 && !full
            const placeName  = lang==='ar' ? trip.place_name : (trip.place_name_en||trip.place_name)
            const pct        = ((trip.bus_capacity-(trip.available_seats||0))/trip.bus_capacity)*100
            const userId     = String(user?.id || '')
            const alreadyBooked = userId && (myReservations||[]).some(r => {
              if (r.status === 'cancelled') return false
              if (Number(r.trip) !== trip.id) return false
              if (!(String(r.userId) === userId || String(r.student) === userId)) return false
              // For virtual round trip views: only match same trip_type
              if (trip._virtual_type != null) return (r.trip_type || 'go') === displayType
              return true
            })
            const isAC = trip.has_ac || trip.bus_ac
            const price = trip.price || 25

            // ── Dark info box style (used for all stat cells) ──
            const darkInfoBox = {
              textAlign:'center',
              padding:9,
              background:'var(--navy-2, #1a2744)',
              borderRadius:7,
              border:'1px solid var(--border)',
            }
            const darkInfoText = { fontSize:16, fontWeight:700, color:'var(--text-primary, #e8edf5)' }
            const darkInfoLabel = { fontSize:9, color:'var(--text-muted)', marginTop:2 }

            return (
              <div key={trip.id} className="card" style={{ padding:20, animation:`fadeUp ${0.1+i*0.04}s ease`, opacity:full?0.65:1, display:'flex', flexDirection:'column' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* ── Bus color/image box ── */}
                    <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', flexShrink:0, position:'relative' }}>
                      {trip.bus_image_url
                        ? <img src={trip.bus_image_url} alt="bus" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <div style={{ width:'100%', height:'100%', background: BUS_COLOR_HEX[trip.bus_color_en] || 'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Bus size={22} color={trip.bus_color_en==='White'||trip.bus_color_en===''?'var(--text-muted)':'rgba(0,0,0,0.45)'}/>
                          </div>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace', color:'var(--text-primary)' }}>{trip.bus_plate}</div>
                      <div style={{ fontSize:14, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                        {trip.bus_color && <span style={{ width:8, height:8, borderRadius:'50%', background:BUS_COLOR_HEX[trip.bus_color_en]||'var(--text-muted)', display:'inline-block', flexShrink:0 }}/>}
                        {trip.bus_capacity} {t('seats')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    {full ? <span className="badge badge-red">{lang==='ar'?'مكتملة':'Full'}</span>
                      : almostFull ? <span className="badge badge-amber">⚡ {trip.available_seats}</span>
                      : <span className="badge badge-green">{lang==='ar'?'متاحة':'Available'}</span>}
                    {/* AC badge → dark background */}
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10,
                      background: isAC ? 'rgba(114,138,110,0.25)' : 'var(--navy-2, #1a2744)',
                      color: isAC ? 'var(--blue-light)' : 'var(--text-secondary)',
                      border:`1px solid ${isAC?'rgba(114,138,110,0.4)':'var(--border)'}`,
                      fontWeight:600,
                    }}>
                      {isAC ? '❄️ ' + (lang==='ar'?'مكيف':'A/C') : '🌡️ '+(lang==='ar'?'غير مكيف':'No A/C')}
                    </span>
                  </div>
                </div>

                {/* Destination → dark */}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--navy-2, #1a2744)', borderRadius:8, marginBottom:10, border:'1px solid var(--border)' }}>
                  <MapPin size={16} color="var(--blue-light)"/>
                  <span style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{placeName}</span>
                </div>

                {/* Stats → all dark */}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8, marginBottom:10 }}>
                  {/* Time */}
                  <div style={darkInfoBox}>
                    <Clock size={14} color="var(--text-muted)" style={{ marginBottom:2 }}/>
                    <div style={darkInfoText}>{displayTime}</div>
                    <div style={darkInfoLabel}>{t('trip_time')}</div>
                  </div>
                  {/* Trip type */}
                  {trip.trip_type && (
                    <div style={darkInfoBox}>
                      <div style={{ ...darkInfoText, fontSize:18 }}>
                        {displayType === 'return' ? '🔄' : '🚌'}
                      </div>
                      <div style={darkInfoLabel}>
                        {displayType === 'return'
                          ? (lang==='ar' ? 'عودة' : 'Return')
                          : (lang==='ar' ? 'ذهاب' : 'Outbound')}
                      </div>
                    </div>
                  )}
                  {/* Available seats */}
                  <div style={darkInfoBox}>
                    <div style={{ ...darkInfoText, color: almostFull?'var(--amber)':full?'var(--red)':'var(--text-primary)' }}>
                      {trip.available_seats}
                    </div>
                    <div style={darkInfoLabel}>{t('available_seats')}</div>
                  </div>
                  {/* Price */}
                  <div style={{ ...darkInfoBox, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.35)' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#34d399' }}>{price}</div>
                    <div style={darkInfoLabel}>{lang==='ar'?'ج.م':'EGP'}</div>
                  </div>
                </div>

                {/* Spacer pushes button to bottom */}
                <div style={{ flex:1 }}/>

                {/* Progress bar */}
                <div style={{ height:4, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                  <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, transition:'width 0.5s', background:pct>90?'var(--red)':pct>70?'var(--amber)':'var(--calm)' }}/>
                </div>

                {/* Book button */}
                {locked ? (
                  <div style={{
                    width:'100%', padding:'11px 12px',
                    background:'rgba(255,255,255,0.03)',
                    border:'1px solid var(--border)',
                    borderRadius:8, display:'flex', alignItems:'center', gap:10,
                    color:'var(--text-muted)', fontSize:15, fontWeight:600,
                  }}>
                    <span style={{ fontSize:20 }}>🔒</span>
                    <div>
                      <div style={{ fontWeight:700 }}>
                        {lang==='ar'
                          ? (isReturn && !hasGoBooking ? 'احجز رحلة الذهاب أولاً' : 'الرحلة مغلقة حالياً')
                          : (isReturn && !hasGoBooking ? 'Book a go trip first' : 'Trip not open yet')}
                      </div>
                      <div style={{ fontSize:12, fontWeight:400, marginTop:2 }}>
                        {lang==='ar'
                          ? (isReturn && !hasGoBooking
                              ? 'رحلة العودة تُفتح بعد حجز الذهاب'
                              : 'تُفتح عند امتلاء الرحلة السابقة')
                          : (isReturn && !hasGoBooking
                              ? 'Return opens after booking outbound'
                              : 'Opens when previous trip fills up')}
                      </div>
                    </div>
                  </div>
                ) : alreadyBooked ? (() => {
                  const myRes = (myReservations||[]).find(r => {
                    if (r.status === 'cancelled') return false
                    return Number(r.trip) === trip.id &&
                      (String(r.userId) === userId || String(r.student) === userId)
                  })
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ width:'100%', padding:'10px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:16, fontWeight:700, color:'#34d399' }}>
                          ✅ {lang==='ar'?'تم الحجز بالفعل':'Already Booked'}
                        </span>
                        {myRes?.seat_number && (
                          <span style={{ fontSize:14, fontWeight:700, color:'#60a5fa', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.35)', borderRadius:6, padding:'3px 10px' }}>
                            {lang==='ar'?'مقعد':'Seat'} {myRes.seat_number}
                          </span>
                        )}
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ width:'100%', fontSize:14 }}
                        onClick={() => { navigate('/student/my-reservations') }}
                      >
                        📋 {lang==='ar'?'عرض حجوزاتي':'View My Reservations'}
                      </button>
                    </div>
                  )
                })() : (
                  <button className="btn btn-primary" style={{ width:'100%' }} disabled={full} onClick={()=>{ setRoundBooking(false); setBookingAs(tripTab === 'return' ? 'return' : 'go'); setSeatTrip(trip) }}>
                    {full ? (lang==='ar'?'الرحلة مكتملة':'Trip Full') : <><CheckCircle size={17}/> {lang==='ar'?`اختر مقعدك (${SINGLE_PRICE} ج.م)`:`Choose Seat (${SINGLE_PRICE} EGP)`}</>}
                  </button>
                )}
              </div>
            )
          })}
          </div>

        </>
      )}
    </div>
  )
}