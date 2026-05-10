import React, { useState, useEffect } from 'react'
import { Banknote, Calendar, CheckCircle, AlertTriangle, Bus } from 'lucide-react'
import mock from '../services/mockDb'

/**
 * NoShowResolutionCard
 * يظهر للطالب لما يكون عنده حجز no_show:
 *   1. يعرض الرحلات البديلة المتاحة في نفس اليوم
 *   2. يختار: استرداد الفلوس أو رصيد رحلة تانية
 *   3. لما يختار — يبعت للمشرف مباشرة ويظهر "تم الإرسال"
 */
export default function NoShowResolutionCard({ entry, lang, onChoose }) {
  const [choosing, setChoosing]       = useState(false)
  const [selected, setSelected]       = useState(null)
  const [done, setDone]               = useState(entry.resolution !== 'pending')
  const [altTrips, setAltTrips]       = useState([])
  const [loadingTrips, setLoadingTrips] = useState(true)

  const ar = lang === 'ar'

  // جيب الرحلات البديلة في نفس اليوم
  useEffect(() => {
    async function fetchAlts() {
      try {
        const res = await mock.getTrips?.() || { data: [] }
        const trips = res.data || res || []
        const alts = trips.filter(t =>
          t.status === 'active' &&
          t.trip_date === entry.trip_date &&
          t.id !== entry.trip &&
          (t.available_seats > 0)
        )
        setAltTrips(alts)
      } catch { setAltTrips([]) }
      finally { setLoadingTrips(false) }
    }
    if (!done) fetchAlts()
    else setLoadingTrips(false)
  }, [entry.trip_date, entry.trip, done])

  async function handleChoose(choice) {
    setChoosing(true)
    setSelected(choice)
    try {
      await onChoose(entry.id, choice)
      setDone(true)
    } finally {
      setChoosing(false)
    }
  }

  // ── تم الاختيار: استرداد ─────────────────────────────────────────────────
  if (done && entry.resolution === 'refund') {
    return (
      <div style={{ padding:'14px 16px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
        <Banknote size={22} color="#60a5fa"/>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#60a5fa' }}>
            {ar ? '💸 تم إرسال طلب الاسترداد للمشرف' : '💸 Refund request sent to supervisor'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
            {ar ? `سيتم رد ${entry.amount_paid} ج.م خلال 24 ساعة` : `${entry.amount_paid} EGP will be refunded within 24 hours`}
          </div>
        </div>
      </div>
    )
  }

  // ── تم الاختيار: رصيد ───────────────────────────────────────────────────
  if (done && entry.resolution === 'credit') {
    return (
      <div style={{ padding:'14px 16px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
        <Calendar size={22} color="#34d399"/>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#34d399' }}>
            {ar ? '🎫 تم إرسال طلب الرصيد للمشرف' : '🎫 Credit request sent to supervisor'}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
            {ar ? `رصيد ${entry.amount_paid} ج.م صالح حتى ${entry.credit_valid_until}` : `${entry.amount_paid} EGP credit valid until ${entry.credit_valid_until}`}
          </div>
        </div>
      </div>
    )
  }

  // ── Pending ──────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop:14, padding:'16px 18px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.35)', borderRadius:12 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <AlertTriangle size={18} color="var(--amber)"/>
        <div style={{ fontSize:14, fontWeight:800, color:'var(--amber)' }}>
          {ar ? 'لم يُسجَّل حضورك في هذه الرحلة' : 'No check-in recorded for this trip'}
        </div>
      </div>

      {/* الرحلات البديلة */}
      {!loadingTrips && altTrips.length > 0 && (
        <div style={{ marginBottom:14, padding:'12px 14px', background:'rgba(84,172,191,0.07)', border:'1px solid rgba(84,172,191,0.25)', borderRadius:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--calm)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            <Bus size={14}/> {ar ? 'رحلات بديلة متاحة اليوم:' : 'Available alternative trips today:'}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {altTrips.map(t => (
              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'var(--text-secondary)', padding:'6px 10px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)' }}>
                <span>🕐 {t.schedule_time} — {t.place_name || t.route_name || ''}</span>
                <span style={{ color:'#34d399', fontWeight:700 }}>{t.available_seats} {ar ? 'مقعد' : 'seats'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingTrips && altTrips.length === 0 && (
        <div style={{ marginBottom:14, fontSize:13, color:'var(--text-muted)', padding:'10px 14px', background:'var(--surface)', borderRadius:8, border:'1px solid var(--border)' }}>
          {ar ? '⚠️ لا توجد رحلات بديلة متاحة اليوم' : '⚠️ No alternative trips available today'}
        </div>
      )}

      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>
        {ar ? `دفعت ${entry.amount_paid} ج.م — اختر ماذا تريد:` : `You paid ${entry.amount_paid} EGP — choose an option:`}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

        {/* استرداد */}
        <button onClick={() => handleChoose('refund')} disabled={choosing}
          style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px', borderRadius:10, border:`2px solid ${selected==='refund'?'#60a5fa':'rgba(59,130,246,0.25)'}`, background: selected==='refund'?'rgba(59,130,246,0.15)':'rgba(59,130,246,0.05)', cursor: choosing?'not-allowed':'pointer', opacity: choosing && selected!=='refund' ? 0.5 : 1, transition:'all 0.2s', width:'100%', textAlign:'right' }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>💸</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#60a5fa', marginBottom:3 }}>{ar ? 'استرداد الفلوس' : 'Get a refund'}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{ar ? `سترجع ${entry.amount_paid} ج.م — تاني يوم` : `${entry.amount_paid} EGP returned — next business day`}</div>
          </div>
          {choosing && selected==='refund' && <div style={{ width:18, height:18, border:'2px solid rgba(96,165,250,0.3)', borderTopColor:'#60a5fa', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}/>}
        </button>

        {/* رصيد */}
        <button onClick={() => handleChoose('credit')} disabled={choosing}
          style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px', borderRadius:10, border:`2px solid ${selected==='credit'?'#34d399':'rgba(16,185,129,0.25)'}`, background: selected==='credit'?'rgba(16,185,129,0.15)':'rgba(16,185,129,0.05)', cursor: choosing?'not-allowed':'pointer', opacity: choosing && selected!=='credit' ? 0.5 : 1, transition:'all 0.2s', width:'100%', textAlign:'right' }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>🎫</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#34d399', marginBottom:3 }}>{ar ? 'رصيد لرحلة تانية' : 'Credit for another trip'}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{ar ? `${entry.amount_paid} ج.م — صالح لأسبوع من تاريخ الرحلة` : `${entry.amount_paid} EGP — valid for one week from trip date`}</div>
          </div>
          {choosing && selected==='credit' && <div style={{ width:18, height:18, border:'2px solid rgba(52,211,153,0.3)', borderTopColor:'#34d399', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}/>}
        </button>

      </div>
    </div>
  )
}
