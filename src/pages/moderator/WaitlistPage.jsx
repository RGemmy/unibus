import React, { useState, useEffect } from 'react'
import { Users, Clock, Send, CheckCircle, XCircle, RefreshCw, AlertTriangle, Banknote, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import mock from '../../services/mockDb'

// ── Helpers ──────────────────────────────────────────────────────────────────
const resolutionConfig = {
  pending:  { label: 'بانتظار الطالب', cls: 'badge-amber',  icon: '⏳' },
  refund:   { label: 'طلب استرداد — أرسله الطالب',  cls: 'badge-blue',   icon: '💸' },
  credit:   { label: 'رصيد رحلة — أرسله الطالب',   cls: 'badge-green',  icon: '🎫' },
  resolved: { label: 'تم الحل',        cls: 'badge-teal',   icon: '✅' },
}

// ── Alternatives Modal ────────────────────────────────────────────────────────
function AlternativesModal({ entry, onClose, onSent }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      await mock.sendAlternatives(entry.id)
      setSent(true)
      setTimeout(() => { onSent(entry.id); onClose() }, 1000)
    } catch(e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--navy-2,#0f1e2e)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:17,fontWeight:800 }}>📨 إرسال رحلات بديلة</h3>
            <p style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{entry.student_name}</p>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 7px',cursor:'pointer',display:'flex' }}><XCircle size={18}/></button>
        </div>

        <div style={{ padding:22 }}>
          {/* الطالب والرحلة */}
          <div style={{ background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:18 }}>
            <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:4 }}>لم يحضر رحلة:</div>
            <div style={{ fontSize:15,fontWeight:700 }}>{entry.trip_place}</div>
            <div style={{ fontSize:13,color:'var(--text-muted)' }}>{entry.trip_date} — الساعة {entry.schedule_time} · دفع {entry.amount_paid} ج.م</div>
          </div>

          {/* الرحلات البديلة */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:14,fontWeight:700,marginBottom:10,color:'var(--text-secondary)' }}>الرحلات المتاحة في نفس اليوم:</div>
            {[].length === 0 ? (
              <div style={{ fontSize:14,color:'var(--text-muted)',padding:12,textAlign:'center' }}>سيتم إرسال الرحلات المتاحة للطالب</div>
            ) : [].map(t => (
              <div key={t.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:9,marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:600 }}>{t.place}</div>
                  <div style={{ fontSize:12,color:'var(--text-muted)' }}>الساعة {t.time}</div>
                </div>
                <span style={{ fontSize:12,background:'rgba(16,185,129,0.12)',color:'#34d399',padding:'3px 10px',borderRadius:6,fontWeight:700 }}>
                  {t.available_seats} مقعد
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || sent}
            className="btn btn-primary"
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {sent ? <><CheckCircle size={17}/> تم الإرسال ✅</> :
             sending ? <div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> :
             <><Send size={17}/> إرسال للطالب</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry Card ────────────────────────────────────────────────────────────────
function WaitlistCard({ entry, onSendAlternatives }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = resolutionConfig[entry.resolution] || resolutionConfig.pending
  const isPending = entry.resolution === 'pending'

  return (
    <div style={{ background:'var(--surface)',border:`1px solid ${isPending?'rgba(245,158,11,0.35)':'var(--border)'}`,borderRadius:14,overflow:'hidden',transition:'border-color 0.2s' }}>
      {/* Main row */}
      <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
        {/* Avatar */}
        <div style={{ width:42,height:42,borderRadius:11,background:'rgba(84,172,191,0.15)',border:'1px solid rgba(84,172,191,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18 }}>
          🧑‍🎓
        </div>

        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:2 }}>{entry.student_name}</div>
          <div style={{ fontSize:13,color:'var(--text-muted)',display:'flex',gap:10,flexWrap:'wrap' }}>
            <span>📅 {entry.trip_date}</span>
            <span>🕐 {entry.schedule_time}</span>
            <span>💰 {entry.amount_paid} ج.م</span>
            {entry.student_phone && <span>📞 {entry.student_phone}</span>}
          </div>
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
          <span className={`badge ${cfg.cls}`} style={{ fontSize:13 }}>{cfg.icon} {cfg.label}</span>
          {/* Alternatives badge */}
          {entry.alternatives_sent
            ? <span style={{ fontSize:12,background:'rgba(16,185,129,0.1)',color:'#34d399',padding:'2px 8px',borderRadius:5,fontWeight:700 }}>📨 أُرسل</span>
            : isPending && <span style={{ fontSize:12,background:'rgba(245,158,11,0.1)',color:'var(--amber)',padding:'2px 8px',borderRadius:5,fontWeight:700 }}>⚠️ لم يُرسل</span>
          }
          <button onClick={() => setExpanded(e=>!e)} style={{ background:'var(--surface-hover,rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 8px',cursor:'pointer',display:'flex',color:'var(--text-secondary)' }}>
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{ padding:'0 16px 16px',borderTop:'1px solid var(--border)',paddingTop:14,display:'flex',gap:10,flexWrap:'wrap' }}>
          {!entry.alternatives_sent && isPending && (
            <button
              onClick={() => onSendAlternatives(entry)}
              className="btn btn-sm"
              style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(84,172,191,0.15)',color:'var(--calm)',border:'1px solid rgba(84,172,191,0.4)' }}
            >
              <Send size={15}/> إرسال رحلات بديلة
            </button>
          )}
          {entry.alternatives_sent && isPending && (
            <div style={{ fontSize:13,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:6 }}>
              <Clock size={14}/> بانتظار اختيار الطالب (رد فلوس أو رصيد رحلة)
            </div>
          )}
          {entry.resolution === 'refund' && (
            <div style={{ fontSize:13,color:'#60a5fa',display:'flex',alignItems:'center',gap:6 }}>
              <Banknote size={14}/> طلب استرداد — سيُعالج خلال 24 ساعة
              {entry.resolved_at && <span style={{ color:'var(--text-muted)' }}>({new Date(entry.resolved_at).toLocaleDateString('ar')})</span>}
            </div>
          )}
          {entry.resolution === 'credit' && (
            <div style={{ fontSize:13,color:'#34d399',display:'flex',alignItems:'center',gap:6 }}>
              <Calendar size={14}/> رصيد لرحلة بديلة — صالح حتى {entry.credit_valid_until}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const isMobile = useIsMobile()
  const { lang } = useLanguage()
  const [entries, setEntries]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [altModal, setAltModal]     = useState(null)
  const [dateFilter, setDateFilter] = useState('all')

  async function loadEntries() {
    setLoading(true)
    try {
      const res = await mock.getWaitlistEntries()
      setEntries(res.data || res || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadEntries() }, [])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>جاري التحميل...</div>
  const dates = [...new Set(entries.map(e => e.trip_date))].sort().reverse()

  const filtered = entries.filter(e => {
    if (filter === 'pending'  && e.resolution !== 'pending')  return false
    if (filter === 'resolved' && e.resolution === 'pending')  return false
    if (dateFilter !== 'all'  && e.trip_date  !== dateFilter) return false
    return true
  })

  const pendingCount  = entries.filter(e => e.resolution === 'pending').length
  const refundCount   = entries.filter(e => e.resolution === 'refund').length
  const creditCount   = entries.filter(e => e.resolution === 'credit').length
  const unsentCount   = entries.filter(e => e.resolution === 'pending' && !e.alternatives_sent).length

  function handleSent(entryId) {
    setEntries(prev => prev.map(e => e.id===entryId ? {...e, alternatives_sent:true} : e))
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22,fontWeight:800,display:'flex',alignItems:'center',gap:10 }}>
          <Users size={24} color="var(--calm)"/> قائمة الانتظار
        </h2>
        <p style={{ fontSize:14,color:'var(--text-muted)',marginTop:4 }}>
          طلاب حجزوا ودفعوا لكن لم يُسجَّل حضورهم عند انطلاق الرحلة
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'بانتظار الحل',    value:pendingCount,  color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  icon:'⏳' },
          { label:'لم تُرسل بدائل', value:unsentCount,   color:'#f87171', bg:'rgba(239,68,68,0.1)',   icon:'📭' },
          { label:'طلبات استرداد',   value:refundCount,   color:'#60a5fa', bg:'rgba(59,130,246,0.1)',  icon:'💸' },
          { label:'رصيد رحلة',       value:creditCount,   color:'#34d399', bg:'rgba(16,185,129,0.1)', icon:'🎫' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderRadius:12, padding:'14px 16px', borderColor:`${s.color}44` }}>
            <div style={{ fontSize: isMobile ? 24 : 36, fontWeight:900, color:s.color }}>{s.icon} {s.value}</div>
            <div style={{ fontSize: isMobile ? 13 : 18, color:'var(--text-muted)', marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert for unsent */}
      {unsentCount > 0 && (
        <div style={{ padding:'12px 16px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.35)',borderRadius:10,display:'flex',alignItems:'center',gap:10,marginBottom:20,fontSize:14,fontWeight:600,color:'var(--amber)' }}>
          <AlertTriangle size={18}/>
          يوجد {unsentCount} طالب لم يتلقَّ إشعار الرحلات البديلة — ابعت لهم الآن
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        {[{k:'all',l:'الكل'},{k:'pending',l:'⏳ بانتظار الحل'},{k:'resolved',l:'✅ تم الحل'}].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            style={{ padding:'10px 20px',borderRadius:8,border:`1px solid ${filter===f.k?'var(--calm)':'var(--border)'}`,background:filter===f.k?'rgba(84,172,191,0.15)':'var(--surface)',color:filter===f.k?'var(--calm)':'var(--text-secondary)',fontSize:16,fontWeight:filter===f.k?700:400,cursor:'pointer' }}>
            {f.l}
          </button>
        ))}
        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ padding:'10px 16px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text-secondary)',fontSize:16,cursor:'pointer' }}
        >
          <option value="all">كل التواريخ</option>
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'48px 20px',color:'var(--text-muted)' }}>
          <div style={{ fontSize:22,fontWeight:700,color:'var(--text-primary)',marginBottom:8 }}>لا توجد حالات في قائمة الانتظار</div>
          <div style={{ fontSize:16,marginTop:6 }}>كل الطلاب حضروا رحلاتهم</div>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {filtered.map(entry => (
            <WaitlistCard key={entry.id} entry={entry} onSendAlternatives={e => setAltModal(e)}/>
          ))}
        </div>
      )}

      {altModal && (
        <AlternativesModal
          entry={altModal}
          onClose={() => setAltModal(null)}
          onSent={handleSent}
        />
      )}
    </div>
  )
}
