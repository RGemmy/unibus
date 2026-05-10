import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, Search, Trash2, Timer, History, Calendar, QrCode, X, CheckCircle, User, AlertTriangle } from 'lucide-react'
import { useApi, useToast } from '../../hooks/useApi'
import { getReservations, cancelReservation, autoExpireReservations } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import ToastContainer from '../../components/Toast'
import { useIsMobile } from '../../hooks/useIsMobile'

// Live countdown display — shows h:mm or mm:ss depending on remaining time
function Countdown({ deadlineISO, lang }) {
  const calc = () => {
    if (!deadlineISO) return null
    const diff = new Date(deadlineISO).getTime() - Date.now()
    if (diff <= 0) return { expired: true, label: lang==='ar'?'انتهت':'Expired', urgent: false }
    const totalMins = Math.floor(diff / 60000)
    const hours     = Math.floor(totalMins / 60)
    const mins      = totalMins % 60
    const secs      = Math.floor((diff % 60000) / 1000)
    // If more than 1 hour remaining → show h:mm ساعة
    const label = hours > 0
      ? lang==='ar' ? `${hours}س ${String(mins).padStart(2,'0')}د` : `${hours}h ${String(mins).padStart(2,'0')}m`
      : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
    return { expired: false, label, urgent: diff < 30 * 60 * 1000 }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    if (!deadlineISO) return
    const iv = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(iv)
  }, [deadlineISO])
  if (!time) return <span style={{ color:'var(--text-muted)' }}>—</span>
  return (
    <span style={{
      fontFamily:'monospace', fontWeight:800, fontSize:14,
      color: time.expired ? 'var(--text-muted)' : time.urgent ? '#f87171' : '#54ACBF',
    }}>
      {time.label}
    </span>
  )
}



