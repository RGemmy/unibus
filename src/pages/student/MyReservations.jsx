import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BookOpen, Bus, Clock, MapPin, XCircle, Hash, CheckCircle, AlertTriangle, Timer, QrCode, X, Phone, Banknote, ArrowRight, Upload, Banknote as BanknoteIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import NoShowResolutionCard from '../../components/NoShowResolutionCard'
import { useApi, useToast } from '../../hooks/useApi'
import mock, { runAutoNoShow } from '../../services/mockDb'
import { useNavigate } from 'react-router-dom'
import { getMyReservations, cancelReservation, confirmReservation, updateReservation, autoExpireReservations, checkAndSendWarnings, isCashBlocked, getCashStrikeCount } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(deadlineISO) {
  const calc = () => {
    if (!deadlineISO) return null
    const diff = new Date(deadlineISO).getTime() - Date.now()
    if (diff <= 0) return { expired: true, minutes: 0, seconds: 0, total: 0 }
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return { expired: false, minutes, seconds, total: diff }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    if (!deadlineISO) return
    const iv = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(iv)
  }, [deadlineISO])
  return time
}

const INSTAPAY_NUMBER = '01001234567'
const INSTAPAY_NAME   = 'UniBus - نظام النقل الجامعي'

// ── Payment Modal (shown from My Reservations after booking) ─────────────────
function PaymentModal({ r, lang, onClose, onPaid, userId }) {
  const [step, setStep]             = useState('choose')
  const [method, setMethod]         = useState(null)
  const [receipt, setReceipt]       = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const price = r.amount || 25
  const placeName = lang==='ar' ? r.trip_place : (r.trip_place_en || r.trip_place)
  const cashBlocked = userId ? isCashBlocked(userId) : false
  const strikeCount = userId ? getCashStrikeCount(userId) : 0

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setReceipt(ev.target.result); setReceiptPreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(selectedMethod, selectedReceipt) {
    setSubmitting(true)
    await onPaid(r.id, selectedMethod, selectedReceipt)
    setSubmitting(false)
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--navy-2,#0f1e2e)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:460,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.7)',animation:'fadeUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:18,fontWeight:800 }}>💳 {lang==='ar'?'إتمام الدفع':'Complete Payment'}</h3>
            <p style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>
              {placeName} · {lang==='ar'?`مقعد ${r.seat_number}`:`Seat ${r.seat_number}`} · <strong style={{ color:'#34d399' }}>{price} {lang==='ar'?'ج.م':'EGP'}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 7px',cursor:'pointer',color:'var(--text-secondary)',display:'flex' }}><X size={18}/></button>
        </div>

        <div style={{ padding:24 }}>
          {step === 'choose' && (
            <>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:16,color:'var(--text-secondary)',textAlign:'center' }}>
                {lang==='ar'?'اختر طريقة الدفع':'Choose payment method'}
              </div>

              {/* ── Cash warning / block note ── */}
              {cashBlocked ? (
                <div style={{ marginBottom:16,padding:'12px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:12,display:'flex',gap:10,alignItems:'flex-start' }}>
                  <span style={{ fontSize:22,flexShrink:0 }}>🚫</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:800,color:'#f87171' }}>
                      {lang==='ar' ? 'تم حظر الدفع بالكاش' : 'Cash payment blocked'}
                    </div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:3 }}>
                      {lang==='ar'
                        ? `لقد سجّلت ${strikeCount} مرات حجز بكاش وعدم ركوب. يمكنك الدفع عبر InstaPay فقط.`
                        : `You have ${strikeCount} cash no-shows on record. InstaPay is your only available payment method.`}
                    </div>
                  </div>
                </div>
              ) : strikeCount > 0 ? (
                <div style={{ marginBottom:16,padding:'12px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.35)',borderRadius:12,display:'flex',gap:10,alignItems:'flex-start' }}>
                  <span style={{ fontSize:20,flexShrink:0 }}>⚠️</span>
                  <div style={{ fontSize:13,color:'#fbbf24' }}>
                    <strong>
                      {lang==='ar'
                        ? `تنبيه: لديك ${strikeCount} من أصل 3 مخالفات كاش`
                        : `Warning: ${strikeCount} of 3 cash violations recorded`}
                    </strong>
                    <div style={{ marginTop:3,color:'var(--text-muted)' }}>
                      {lang==='ar'
                        ? `لو اخترت كاش ومجتش ${3 - strikeCount} ${3 - strikeCount === 1 ? 'مرة' : 'مرات'} تانية، هيتم حظرك من الدفع بالكاش نهائياً.`
                        : `If you select cash and don't show up ${3 - strikeCount} more time(s), cash will be permanently blocked for you.`}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom:16,padding:'10px 14px',background:'rgba(84,172,191,0.07)',border:'1px solid rgba(84,172,191,0.2)',borderRadius:12,fontSize:13,color:'var(--text-muted)' }}>
                  ℹ️ {lang==='ar'
                    ? 'تنبيه: لو اخترت كاش ولم تركب 3 مرات، سيتم حظر خيار الكاش عندك نهائياً.'
                    : 'Note: Selecting cash and not boarding 3 times will permanently block cash payments for you.'}
                </div>
              )}

              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <button onClick={()=>{ setMethod('instapay'); setStep('instapay') }}
                  style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:'linear-gradient(135deg,rgba(84,172,191,0.1),rgba(26,61,84,0.08))',border:'2px solid rgba(84,172,191,0.4)',borderRadius:14,cursor:'pointer',width:'100%',color:'var(--text-primary)' }}>
                  <div style={{ width:48,height:48,borderRadius:12,background:'rgba(84,172,191,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Phone size={24} color="var(--calm,#54ACBF)"/>
                  </div>
                  <div style={{ flex:1,textAlign:'right' }}>
                    <div style={{ fontSize:17,fontWeight:700,color:'var(--text-primary)' }}>InstaPay</div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{lang==='ar'?'تحويل فوري + رفع إيصال':'Instant transfer + upload receipt'}</div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)"/>
                </button>

                <button onClick={()=>{ setMethod('cash'); handleSubmit('cash', null) }}
                  style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background: cashBlocked ? 'rgba(239,68,68,0.05)' : 'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(26,61,84,0.04))',border:`2px solid ${cashBlocked ? 'rgba(239,68,68,0.25)' : 'rgba(201,168,76,0.3)'}`,borderRadius:14,cursor: cashBlocked ? 'not-allowed' : 'pointer',width:'100%',color: cashBlocked ? 'var(--text-muted)' : 'var(--text-primary)',opacity: cashBlocked ? 0.5 : 1 }}
                  disabled={submitting || cashBlocked}>
                  <div style={{ width:48,height:48,borderRadius:12,background:'rgba(201,168,76,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Banknote size={24} color="#d97706"/>
                  </div>
                  <div style={{ flex:1,textAlign:'right' }}>
                    <div style={{ fontSize:17,fontWeight:700,color: cashBlocked ? '#f87171' : 'var(--text-primary)' }}>{cashBlocked ? (lang==='ar'?'🚫 كاش — محظور':'🚫 Cash — Blocked') : (lang==='ar'?'💵 كاش':'💵 Cash')}</div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{cashBlocked ? (lang==='ar'?'تم حظرك بسبب عدم الركوب مسبقاً':'Blocked due to previous no-shows') : (lang==='ar'?'ادفع للمشرف عند الركوب':'Pay supervisor when boarding')}</div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)"/>
                </button>
              </div>
            </>
          )}

          {step === 'instapay' && (
            <>
              <div style={{ padding:'14px 16px',background:'rgba(84,172,191,0.07)',border:'1px solid rgba(84,172,191,0.3)',borderRadius:12,marginBottom:16 }}>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--calm,#54ACBF)',marginBottom:8 }}>📲 {lang==='ar'?'بيانات التحويل:':'Transfer Details:'}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'الرقم:':'Number:'}</span>
                    <span style={{ fontWeight:700,fontFamily:'monospace',color:'var(--text-primary)' }}>{INSTAPAY_NUMBER}</span>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'الاسم:':'Name:'}</span>
                    <span style={{ fontWeight:700,color:'var(--text-primary)' }}>{INSTAPAY_NAME}</span>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'المبلغ:':'Amount:'}</span>
                    <span style={{ fontWeight:900,color:'#34d399',fontSize:18 }}>{price} {lang==='ar'?'ج.م':'EGP'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:14,fontWeight:700,marginBottom:8,display:'block',color:'var(--text-secondary)' }}>
                  📎 {lang==='ar'?'ارفع إيصال التحويل:':'Upload transfer receipt:'}
                </label>
                <input type="file" ref={fileRef} accept="image/*" style={{ display:'none' }} onChange={handleFileChange}/>
                <button onClick={()=>fileRef.current?.click()}
                  style={{ width:'100%',padding:'14px',border:'2px dashed var(--border)',borderRadius:10,background:'var(--surface)',cursor:'pointer',color:'var(--text-secondary)',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <Upload size={20}/> {lang==='ar'?'اختر صورة الإيصال':'Select receipt image'}
                </button>
                {receiptPreview && (
                  <div style={{ marginTop:10,position:'relative' }}>
                    <img src={receiptPreview} alt="receipt" style={{ width:'100%',borderRadius:10,maxHeight:180,objectFit:'cover',border:'1px solid var(--border)' }}/>
                    <div style={{ position:'absolute',top:6,right:6,background:'rgba(16,185,129,0.9)',borderRadius:6,padding:'3px 8px',fontSize:12,color:'white',fontWeight:700 }}>✓ {lang==='ar'?'تم الرفع':'Uploaded'}</div>
                  </div>
                )}
              </div>

              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>setStep('choose')} className="btn btn-secondary" style={{ flex:1 }}>{lang==='ar'?'رجوع':'Back'}</button>
                <button onClick={()=>handleSubmit('instapay', receipt)} className="btn btn-primary" style={{ flex:2 }} disabled={!receipt||submitting}>
                  {submitting
                    ? <div style={{ width:15,height:15,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto' }}/>
                    : <><CheckCircle size={16}/> {lang==='ar'?'تأكيد الدفع':'Confirm Payment'}</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── QR Ticket Modal ─────────────────────────────────────────────────────────
function QRTicketModal({ r, lang, onClose }) {
  const isMobile = useIsMobile()
  const qrData = JSON.stringify({
    type: 'UNIBUS_TICKET',
    token: r.qr_token || `UNIBUS-${r.id}`,
    reservation_id: r.id,
    student_name: r.student_name || r.student || '',
    student_id: r.userId || r.student,
    trip_id: r.trip,
    seat: r.seat_number,
    place_ar: r.trip_place,
    place_en: r.trip_place_en || r.trip_place,
    time: r.schedule_time,
    date: r.trip_date,
    trip_type: r.trip_type || 'go',
    payment: r.payment_method || 'cash',
    amount: r.amount,
    status: 'confirmed',
  })
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--navy-2,#0f1e2e)',border:'1px solid var(--border)',borderRadius:22,width:'100%',maxWidth:400,boxShadow:'0 32px 80px rgba(0,0,0,0.7)',animation:'fadeUp 0.25s ease',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(16,185,129,0.06)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(16,185,129,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <QrCode size={20} color="#34d399"/>
            </div>
            <div>
              <h3 style={{ fontSize:16,fontWeight:800,color:'#34d399' }}>{lang==='ar'?'🎫 تذكرة الركوب':'🎫 Boarding Ticket'}</h3>
              <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:1 }}>{lang==='ar'?'أرِها للمشرف عند الركوب':'Show to supervisor when boarding'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 7px',cursor:'pointer',color:'var(--text-muted)',display:'flex' }}><X size={18}/></button>
        </div>

        {/* QR Code */}
        <div style={{ padding: isMobile ? '14px 12px' : '24px 20px',textAlign:'center' }}>
          <div style={{ display:'inline-block',padding:14,background:'white',borderRadius:16,boxShadow:'0 4px 32px rgba(0,0,0,0.4)',marginBottom:20 }}>
            <img src={qrUrl} alt="QR" width={200} height={200} style={{ display:'block',borderRadius:4 }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
            <div style={{ width:200,height:200,display:'none',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,background:'#f8fafc',borderRadius:8 }}>
              <QrCode size={80} color="#94a3b8"/>
              <span style={{ fontSize:11,color:'#64748b' }}>QR Code</span>
            </div>
          </div>

          {/* Student Info */}
          <div style={{ padding:'14px 16px',background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12,marginBottom:12,textAlign:'right' }}>
            <div style={{ fontSize:13,fontWeight:700,color:'#60a5fa',marginBottom:8 }}>👤 {lang==='ar'?'بيانات الطالب':'Student Info'}</div>
            <div style={{ fontSize:17,fontWeight:800,color:'var(--text-primary)',marginBottom:2 }}>{r.student_name || r.student}</div>
          </div>

          {/* Trip Info */}
          {[
            { icon:'📍', label:lang==='ar'?'الوجهة':'Destination', val: lang==='ar'?r.trip_place:(r.trip_place_en||r.trip_place) },
            { icon:'📅', label:lang==='ar'?'التاريخ':'Date', val: r.trip_date },
            { icon:'🕐', label:lang==='ar'?'الوقت':'Time', val: r.schedule_time },
            { icon:'💺', label:lang==='ar'?'المقعد':'Seat', val: String(r.seat_number) },
          ].map(row => (
            <div key={row.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'var(--text-muted)',fontSize:14 }}>{row.icon} {row.label}</span>
              <span style={{ fontWeight:700,fontSize:14 }}>{row.val}</span>
            </div>
          ))}

          {/* Payment method row */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color:'var(--text-muted)',fontSize:14 }}>{lang==='ar'?'طريقة الدفع':'Payment'}</span>
            <span style={{ fontWeight:700,fontSize:14 }}>
              {r.payment_method==='instapay' ? 'InstaPay' : r.payment_method==='subscription' ? (lang==='ar'?'اشتراك':'Subscription') : (lang==='ar'?'كاش':'Cash')}
            </span>
          </div>

          <div style={{ marginTop:16,padding:'8px 14px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:10,fontSize:13,color:'#34d399',fontWeight:600 }}>
            ✅ {lang==='ar'?'الحجز مؤكد — يُسمح بالركوب':'Booking Confirmed — Boarding Allowed'}
          </div>
        </div>
      </div>
    </div>
  )
}


function ReservationCard({ r, lang, isMobile, onCancel, onConfirm, onConfirmWithPay, onShowQR, onPay, onAddReturn, hasReturnForDay, pairedReturn, onConfirmBoth }) {
  const countdown = useCountdown(r.confirm_deadline)
  const isPending = r.status === 'pending_confirm'
  const isPendingPayment = r.status === 'pending_payment'
  const isNoShow = r.status === 'no_show'
  const isExpired = isPending && countdown?.expired

  const urgency = isPending && countdown && !countdown.expired
    ? countdown.total < 10 * 60 * 1000  // < 10 min
      ? 'critical'
      : countdown.total < 30 * 60 * 1000 // < 30 min → show countdown
        ? 'warning'
        : 'calm'   // > 30 min → just show deadline text, no countdown
    : 'none'

  const borderColor = isExpired
    ? 'rgba(239,68,68,0.5)'
    : urgency === 'critical' ? 'rgba(239,68,68,0.5)'
    : urgency === 'warning'  ? 'rgba(245,158,11,0.5)'
    : urgency === 'calm'     ? 'rgba(59,130,246,0.3)'
    : r.status === 'confirmed'       ? 'rgba(16,185,129,0.25)'
    : isPendingPayment               ? 'rgba(84,172,191,0.4)'
    : 'var(--border)'

  const iconBg = isPending
    ? urgency === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'
    : isPendingPayment ? 'rgba(84,172,191,0.12)'
    : r.status === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)'

  const iconColor = isPending
    ? urgency === 'critical' ? '#f87171' : 'var(--amber)'
    : isPendingPayment ? 'var(--calm,#54ACBF)'
    : r.status === 'confirmed' ? '#34d399' : 'var(--text-muted)'

  const placeName = lang === 'ar' ? r.trip_place : (r.trip_place_en || r.trip_place)

  const statusBadge = {
    confirmed:       { label: lang==='ar'?'مؤكدة':'Confirmed',                  cls:'badge-green' },
    pending_confirm: { label: lang==='ar'?'بانتظار التأكيد':'Pending Confirm',  cls:'badge-amber' },
    pending_payment: { label: lang==='ar'?'بانتظار الدفع':'Pending Payment',    cls:'badge-amber' },
    pending:         { label: lang==='ar'?'معلقة':'Pending',                    cls:'badge-amber' },
    cancelled:       { label: lang==='ar'?'ملغية':'Cancelled',                  cls:'badge-red'   },
    no_show:         { label: lang==='ar'?'لم تحضر':'No Show',                  cls:'badge-red'   },
  }

  return (
    <div className="card" style={{
      padding:18, transition:'all 0.2s',
      opacity: r.status === 'cancelled' ? 0.6 : 1,
      border: `1px solid ${borderColor}`,
      background: urgency === 'critical' ? 'rgba(239,68,68,0.04)'
               : urgency === 'warning'   ? 'rgba(245,158,11,0.04)' : undefined,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
        {/* Icon */}
        <div style={{
          width:50, height:50, borderRadius:13, flexShrink:0,
          background: iconBg, border:`1px solid ${borderColor}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {isPending
            ? <Timer size={26} color={iconColor}/>
            : <Bus size={26} color={iconColor}/>
          }
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{placeName}</div>
          {/* Info: mobile → time+date in one row, seat below | desktop → all in one row */}
          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:14, color:'var(--text-muted)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                  <Clock size={13}/> {r.schedule_time}
                </span>
                <span style={{ color:'var(--border)' }}>·</span>
                <span style={{ display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                  <MapPin size={13}/> {r.trip_date}
                </span>
              </div>
              {r.seat_number && (
                <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--matcha)', fontWeight:700 }}>
                  <Hash size={13}/>
                  {lang==='ar'?'مقعد':'Seat'} {r.seat_number}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:0, fontSize:14, color:'var(--text-muted)', flexWrap:'nowrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', paddingInlineEnd:12 }}>
                <Clock size={14}/> {r.schedule_time}
              </span>
              <span style={{ color:'var(--border)', paddingInlineEnd:12 }}>·</span>
              <span style={{ display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', paddingInlineEnd:12 }}>
                <MapPin size={14}/> {r.trip_date}
              </span>
              {r.seat_number && (
                <>
                  <span style={{ color:'var(--border)', paddingInlineEnd:12 }}>·</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--matcha)', fontWeight:700, whiteSpace:'nowrap' }}>
                    <Hash size={14}/>
                    {lang==='ar'?'مقعد':'Seat'} {r.seat_number}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <span className={`badge ${statusBadge[r.status]?.cls || 'badge-blue'}`}>
            {statusBadge[r.status]?.label || r.status}
          </span>
        </div>
      </div>

      {/* ── Pending confirm section ── */}
      {isPending && !isExpired && countdown && (
        <div style={{
          marginTop:14,
          padding:'14px 16px',
          background: urgency==='critical' ? 'rgba(239,68,68,0.08)' : urgency==='warning' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.04)',
          border:`1px solid ${urgency==='critical'?'rgba(239,68,68,0.3)':urgency==='warning'?'rgba(245,158,11,0.3)':'rgba(59,130,246,0.15)'}`,
          borderRadius:10,
        }}>
          {/* Warning banner — only when urgent */}
          {(urgency === 'critical' || urgency === 'warning') && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, color: urgency==='critical'?'#f87171':'var(--amber)', fontWeight:700, fontSize:15 }}>
              <AlertTriangle size={18}/>
              {lang==='ar'
                ? urgency==='critical' ? '⚡ أقل من 10 دقائق — أكد الآن!' : '⚠️ الوقت ينفد — أكد حجزك!'
                : urgency==='critical' ? '⚡ Less than 10 minutes — Confirm now!' : '⚠️ Time running out — Confirm your booking!'}
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div>
              {/* CALM state: just show deadline time, no countdown */}
              {urgency === 'calm' && (
                <div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6 }}>
                    {lang==='ar' ? 'يرجى تأكيد حجزك قبل' : 'Please confirm your booking before'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{
                      fontSize:22, fontWeight:800, color:'#60a5fa',
                      background:'rgba(59,130,246,0.1)', padding:'6px 14px',
                      borderRadius:8, letterSpacing:'0.5px',
                    }}>
                      🕐 {new Date(r.confirm_deadline).toLocaleTimeString(lang==='ar'?'ar-EG':'en-US', { hour:'2-digit', minute:'2-digit' })}
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>
                      {lang==='ar' ? 'وإلا سيُلغى الحجز تلقائياً' : 'or booking will be auto-cancelled'}
                    </div>
                  </div>
                </div>
              )}

              {/* WARNING / CRITICAL state: show live countdown */}
              {(urgency === 'warning' || urgency === 'critical') && (
                <div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
                    {lang==='ar' ? 'الوقت المتبقي للتأكيد' : 'Time left to confirm'}
                    {r.confirm_deadline && (
                      <span style={{ marginRight:6, marginLeft:6, fontSize:12, background:'rgba(255,255,255,0.07)', padding:'1px 7px', borderRadius:6 }}>
                        {lang==='ar' ? 'قبل' : 'by'} {new Date(r.confirm_deadline).toLocaleTimeString(lang==='ar'?'ar-EG':'en-US', { hour:'2-digit', minute:'2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize:28, fontWeight:900, fontVariantNumeric:'tabular-nums',
                    color: urgency==='critical'?'#f87171':'var(--amber)',
                    fontFamily:'monospace',
                  }}>
                    {String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons — show cancel always; confirm only when NOT paired (paired uses the banner button above) */}
            <div style={{ display:'flex', gap:10 }}>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => onCancel(r.id)}
                style={{ display:'flex', alignItems:'center', gap:6 }}
              >
                <XCircle size={16}/>
                {lang==='ar'?'إلغاء':'Cancel'}
              </button>
              {!pairedReturn && (
                <button
                  className="btn btn-sm"
                  onClick={() => onConfirmWithPay ? onConfirmWithPay(r) : onConfirm(r.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'#16a34a', color:'white', border:'none' }}
                >
                  <CheckCircle size={16}/>
                  {lang==='ar'?'تأكيد الحجز ✓':'Confirm Booking ✓'}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar — only when countdown is active */}
          {(urgency === 'warning' || urgency === 'critical') && r.confirm_deadline && (() => {
            const TOTAL_MS = 30 * 60 * 1000
            const pct = Math.max(0, Math.min(100, (countdown.total / TOTAL_MS) * 100))
            return (
              <div style={{ marginTop:12, height:5, background:'rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:10,
                  width:`${pct}%`,
                  background: urgency==='critical'?'#ef4444':'#f59e0b',
                  transition:'width 1s linear',
                }}/>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Pending payment section ── */}
      {isPendingPayment && (
        <div style={{ marginTop:14, padding:'14px 16px', background:'rgba(84,172,191,0.07)', border:'1px solid rgba(84,172,191,0.35)', borderRadius:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, color:'var(--calm,#54ACBF)', fontWeight:700, fontSize:15 }}>
            💳 {r.instant_confirm
              ? (lang==='ar' ? 'اختر طريقة الدفع — حجزك مؤكد!' : 'Choose payment method — your seat is secured!')
              : (lang==='ar' ? 'يرجى إتمام الدفع لتأكيد حجزك' : 'Please complete payment to confirm your booking')}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onCancel(r.id)}
              style={{ display:'flex', alignItems:'center', gap:6 }}
            >
              <XCircle size={16}/>
              {lang==='ar'?'إلغاء':'Cancel'}
            </button>
            <button
              onClick={() => onPay && onPay(r)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'9px 16px', background:'linear-gradient(135deg,rgba(84,172,191,0.25),rgba(59,130,246,0.15))',
                border:'1.5px solid rgba(84,172,191,0.5)', borderRadius:8,
                color:'var(--calm,#54ACBF)', fontSize:15, fontWeight:700, cursor:'pointer' }}
            >
              <Banknote size={18}/>
              {lang==='ar' ? `💳 ادفع الآن (${r.amount||25} ج.م)` : `💳 Pay Now (${r.amount||25} EGP)`}
            </button>
          </div>
        </div>
      )}

      {/* Expired */}
      {isExpired && (
        <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#f87171', fontWeight:700, textAlign:'center' }}>
          {lang==='ar' ? '❌ انتهت مهلة التأكيد — تم إلغاء الحجز تلقائياً' : '❌ Confirmation deadline expired — booking auto-cancelled'}
        </div>
      )}

      {/* ── No Show — اختيار استرداد أو رصيد ─────────────────────────────────── */}
      {isNoShow && (
        <NoShowResolutionCard
          entry={{
            id:              r.waitlist_entry_id || r.id,
            amount_paid:     r.amount || r.price || 55,
            resolution:      r.waitlist_resolution || 'pending',
            credit_valid_until: r.credit_valid_until || null,
          }}
          lang={lang}
          onChoose={async (entryId, choice) => {
            if (choice === 'refund') { await mock.chooseRefund(entryId) }
            else                     { await mock.chooseCredit(entryId) }
            r.waitlist_resolution = choice; refetch()
          }}
        />
      )}

      {/* Confirmed seat badge */}
      {r.seat_number && r.status === 'confirmed' && (
        <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(30,107,212,0.08)', border:'1px solid rgba(114,138,110,0.2)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:6, background:'var(--calm)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'white', flexShrink:0 }}>
            {r.seat_number}
          </div>
          <span style={{ fontSize:15, color:'var(--text-secondary)' }}>
            {lang==='ar' ? `مقعدك رقم ${r.seat_number} في الباص` : `Your seat number ${r.seat_number} on the bus`}
          </span>
        </div>
      )}

      {/* Confirmed: show QR ticket button */}
      {r.status === 'confirmed' && (
        <div style={{ marginTop:12, display:'flex', gap:8, alignItems:'center' }}>
          <button
            onClick={() => onShowQR && onShowQR(r)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'11px 16px', background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(59,130,246,0.1))',
              border:'1.5px solid rgba(16,185,129,0.4)', borderRadius:10,
              color:'#34d399', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            <QrCode size={18}/>
            {lang==='ar' ? '🎫 عرض تذكرة الركوب (QR)' : '🎫 Show Boarding Ticket (QR)'}
          </button>
        </div>
      )}

      {/* ── Add Return bundle button ──────────────────────────────────────────── */}
      {(r.trip_type === 'go' || !r.trip_type) && r.status !== 'cancelled' && !hasReturnForDay && onAddReturn && (
        <button
          onClick={() => onAddReturn(r)}
          style={{ marginTop:10, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 16px', background:'rgba(38,101,140,0.10)',
            border:'2px solid rgba(84,172,191,0.5)', borderRadius:10,
            color:'var(--calm,#54ACBF)', fontSize:15, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(38,101,140,0.22)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(38,101,140,0.10)'}
        >
          🔄 {lang==='ar'
            ? 'أضف رحلة العودة — باقة الذهاب والعودة 105 ج.م'
            : 'Add Return Trip — Go+Return bundle 105 EGP'}
        </button>
      )}
    </div>
  )
}

// ── Combined Payment Modal (go + return together) ────────────────────────────
function CombinedPaymentModal({ goRes, returnRes, lang, onClose, onPaid, userId }) {
  const [method, setMethod] = useState('cash')
  const [receipt, setReceipt] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [step, setStep] = useState('choose')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const total = 105 // round bundle price
  const goPlace  = lang==='ar' ? goRes.trip_place : (goRes.trip_place_en || goRes.trip_place)
  const retPlace = lang==='ar' ? returnRes.trip_place : (returnRes.trip_place_en || returnRes.trip_place)
  const cashBlocked = userId ? isCashBlocked(userId) : false
  const strikeCount = userId ? getCashStrikeCount(userId) : 0

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setReceipt(ev.target.result); setReceiptPreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setSubmitting(true)
    await onPaid([goRes.id, returnRes.id], method, method === 'instapay' ? receipt : null)
    setSubmitting(false)
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--navy-2,#0f1e2e)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:460,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,0.7)',animation:'fadeUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:18,fontWeight:800 }}>💳 {lang==='ar'?'دفع الحجزين معاً':'Pay for Both Trips'}</h3>
            <p style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>
              {lang==='ar' ? 'ذهاب + عودة — باقة مدمجة' : 'Outbound + Return — bundle deal'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 7px',cursor:'pointer',color:'var(--text-secondary)',display:'flex' }}><X size={18}/></button>
        </div>

        <div style={{ padding:24 }}>
          {/* Summary */}
          <div style={{ background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12,padding:'14px 16px',marginBottom:20 }}>
            <div style={{ fontSize:13,fontWeight:700,color:'#34d399',marginBottom:10 }}>{lang==='ar'?'ملخص الحجزين:':'Booking Summary:'}</div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)',marginBottom:6 }}>
              <span>🚌 {lang==='ar'?'ذهاب':'Outbound'} — {lang==='ar'?'مقعد':'seat'} {goRes.seat_number} · {goRes.schedule_time}</span>
              <span style={{ fontWeight:700 }}>55 {lang==='ar'?'ج.م':'EGP'}</span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)',marginBottom:10 }}>
              <span>🔄 {lang==='ar'?'عودة':'Return'} — {lang==='ar'?'مقعد':'seat'} {returnRes.seat_number} · {returnRes.schedule_time}</span>
              <span style={{ fontWeight:700 }}>50 {lang==='ar'?'ج.م':'EGP'}</span>
            </div>
            <div style={{ borderTop:'1px solid var(--border)',paddingTop:10,display:'flex',justifyContent:'space-between',fontSize:17,fontWeight:900,color:'#34d399' }}>
              <span>{lang==='ar'?'الإجمالي (خصم الباقة)':'Total (bundle discount)'}</span>
              <span>{total} {lang==='ar'?'ج.م':'EGP'}</span>
            </div>
          </div>

          {step === 'choose' && (
            <>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:14,color:'var(--text-secondary)',textAlign:'center' }}>
                {lang==='ar'?'اختر طريقة الدفع':'Choose payment method'}
              </div>

              {/* ── Cash warning / block note ── */}
              {cashBlocked ? (
                <div style={{ marginBottom:14,padding:'12px 14px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:12,display:'flex',gap:10,alignItems:'flex-start' }}>
                  <span style={{ fontSize:22,flexShrink:0 }}>🚫</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:800,color:'#f87171' }}>{lang==='ar'?'تم حظر الدفع بالكاش':'Cash payment blocked'}</div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:3 }}>{lang==='ar'?`لقد سجّلت ${strikeCount} مرات حجز بكاش وعدم ركوب. يمكنك الدفع عبر InstaPay فقط.`:`You have ${strikeCount} cash no-shows on record. InstaPay is your only option.`}</div>
                  </div>
                </div>
              ) : strikeCount > 0 ? (
                <div style={{ marginBottom:14,padding:'12px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.35)',borderRadius:12,fontSize:13,color:'#fbbf24' }}>
                  ⚠️ <strong>{lang==='ar'?`تنبيه: ${strikeCount}/3 مخالفات كاش`:`Warning: ${strikeCount}/3 cash violations`}</strong>
                  <div style={{ marginTop:3,color:'var(--text-muted)' }}>{lang==='ar'?`لو اخترت كاش ومجتش ${3-strikeCount} مرة تانية، هيتم حظرك نهائياً.`:`${3-strikeCount} more cash no-show(s) and cash will be permanently blocked.`}</div>
                </div>
              ) : (
                <div style={{ marginBottom:14,padding:'10px 14px',background:'rgba(84,172,191,0.07)',border:'1px solid rgba(84,172,191,0.2)',borderRadius:12,fontSize:13,color:'var(--text-muted)' }}>
                  ℹ️ {lang==='ar'?'لو اخترت كاش ولم تركب 3 مرات، سيتم حظر خيار الكاش نهائياً.':'Selecting cash and not boarding 3 times will permanently block cash payments.'}
                </div>
              )}

              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <button onClick={() => { setMethod('instapay'); setStep('instapay') }}
                  style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:'linear-gradient(135deg,rgba(84,172,191,0.1),rgba(26,61,84,0.08))',border:'2px solid rgba(84,172,191,0.4)',borderRadius:14,cursor:'pointer',width:'100%',color:'var(--text-primary)' }}>
                  <div style={{ width:48,height:48,borderRadius:12,background:'rgba(84,172,191,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Phone size={24} color="var(--calm,#54ACBF)"/>
                  </div>
                  <div style={{ flex:1,textAlign:'right' }}>
                    <div style={{ fontSize:17,fontWeight:700 }}>InstaPay</div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{lang==='ar'?'تحويل فوري + رفع إيصال':'Instant transfer + upload receipt'}</div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)"/>
                </button>

                <button onClick={() => { setMethod('cash'); handleSubmit() }}
                  style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background: cashBlocked?'rgba(239,68,68,0.05)':'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(26,61,84,0.04))',border:`2px solid ${cashBlocked?'rgba(239,68,68,0.25)':'rgba(201,168,76,0.3)'}`,borderRadius:14,cursor:cashBlocked?'not-allowed':'pointer',width:'100%',color:cashBlocked?'var(--text-muted)':'var(--text-primary)',opacity:cashBlocked?0.5:1 }}
                  disabled={submitting || cashBlocked}>
                  <div style={{ width:48,height:48,borderRadius:12,background:'rgba(201,168,76,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Banknote size={24} color="#d97706"/>
                  </div>
                  <div style={{ flex:1,textAlign:'right' }}>
                    <div style={{ fontSize:17,fontWeight:700 }}>{cashBlocked?(lang==='ar'?'🚫 كاش — محظور':'🚫 Cash — Blocked'):(lang==='ar'?'💵 كاش':'💵 Cash')}</div>
                    <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{cashBlocked?(lang==='ar'?'تم حظرك بسبب عدم الركوب':'Blocked due to previous no-shows'):(lang==='ar'?'ادفع للمشرف عند الركوب':'Pay supervisor when boarding')}</div>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)"/>
                </button>
              </div>
            </>
          )}

          {step === 'instapay' && (
            <>
              <div style={{ padding:'14px 16px',background:'rgba(84,172,191,0.07)',border:'1px solid rgba(84,172,191,0.3)',borderRadius:12,marginBottom:16 }}>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--calm,#54ACBF)',marginBottom:8 }}>📲 {lang==='ar'?'بيانات التحويل:':'Transfer Details:'}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'الرقم:':'Number:'}</span>
                    <span style={{ fontWeight:700,fontFamily:'monospace' }}>{INSTAPAY_NUMBER}</span>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'الاسم:':'Name:'}</span>
                    <span style={{ fontWeight:700 }}>{INSTAPAY_NAME}</span>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:15 }}>
                    <span style={{ color:'var(--text-muted)' }}>{lang==='ar'?'المبلغ:':'Amount:'}</span>
                    <span style={{ fontWeight:900,color:'#34d399',fontSize:18 }}>{total} {lang==='ar'?'ج.م':'EGP'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:14,fontWeight:700,marginBottom:8,display:'block',color:'var(--text-secondary)' }}>
                  📎 {lang==='ar'?'ارفع إيصال التحويل:':'Upload transfer receipt:'}
                </label>
                <input type="file" ref={fileRef} accept="image/*" style={{ display:'none' }} onChange={handleFileChange}/>
                <button onClick={() => fileRef.current?.click()}
                  style={{ width:'100%',padding:'14px',border:'2px dashed var(--border)',borderRadius:10,background:'var(--surface)',cursor:'pointer',color:'var(--text-secondary)',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <Upload size={20}/> {lang==='ar'?'اختر صورة الإيصال':'Select receipt image'}
                </button>
                {receiptPreview && (
                  <div style={{ marginTop:10,position:'relative' }}>
                    <img src={receiptPreview} alt="receipt" style={{ width:'100%',borderRadius:10,maxHeight:180,objectFit:'cover',border:'1px solid var(--border)' }}/>
                    <div style={{ position:'absolute',top:6,right:6,background:'rgba(16,185,129,0.9)',borderRadius:6,padding:'3px 8px',fontSize:12,color:'white',fontWeight:700 }}>✓ {lang==='ar'?'تم الرفع':'Uploaded'}</div>
                  </div>
                )}
              </div>

              <div style={{ display:'flex',gap:10 }}>
                <button onClick={() => setStep('choose')} className="btn btn-secondary" style={{ flex:1 }}>{lang==='ar'?'رجوع':'Back'}</button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ flex:2 }} disabled={!receipt || submitting}>
                  {submitting
                    ? <div style={{ width:15,height:15,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto' }}/>
                    : <><CheckCircle size={16}/> {lang==='ar'?`تأكيد الدفع (${total} ج.م)`:`Confirm Payment (${total} EGP)`}</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function MyReservations() {
  const isMobile = useIsMobile()
  const { lang }  = useLanguage()
  const { user }  = useAuth()
  const { data: reservations, loading, error, refetch } = useApi(getMyReservations)
  const { toasts, showToast } = useToast()
  const { addLocalNotification } = useNotifications()
  const [successMsg, setSuccessMsg] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [qrReservation, setQrReservation] = useState(null)
  const [payReservation, setPayReservation] = useState(null)
  const [combinedPayModal, setCombinedPayModal] = useState(null) // { goRes, returnRes }
  const [addReturnGoRes, setAddReturnGoRes] = useState(null) // go reservation to pair with return

  // Check if current student has active subscription
  const hasSubscription = (() => {
    try {
      const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]')
      const userId = user?.id
      const today = new Date().toISOString().split('T')[0]
      return subs.some(s =>
        (String(s.student_id) === String(userId) || s.student === user?.user_name) &&
        s.status === 'active' &&
        (!s.end_date || s.end_date >= today)
      )
    } catch { return false }
  })()

  // Show booking success message
  useEffect(() => {
    const msg = sessionStorage.getItem('booking_success_msg')
    if (msg) {
      setSuccessMsg(msg)
      sessionStorage.removeItem('booking_success_msg')
      setTimeout(() => setSuccessMsg(''), 6000)
    }
  }, [])

  // Auto-expire + warnings check every 30s
  useEffect(() => {
    const run = () => { autoExpireReservations(); checkAndSendWarnings(); refetch() }
    run()
    const iv = setInterval(run, 30_000)
    return () => clearInterval(iv)
  }, [])

  const handleCancel = async (id) => {
    const res = (reservations||[]).find(r => r.id === id)
    try {
      await cancelReservation(id)
      refetch()
      const msgAr = res ? `❌ تم إلغاء حجزك — ${res.trip_place || ''} ${res.schedule_time || ''}` : '❌ تم إلغاء الحجز'
      const msgEn = res ? `❌ Reservation cancelled — ${res.trip_place_en || res.trip_place || ''} ${res.schedule_time || ''}` : '❌ Reservation cancelled'
      showToast(lang==='ar' ? msgAr : msgEn)
      addLocalNotification(msgAr, 'warning', null, msgEn)
      window.dispatchEvent(new Event('reservation-cancelled'))
    } catch { showToast(lang==='ar'?'فشل الإلغاء':'Failed to cancel', 'error') }
  }

  const [pendingQRId, setPendingQRId] = useState(null)

  // After refetch, if pendingQRId is set, open QR modal with fresh confirmed data
  useEffect(() => {
    if (pendingQRId && reservations) {
      const fresh = reservations.find(r => r.id === pendingQRId)
      if (fresh && fresh.status === 'confirmed') {
        setQrReservation(fresh)
        setPendingQRId(null)
      }
    }
  }, [reservations, pendingQRId])

  // Shared: confirm reservation then open QR
  const doConfirmAndOpenQR = async (id) => {
    const res = (reservations||[]).find(r => r.id === id)
    await confirmReservation(id)
    const msgAr = `✅ تم تأكيد حجزك — ${res?.trip_place || ''} ${res?.schedule_time || ''} — مقعد ${res?.seat_number || ''}`
    const msgEn = `✅ Booking confirmed — ${res?.trip_place_en || res?.trip_place || ''} at ${res?.schedule_time || ''} — Seat ${res?.seat_number || ''}`
    showToast(lang==='ar' ? msgAr : msgEn, 'success')
    addLocalNotification(msgAr, 'success', null, msgEn)
    setPendingQRId(id)
    refetch()
  }

  // Called from confirm button in card
  // → if subscriber: confirm directly → QR
  // → if not subscriber: open PaymentModal first
  const handleConfirmWithPay = (r) => {
    if (hasSubscription || r.payment_method === 'subscription') {
      doConfirmAndOpenQR(r.id).catch(() =>
        showToast(lang==='ar'?'فشل التأكيد':'Failed to confirm', 'error')
      )
    } else {
      setPayReservation(r)
    }
  }

  // Auto-open PaymentModal for instant bookings that are pending_payment
  React.useEffect(() => {
    if (!reservations) return
    const instantPending = reservations.find(r => r.instant_confirm && r.status === 'pending_payment')
    if (instantPending && !payReservation) {
      setPayReservation(instantPending)
    }
  }, [reservations])

  // Called from PaymentModal after choosing method
  // → save payment info then confirm → QR
  const handlePay = async (id, method, receipt) => {
    try {
      await updateReservation(id, {
        payment_method: method,
        payment_receipt: receipt || null,
      })
      setPayReservation(null)
      await doConfirmAndOpenQR(id)
    } catch { showToast(lang==='ar'?'فشل الدفع أو التأكيد':'Payment or confirm failed', 'error') }
  }

  const navigate = useNavigate()

  // Called when student taps "Add Return Trip" button on a go reservation card
  const handleAddReturn = (goRes) => {
    setAddReturnGoRes(goRes)
    // Navigate to trips page with return tab open + bundle mode
    navigate('/student/trips', { state: { openReturnTab: true, bundleGoRes: goRes } })
  }

  // Called from CombinedPaymentModal — pay both go + return together
  const handleCombinedPay = async (ids, method, receipt) => {
    try {
      await Promise.all(ids.map(id => updateReservation(id, {
        payment_method: method,
        payment_receipt: receipt || null,
      })))
      // Confirm both
      await Promise.all(ids.map(id => confirmReservation(id)))
      const msgAr = `✅ تم دفع وتأكيد الحجزين — إجمالي 105 ج.م (${method === 'instapay' ? 'InstaPay' : 'كاش'})`
      const msgEn = `✅ Both bookings paid & confirmed — 105 EGP (${method})`
      showToast(lang==='ar' ? msgAr : msgEn, 'success')
      addLocalNotification(msgAr, 'success', null, msgEn)
      setCombinedPayModal(null)
      refetch()
    } catch { showToast(lang==='ar'?'فشل الدفع':'Payment failed', 'error') }
  }

  // Combined confirm: go + return together → open CombinedPaymentModal
  const handleConfirmBoth = (goRes, returnRes) => {
    setCombinedPayModal({ goRes, returnRes })
  }

  // Legacy direct confirm (kept for compatibility, not used in student flow)
  const handleConfirm = async (id) => {
    try { await doConfirmAndOpenQR(id) }
    catch { showToast(lang==='ar'?'فشل التأكيد':'Failed to confirm', 'error') }
  }
  const all = (reservations||[])
  const dates = [...new Set(all.map(r => r.trip_date).filter(Boolean))].sort()

  const filtered = dateFilter === 'all' ? all : all.filter(r => r.trip_date === dateFilter)

  const pending        = all.filter(r => r.status === 'pending_confirm')
  const pendingPayment = all.filter(r => r.status === 'pending_payment')
  const noShowPending  = all.filter(r => r.status === 'no_show' && (!r.waitlist_resolution || r.waitlist_resolution === 'pending'))
  const active         = all.filter(r => r.status === 'confirmed' || r.status === 'pending_confirm' || r.status === 'pending_payment')

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:800, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      {qrReservation && <QRTicketModal r={qrReservation} lang={lang} onClose={() => setQrReservation(null)}/>}
      {payReservation && <PaymentModal r={payReservation} lang={lang} onClose={() => setPayReservation(null)} onPaid={handlePay} userId={String(user?.id||'')}/>}
      {combinedPayModal && <CombinedPaymentModal goRes={combinedPayModal.goRes} returnRes={combinedPayModal.returnRes} lang={lang} onClose={() => setCombinedPayModal(null)} onPaid={handleCombinedPay} userId={String(user?.id||'')}/>}

      {successMsg && (
        <div style={{
          marginBottom:20, padding:'14px 18px',
          background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.4)',
          borderRadius:12, fontSize:17, fontWeight:700, color:'#34d399',
          display:'flex', alignItems:'center', gap:10, animation:'fadeUp 0.3s ease'
        }}>
          <span style={{ fontSize:22 }}>✅</span> {successMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>
          {lang==='ar' ? 'حجوزاتي' : 'My Reservations'}
        </h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
          {all.length} {lang==='ar'?'حجز':'reservation(s)'}
          {active.length > 0 && ` · ${active.length} ${lang==='ar'?'نشط':'active'}`}
          {pending.length > 0 && ` · `}
          {pending.length > 0 && <span style={{ color:'var(--amber)', fontWeight:700 }}>{pending.length} {lang==='ar'?'بانتظار التأكيد':'pending confirm'}</span>}
          {pendingPayment.length > 0 && ` · `}
          {pendingPayment.length > 0 && <span style={{ color:'var(--calm,#54ACBF)', fontWeight:700 }}>{pendingPayment.length} {lang==='ar'?'بانتظار الدفع':'pending payment'}</span>}
        </p>
      </div>

      {/* Pending warning banner */}
      {pending.length > 0 && (
        <div style={{
          marginBottom:18, padding:'12px 16px',
          background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.35)',
          borderRadius:12, display:'flex', alignItems:'center', gap:10,
          color:'var(--amber)', fontWeight:600, fontSize:15,
        }}>
          <AlertTriangle size={20}/>
          {lang==='ar'
            ? `لديك ${pending.length} حجز بانتظار تأكيدك — أكد قبل انتهاء المهلة وإلا سيُلغى تلقائياً`
            : `You have ${pending.length} reservation(s) awaiting confirmation — confirm before the deadline or it will be auto-cancelled`}
        </div>
      )}

      {/* No Show banner */}
      {noShowPending.length > 0 && (
        <div style={{ marginBottom:18, padding:'13px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:12, display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight:600, color:'#f87171' }}>
          <AlertTriangle size={18}/>
          {lang==='ar'
            ? `⚠️ لم يُسجَّل حضورك في ${noShowPending.length} رحلة — اختر استرداد الفلوس أو رصيد لرحلة تانية`
            : `⚠️ No check-in recorded for ${noShowPending.length} trip(s) — choose refund or credit below`}
        </div>
      )}

      {/* Pending payment banner */}
      {pendingPayment.length > 0 && (
        <div style={{
          marginBottom:18, padding:'12px 16px',
          background:'rgba(84,172,191,0.08)', border:'1px solid rgba(84,172,191,0.35)',
          borderRadius:12, display:'flex', alignItems:'center', gap:10,
          color:'var(--calm,#54ACBF)', fontWeight:600, fontSize:15,
        }}>
          💳
          {lang==='ar'
            ? `لديك ${pendingPayment.length} حجز بانتظار الدفع — أكمل الدفع لتأكيد حجزك`
            : `You have ${pendingPayment.length} booking(s) awaiting payment — complete payment to confirm`}
        </div>
      )}

      {/* Combined Go+Return payment banner */}
      {(() => {
        // Find days where student has BOTH a go AND a return reservation unpaid
        const unpaidDays = [...new Set(all
          .filter(r => (r.status === 'pending_confirm' || r.status === 'pending_payment') && r.trip_date)
          .map(r => r.trip_date)
        )].filter(date => {
          const dayRes = all.filter(r => r.trip_date === date && r.status !== 'cancelled')
          const goR   = dayRes.find(r => r.trip_type === 'go' || !r.trip_type)
          const retR  = dayRes.find(r => r.trip_type === 'return')
          return goR && retR &&
            (goR.status === 'pending_confirm' || goR.status === 'pending_payment') &&
            (retR.status === 'pending_confirm' || retR.status === 'pending_payment')
        })
        if (unpaidDays.length === 0) return null
        return unpaidDays.map(date => {
          const dayRes = all.filter(r => r.trip_date === date && r.status !== 'cancelled')
          const goR   = dayRes.find(r => r.trip_type === 'go' || !r.trip_type)
          const retR  = dayRes.find(r => r.trip_type === 'return')
          return (
            <div key={date} style={{
              marginBottom:18, padding:'14px 18px',
              background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.07))',
              border:'2px solid rgba(16,185,129,0.4)',
              borderRadius:14, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
            }}>
              <div style={{ fontSize:28 }}>🔄</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#34d399', marginBottom:3 }}>
                  {lang==='ar' ? 'عندك ذهاب وعودة في نفس اليوم!' : 'You have Go + Return on the same day!'}
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>
                  {lang==='ar'
                    ? `${date} — ادفعهم مع بعض بسعر الباقة 105 ج.م`
                    : `${date} — pay both together at bundle price 105 EGP`}
                </div>
              </div>
              <button
                onClick={() => setCombinedPayModal({ goRes: goR, returnRes: retR })}
                style={{ display:'flex', alignItems:'center', gap:8,
                  padding:'11px 20px', background:'rgba(16,185,129,0.2)',
                  border:'2px solid rgba(16,185,129,0.6)', borderRadius:10,
                  color:'#34d399', fontSize:15, fontWeight:800, cursor:'pointer',
                  transition:'all 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.2)'}
              >
                <CheckCircle size={18}/>
                {lang==='ar' ? 'أكد ادفع الاثنين (105 ج.م)' : 'Confirm & Pay Both (105 EGP)'}
              </button>
            </div>
          )
        })
      })()}

      {/* Date filter tabs */}
      {dates.length > 1 && (
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
          <button
            onClick={() => setDateFilter('all')}
            className="btn btn-sm"
            style={{ background:dateFilter==='all'?'var(--calm)':'var(--surface)', color:dateFilter==='all'?'white':'var(--text-secondary)', border:`1px solid ${dateFilter==='all'?'var(--calm)':'var(--border)'}` }}
          >
            {lang==='ar'?'الكل':'All'}
          </button>
          {dates.map(d => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className="btn btn-sm"
              style={{ background:dateFilter===d?'var(--calm)':'var(--surface)', color:dateFilter===d?'white':'var(--text-secondary)', border:`1px solid ${dateFilter===d?'var(--calm)':'var(--border)'}` }}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {loading && Array(3).fill(0).map((_,i)=>
        <div key={i} className="skeleton" style={{ height:110, borderRadius:12, marginBottom:12 }}/>
      )}
      {error && <div style={{ padding:20, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'var(--red-light)' }}>{lang==='ar'?'فشل تحميل الحجوزات':'Failed to load reservations'}</div>}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={BookOpen} message={lang==='ar'?'لا توجد حجوزات — احجز رحلة الآن':'No reservations — book a trip now'}/>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* No Show — يظهر أول عشان يطلب من الطالب يختار */}
          {filtered.filter(r=>r.status==='no_show').map(r=>{
            return <ReservationCard key={r.id} r={r} lang={lang} isMobile={isMobile} onCancel={handleCancel} onConfirm={handleConfirm} onConfirmWithPay={handleConfirmWithPay} onShowQR={setQrReservation} onPay={setPayReservation} onAddReturn={handleAddReturn} hasReturnForDay={false}/>
          })}
          {/* Pending first */}
          {filtered.filter(r=>r.status==='pending_confirm'||r.status==='pending_payment').map(r=>{
            const hasReturnForDay = all.some(x => x.trip_date===r.trip_date && (x.trip_type==='return') && x.status!=='cancelled')
            // go card → pairedReturn: the matching return reservation (to show combined confirm button in banner only)
            // return card → pairedReturn: set to the go card so confirm button is hidden (banner handles it)
            const pairedReturn = (r.trip_type === 'go' || !r.trip_type)
              ? all.find(x => x.trip_date===r.trip_date && x.trip_type==='return' && (x.status==='pending_confirm'||x.status==='pending_payment'))
              : all.find(x => x.trip_date===r.trip_date && (x.trip_type==='go'||!x.trip_type) && (x.status==='pending_confirm'||x.status==='pending_payment'))
            return <ReservationCard key={r.id} r={r} lang={lang} isMobile={isMobile} onCancel={handleCancel} onConfirm={handleConfirm} onConfirmWithPay={handleConfirmWithPay} onShowQR={setQrReservation} onPay={setPayReservation} onAddReturn={handleAddReturn} hasReturnForDay={hasReturnForDay} pairedReturn={pairedReturn} onConfirmBoth={handleConfirmBoth}/>
          })}
          {/* Then the rest */}
          {filtered.filter(r=>r.status!=='pending_confirm'&&r.status!=='pending_payment').map(r=>{
            const hasReturnForDay = all.some(x => x.trip_date===r.trip_date && (x.trip_type==='return') && x.status!=='cancelled')
            return <ReservationCard key={r.id} r={r} lang={lang} isMobile={isMobile} onCancel={handleCancel} onConfirm={handleConfirm} onConfirmWithPay={handleConfirmWithPay} onShowQR={setQrReservation} onPay={setPayReservation} onAddReturn={handleAddReturn} hasReturnForDay={hasReturnForDay}/>
          })}
        </div>
      )}
    </div>
  )
}