// ── QR Scanner Modal for Supervisor — Camera-based using jsQR ────────────────
function QRScannerModal({ allReservations, lang, onClose }) {
  const [scanResult,   setScanResult]   = useState(null)
  const [scanError,    setScanError]    = useState('')
  const [camError,     setCamError]     = useState('')
  const [scanning,     setScanning]     = useState(true)
  const videoRef  = useRef()
  const canvasRef = useRef()
  const streamRef = useRef()
  const rafRef    = useRef()

  // ── Start camera ────────────────────────────────────────────────────────────
  useEffect(() => {
    let stopped = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        setCamError(lang==='ar'
          ? '❌ تعذّر الوصول للكاميرا — تأكد من منح الإذن أو جرّب متصفحاً آخر'
          : '❌ Camera access denied — allow camera permission or try another browser')
      }
    }
    startCamera()
    return () => {
      stopped = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Scan loop using jsQR loaded from CDN ────────────────────────────────────
  useEffect(() => {
    if (!scanning) return
    let active = true

    async function loadJsQR() {
      if (window.jsQR) return window.jsQR
      return new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
        s.onload = () => resolve(window.jsQR)
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    function tick(jsQR) {
      if (!active || !videoRef.current || !canvasRef.current) return
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
        if (code) {
          handleScan(code.data)
          return // stop looping once found
        }
      }
      rafRef.current = requestAnimationFrame(() => tick(jsQR))
    }

    loadJsQR().then(jsQR => { if (active) tick(jsQR) }).catch(() => {
      setCamError(lang==='ar' ? '❌ فشل تحميل مكتبة السكانر' : '❌ Failed to load scanner library')
    })

    return () => { active = false; cancelAnimationFrame(rafRef.current) }
  }, [scanning])

  function parseQR(raw) {
    try {
      const data = JSON.parse(raw)
      if (data.type !== 'UNIBUS_TICKET') return null
      return data
    } catch { return null }
  }

  function lookupReservation(data) {
    if (!data) return null
    return (allReservations || []).find(r =>
      r.id === data.reservation_id || r.qr_token === data.token
    ) || null
  }

  function handleScan(raw) {
    setScanning(false)
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setScanError('')
    const data = parseQR(raw.trim())
    if (!data) {
      setScanError(lang==='ar' ? '❌ QR غير صالح أو ليس تذكرة UniBus' : '❌ Invalid QR or not a UniBus ticket')
      return
    }
    const res = lookupReservation(data)
    setScanResult({ qrData: data, reservation: res })
  }

  function handleRescan() {
    setScanResult(null)
    setScanError('')
    setScanning(true)
    // Restart camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      }).catch(() => {})
  }

  const res = scanResult?.reservation
  const qd  = scanResult?.qrData
  const isConfirmed = res?.status === 'confirmed'

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.95)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--navy-2,#0f1e2e)',border:'1px solid var(--border)',borderRadius:22,width:'100%',maxWidth:480,maxHeight:'95vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.9)',animation:'fadeUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'rgba(84,172,191,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <QrCode size={22} color="var(--calm,#54ACBF)"/>
            </div>
            <div>
              <h3 style={{ fontSize:17,fontWeight:800 }}>{lang==='ar'?'📷 سكان تذكرة الطالب':'📷 Scan Student Ticket'}</h3>
              <p style={{ fontSize:12,color:'var(--text-muted)' }}>{lang==='ar'?'وجّه الكاميرا نحو QR Code الطالب':'Point camera at student QR Code'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 7px',cursor:'pointer',color:'var(--text-muted)',display:'flex' }}><X size={18}/></button>
        </div>

        <div style={{ padding:20 }}>

          {/* ── Camera viewfinder ── */}
          {scanning && !camError && (
            <div style={{ position:'relative',width:'100%',aspectRatio:'4/3',background:'#000',borderRadius:14,overflow:'hidden',marginBottom:16 }}>
              <video ref={videoRef} playsInline muted style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
              <canvas ref={canvasRef} style={{ display:'none' }}/>
              {/* Targeting overlay */}
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                <div style={{ width:200,height:200,position:'relative' }}>
                  {/* Corner brackets */}
                  {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                    <div key={v+h} style={{ position:'absolute',[v]:0,[h]:0,width:32,height:32,
                      borderTop: v==='top'?'3px solid #34d399':'none',
                      borderBottom: v==='bottom'?'3px solid #34d399':'none',
                      borderLeft: h==='left'?'3px solid #34d399':'none',
                      borderRight: h==='right'?'3px solid #34d399':'none',
                    }}/>
                  ))}
                  {/* Scan line animation */}
                  <div style={{ position:'absolute',left:0,right:0,height:2,background:'rgba(52,211,153,0.7)',
                    animation:'scanLine 2s ease-in-out infinite',top:'50%' }}/>
                </div>
              </div>
              <div style={{ position:'absolute',bottom:10,left:0,right:0,textAlign:'center',fontSize:12,color:'rgba(255,255,255,0.7)',fontWeight:600 }}>
                {lang==='ar'?'ضع QR Code داخل الإطار':'Place QR Code inside the frame'}
              </div>
            </div>
          )}

          {/* Scan line animation style */}
          <style>{`@keyframes scanLine { 0%,100%{top:10%} 50%{top:90%} }`}</style>

          {/* Camera error */}
          {camError && (
            <div style={{ padding:'20px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.35)',borderRadius:14,color:'#f87171',fontWeight:700,fontSize:15,marginBottom:16,textAlign:'center' }}>
              {camError}
              <div style={{ fontSize:13,fontWeight:400,marginTop:8,color:'var(--text-muted)' }}>
                {lang==='ar'?'تأكد من أن المتصفح حصل على إذن الكاميرا وأعد تحميل الصفحة':'Ensure browser has camera permission and reload the page'}
              </div>
            </div>
          )}

          {/* Scan error */}
          {scanError && (
            <div style={{ padding:'16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.35)',borderRadius:12,color:'#f87171',fontWeight:700,fontSize:15,marginBottom:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
              <AlertTriangle size={20}/> {scanError}
              <button onClick={handleRescan} className="btn btn-sm" style={{ marginRight:'auto',background:'rgba(239,68,68,0.2)',color:'#f87171',border:'1px solid rgba(239,68,68,0.4)' }}>
                {lang==='ar'?'🔄 إعادة المسح':'🔄 Scan Again'}
              </button>
            </div>
          )}

          {/* ── Scan Result ── */}
          {scanResult && (
            <div style={{ border:`2px solid ${isConfirmed?'rgba(16,185,129,0.5)':'rgba(239,68,68,0.5)'}`,borderRadius:16,overflow:'hidden',animation:'fadeUp 0.2s ease' }}>
              {/* Status banner */}
              <div style={{ padding:'16px 18px',background:isConfirmed?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ fontSize:40 }}>{isConfirmed?'✅':'❌'}</div>
                <div>
                  <div style={{ fontSize:18,fontWeight:900,color:isConfirmed?'#34d399':'#f87171' }}>
                    {isConfirmed
                      ? (lang==='ar'?'تذكرة صالحة — يُسمح بالركوب ✓':'Valid Ticket — Boarding Allowed ✓')
                      : res
                        ? (lang==='ar'?`الحجز ${res.status==='cancelled'?'ملغي':'غير مؤكد'} — غير مسموح`:`Booking ${res.status} — Not Allowed`)
                        : (lang==='ar'?'غير موجود في النظام':'Not found in system')}
                  </div>
                  {res && <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:3 }}>#{res.id}</div>}
                </div>
              </div>

              {/* Student info */}
              <div style={{ padding:'16px 18px',borderTop:'1px solid var(--border)' }}>
                {/* Student name — large and prominent */}
                <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12,marginBottom:14 }}>
                  <div style={{ width:46,height:46,borderRadius:12,background:'rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <User size={26} color="#60a5fa"/>
                  </div>
                  <div>
                    <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:2 }}>{lang==='ar'?'اسم الطالب':'Student Name'}</div>
                    <div style={{ fontSize:22,fontWeight:900,color:'var(--text-primary)' }}>
                      {qd?.student_name || res?.student_name || res?.student || '—'}
                    </div>
                  </div>
                </div>

                {/* Trip details */}
                {[
                  { icon:'📍', label:lang==='ar'?'الوجهة':'Destination', val: lang==='ar'?(qd?.place_ar||res?.trip_place):(qd?.place_en||res?.trip_place_en||res?.trip_place) },
                  { icon:'📅', label:lang==='ar'?'التاريخ':'Date', val: qd?.date||res?.trip_date },
                  { icon:'🕐', label:lang==='ar'?'الوقت':'Time', val: qd?.time||res?.schedule_time },
                  { icon:'💺', label:lang==='ar'?'المقعد':'Seat', val: qd?.seat||res?.seat_number },
                  { icon:'🚌', label:lang==='ar'?'نوع الرحلة':'Trip Type', val: (qd?.trip_type||res?.trip_type)==='return'?(lang==='ar'?'عودة':'Return'):(lang==='ar'?'ذهاب':'Outbound') },
                  { icon:'💳', label:lang==='ar'?'الدفع':'Payment', val: (qd?.payment||res?.payment_method)==='instapay'?'InstaPay':(qd?.payment||res?.payment_method)==='subscription'?(lang==='ar'?'اشتراك':'Subscription'):(lang==='ar'?'كاش':'Cash') },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:14,color:'var(--text-muted)' }}>{row.icon} {row.label}</span>
                    <span style={{ fontSize:14,fontWeight:700 }}>{row.val||'—'}</span>
                  </div>
                ))}

                <button onClick={handleRescan} className="btn btn-secondary" style={{ width:'100%',marginTop:16,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <QrCode size={16}/> {lang==='ar'?'🔄 مسح تذكرة أخرى':'🔄 Scan Another Ticket'}
                </button>
              </div>
            </div>
          )}

          {/* Waiting state */}
          {scanning && !camError && !scanResult && (
            <div style={{ textAlign:'center',color:'var(--text-muted)',fontSize:13,marginTop:4 }}>
              {lang==='ar'?'جاري البحث عن QR Code...':'Looking for QR Code...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BusModReservations() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const today = new Date().toISOString().split('T')[0]
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showScanner,  setShowScanner]  = useState(false)
  const [viewMode,     setViewMode]     = useState('today') // 'today' | 'history'
  const [historyDate,  setHistoryDate]  = useState('')       // specific past date

  const { data: reservations, loading, refetch } = useApi(getReservations)
  const { toasts, showToast } = useToast()

  // Auto-expire every 30s
  useEffect(() => {
    const run = () => { autoExpireReservations(); refetch() }
    run()
    const iv = setInterval(run, 30_000)
    return () => clearInterval(iv)
  }, [])

  const statusCfg = {
    confirmed:      { label: lang==='ar'?'مؤكدة':'Confirmed',               cls:'badge-green' },
    pending_confirm:{ label: lang==='ar'?'بانتظار التأكيد':'Pending Confirm', cls:'badge-amber' },
    pending:        { label: lang==='ar'?'معلقة':'Pending',                  cls:'badge-amber' },
    cancelled:      { label: lang==='ar'?'ملغية':'Cancelled',                cls:'badge-red'   },
  }

  const allRes = (reservations||[])

  // ── Helper: is a date a working day? (exclude Fri=5, Sat=6) ──────────────────
  function isWorkingDay(dateStr) {
    const day = new Date(dateStr).getDay() // 0=Sun,1=Mon,...,5=Fri,6=Sat
    return day !== 5 && day !== 6
  }

  // ── Find the next working day from today (inclusive) ─────────────────────────
  function getNextWorkingDay() {
    const d = new Date()
    // try up to 7 days ahead
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d)
      dd.setDate(d.getDate() + i)
      const dateStr = dd.toISOString().split('T')[0]
      if (isWorkingDay(dateStr)) return dateStr
    }
    return today
  }
  const nextWorkingDay = getNextWorkingDay()

  // ── A reservation is "upcoming" only if its trip time hasn't passed yet
  //    AND its date is the next working day AND not Fri/Sat ──────────────────────
  const nowMs = Date.now()
  function tripMs(tripDate, schedTime) {
    try {
      const [hh, mm] = (schedTime || '23:59').split(':').map(Number)
      return new Date(`${tripDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`).getTime()
    } catch { return 0 }
  }

  const isUpcoming = r =>
    r.trip_date &&
    r.status !== 'cancelled' &&
    isWorkingDay(r.trip_date) &&
    tripMs(r.trip_date, r.schedule_time) > nowMs

  const isPast = r =>
    r.trip_date && r.status === 'confirmed' && tripMs(r.trip_date, r.schedule_time) <= nowMs

  const upcomingRes = allRes.filter(isUpcoming)
  const historyRes  = allRes.filter(isPast)

  // Past dates that actually have completed reservations
  const pastDates = [...new Set(historyRes.map(r => r.trip_date))].sort().reverse()

  // Filter by view mode — upcoming is always single day, no date tabs needed
  const dateFiltered = allRes.filter(r => {
    if (viewMode === 'today') {
      return isUpcoming(r)
    }
    if (viewMode === 'history') {
      if (!isPast(r)) return false
      return historyDate ? r.trip_date === historyDate : true
    }
    return true
  })

  // Apply search + status filter
  const filtered = dateFiltered.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.student_name?.toLowerCase().includes(q) || r.trip_place?.toLowerCase().includes(q) || r.trip_place_en?.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || r.status === statusFilter
    return matchQ && matchS
  })

  // pending_confirm first, then confirmed
  const sorted = [
    ...filtered.filter(r => r.status === 'pending_confirm'),
    ...filtered.filter(r => r.status !== 'pending_confirm'),
  ]

  const pendingCount   = upcomingRes.filter(r => r.status === 'pending_confirm').length
  const confirmedCount = upcomingRes.filter(r => r.status === 'confirmed').length
  const todayCount     = upcomingRes.length

  const statuses = viewMode === 'today'
    ? ['all','confirmed','pending_confirm']
    : [] // history shows confirmed only — no filter needed

  const statusLabel = {
    all:            lang==='ar'?'الكل':'All',
    confirmed:      lang==='ar'?'مؤكدة':'Confirmed',
    pending_confirm:lang==='ar'?'بانتظار التأكيد':'Pending Confirm',
    cancelled:      lang==='ar'?'ملغية':'Cancelled',
  }

  const handleDelete = async (id, partnerId = null) => {
    if (!window.confirm(lang==='ar'?'حذف هذا الحجز؟':'Delete this reservation?')) return
    try {
      await cancelReservation(id)
      if (partnerId) await cancelReservation(partnerId)
      refetch()
      showToast(lang==='ar'?'تم حذف الحجز':'Reservation deleted')
    } catch { showToast(lang==='ar'?'فشل الحذف':'Delete failed', 'error') }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      {showScanner && (
        <QRScannerModal
          allReservations={(reservations||[])}
          lang={lang}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('reservations')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {viewMode === 'today'
              ? (lang==='ar'
                  ? `الحجوزات القادمة · ${todayCount} حجز · ${confirmedCount} مؤكد${pendingCount > 0 ? ' · ' + pendingCount + ' بانتظار التأكيد' : ''}`
                  : `Upcoming Reservations · ${todayCount} total · ${confirmedCount} confirmed${pendingCount > 0 ? ' · ' + pendingCount + ' pending' : ''}`)
              : (lang==='ar' ? 'الحجوزات السابقة' : 'Past Reservations')}
          </p>
        </div>
        {/* QR Scanner Button */}
        <button
          onClick={() => setShowScanner(true)}
          style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 20px',
            background:'linear-gradient(135deg,rgba(84,172,191,0.2),rgba(26,61,84,0.15))',
            border:'1.5px solid rgba(84,172,191,0.5)',borderRadius:12,
            color:'var(--calm,#54ACBF)',fontSize:15,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
          <QrCode size={20}/>
          {lang==='ar'?'🔍 سكان تذكرة طالب':'🔍 Scan Student Ticket'}
        </button>
      </div>

      {/* ── Pending alert (today only) ── */}
      {viewMode === 'today' && pendingCount > 0 && (
        <div style={{
          marginBottom:18, padding:'12px 16px',
          background:'rgba(38,101,140,0.15)', border:'1px solid rgba(84,172,191,0.45)',
          borderRadius:12, display:'flex', alignItems:'center', gap:10,
          color:'#54ACBF', fontWeight:600, fontSize:15,
        }}>
          <Timer size={20}/>
          {lang==='ar'
            ? `${pendingCount} حجز بانتظار تأكيد الطلاب — ستُلغى تلقائياً قبل موعد الرحلة بـ 30 دقيقة`
            : `${pendingCount} reservation(s) awaiting confirmation — auto-cancel 30 min before trip`}
        </div>
      )}

      {/* ── View mode toggle ── */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <button
          onClick={() => { setViewMode('today'); setStatusFilter('all') }}
          className="btn"
          style={{
            display:'flex', alignItems:'center', gap:7,
            background: viewMode==='today' ? 'var(--calm)' : 'var(--surface)',
            color:       viewMode==='today' ? 'white' : 'var(--text-secondary)',
            border:`1px solid ${viewMode==='today'?'var(--calm)':'var(--border)'}`,
            fontFamily:'var(--font)',
          }}
        >
          <Calendar size={16}/>
          {lang==='ar' ? 'الحجوزات القادمة' : 'Upcoming Reservations'}
        </button>
        <button
          onClick={() => { setViewMode('history'); setStatusFilter('all') }}
          className="btn"
          style={{
            display:'flex', alignItems:'center', gap:7,
            background: viewMode==='history' ? 'var(--calm)' : 'var(--surface)',
            color:       viewMode==='history' ? 'white' : 'var(--text-secondary)',
            border:`1px solid ${viewMode==='history'?'var(--calm)':'var(--border)'}`,
            fontFamily:'var(--font)',
          }}
        >
          <History size={16}/>
          {lang==='ar' ? 'الحجوزات السابقة' : 'Past Reservations'}
        </button>
      </div>

      {/* ── History date picker ── */}
      {viewMode === 'history' && (
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:14, color:'var(--text-muted)' }}>
            {lang==='ar' ? 'تصفية بتاريخ:' : 'Filter by date:'}
          </span>
          <button
            onClick={() => setHistoryDate('')}
            className="btn btn-sm"
            style={{
              background: historyDate==='' ? 'var(--calm)' : 'var(--surface)',
              color:       historyDate==='' ? 'white' : 'var(--text-secondary)',
              border:`1px solid ${historyDate===''?'var(--calm)':'var(--border)'}`,
            }}
          >
            {lang==='ar' ? 'كل الأيام' : 'All Days'}
          </button>
          {pastDates.map(d => (
            <button key={d} onClick={() => setHistoryDate(d)} className="btn btn-sm"
              style={{
                background: historyDate===d ? 'var(--calm)' : 'var(--surface)',
                color:       historyDate===d ? 'white' : 'var(--text-secondary)',
                border:`1px solid ${historyDate===d?'var(--calm)':'var(--border)'}`,
              }}
            >
              {d}
            </button>
          ))}
          {pastDates.length === 0 && (
            <span style={{ fontSize:14, color:'var(--text-muted)', fontStyle:'italic' }}>
              {lang==='ar' ? 'لا توجد حجوزات سابقة' : 'No past reservations'}
            </span>
          )}
        </div>
      )}

      {/* ── Search + status filters ── */}
      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
        </div>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn"
            style={{
              background: statusFilter===s ? 'var(--calm)' : 'var(--surface)',
              color:       statusFilter===s ? 'white' : 'var(--text-secondary)',
              border:`1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`,
              fontFamily:'var(--font)',
            }}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {loading && Array(5).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:60, borderRadius:10, marginBottom:8 }}/>)}

      {!loading && sorted.length === 0 && (
        <EmptyState icon={BookOpen} message={
          viewMode === 'today'
            ? (lang==='ar' ? 'لا توجد حجوزات قادمة' : 'No upcoming reservations')
            : (lang==='ar' ? 'لا توجد حجوزات سابقة' : 'No past reservations')
        }/>
      )}

      {!loading && sorted.length > 0 && (
        <div className="card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {[
                  lang==='ar'?'الطالب':'Student',
                  lang==='ar'?'الرحلة':'Trip',
                  lang==='ar'?'التاريخ':'Date',
                  lang==='ar'?'الوقت':'Time',
                  lang==='ar'?'المقعد':'Seat',
                  lang==='ar'?'الحالة':'Status',
                  ...(viewMode === 'today' ? [lang==='ar'?'الوقت المتبقي':'Time Left'] : []),
                  '',
                ].map((h,i) => (
                  <th key={i} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-muted)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group go+return trips for same student+place into one row
                const groups = []
                const seen = new Set()
                sorted.forEach(r => {
                  if (seen.has(r.id)) return
                  const tripType = r.trip_type || 'go'
                  // Find matching return trip for same student+place (only if this is a go trip)
                  const partner = tripType === 'go'
                    ? sorted.find(r2 =>
                        !seen.has(r2.id) &&
                        r2.id !== r.id &&
                        (r2.trip_type === 'return') &&
                        (r2.student_name||r2.student) === (r.student_name||r.student) &&
                        r2.trip_date === r.trip_date
                      )
                    : null
                  if (partner) { seen.add(partner.id) }
                  seen.add(r.id)
                  groups.push({ main: r, partner })
                })
                return groups.map(({ main: r, partner }) => {
                  const isPending   = r.status === 'pending_confirm' || partner?.status === 'pending_confirm'
                  const isCancelled = r.status === 'cancelled' && (!partner || partner.status === 'cancelled')
                  const isRound     = !!partner
                  return (
                    <tr key={r.id} style={{
                      borderBottom:'1px solid rgba(255,255,255,0.04)',
                      background: isPending   ? 'rgba(245,158,11,0.04)'
                                : isCancelled ? 'rgba(239,68,68,0.03)' : undefined,
                      opacity: isCancelled ? 0.6 : 1,
                    }}>
                      {/* Student */}
                      <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>
                        {isPending && <Timer size={13} style={{ color:'var(--amber)', marginLeft:5, verticalAlign:'middle' }}/>}
                        {r.student_name||r.student}
                        {isRound && (
                          <span style={{ marginRight:6, fontSize:11, padding:'2px 7px', borderRadius:8, background:'rgba(38,101,140,0.15)', border:'1px solid rgba(38,101,140,0.3)', color:'#54ACBF', fontWeight:700 }}>
                            🔁 {lang==='ar'?'ذهاب وعودة':'Round'}
                          </span>
                        )}
                      </td>
                      {/* Trip */}
                      <td style={{ padding:'12px 16px', fontSize:15, color:'var(--text-muted)' }}>
                        {lang==='ar' ? r.trip_place : (r.trip_place_en||r.trip_place)}
                      </td>
                      {/* Date */}
                      <td style={{ padding:'12px 16px', fontSize:15 }}>{r.trip_date}</td>
                      {/* Time — show go+return if round */}
                      <td style={{ padding:'12px 16px', fontSize:14 }}>
                        {isRound ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            <span style={{ color:'#60a5fa' }}>🚌 {r.schedule_time}</span>
                            <span style={{ color:'#34d399' }}>🔄 {partner.schedule_time}</span>
                          </div>
                        ) : r.schedule_time}
                      </td>
                      {/* Seat — show both if round */}
                      <td style={{ padding:'12px 16px', fontSize:15 }}>
                        {isRound ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            <span>{r.seat_number || '—'}</span>
                            <span style={{ color:'var(--text-muted)' }}>{partner.seat_number || '—'}</span>
                          </div>
                        ) : (r.seat_number || '—')}
                      </td>
                      {/* Status */}
                      <td style={{ padding:'12px 16px' }}>
                        {isRound ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            <span className={`badge ${statusCfg[r.status]?.cls||'badge-blue'}`} style={{ fontSize:11 }}>{statusCfg[r.status]?.label||r.status}</span>
                            <span className={`badge ${statusCfg[partner.status]?.cls||'badge-blue'}`} style={{ fontSize:11 }}>{statusCfg[partner.status]?.label||partner.status}</span>
                          </div>
                        ) : (
                          <span className={`badge ${statusCfg[r.status]?.cls||'badge-blue'}`}>{statusCfg[r.status]?.label||r.status}</span>
                        )}
                      </td>
                      {/* Countdown — only in upcoming mode */}
                      {viewMode === 'today' && (
                        <td style={{ padding:'12px 16px' }}>
                          {r.status === 'pending_confirm' && r.confirm_deadline
                            ? <Countdown deadlineISO={r.confirm_deadline} lang={lang}/>
                            : partner?.status === 'pending_confirm' && partner?.confirm_deadline
                              ? <Countdown deadlineISO={partner.confirm_deadline} lang={lang}/>
                              : <span style={{ color:'var(--text-muted)', fontSize:14 }}>—</span>
                          }
                        </td>
                      )}
                      {/* Delete */}
                      <td style={{ padding:'12px 16px' }}>
                        {!isCancelled && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, partner?.id || null)}>
                            <Trash2 size={15}/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
