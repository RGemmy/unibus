import React, { useState } from 'react'
import { CreditCard, Search, TrendingUp, CheckCircle, XCircle, Clock, Shield, Eye } from 'lucide-react'
import { useApi, useToast } from '../../hooks/useApi'
import { getPayments, getSubscriptions, approveSubscription, rejectSubscription } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import ToastContainer from '../../components/Toast'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function BusModPayments() {
  const isMobile = useIsMobile()
  const { lang } = useLanguage()
  const [tab, setTab] = useState('payments') // 'payments' | 'subscriptions'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [receiptSub, setReceiptSub] = useState(null) // subscription with receipt to preview
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async (id) => {
    await approveSubscription(id)
    showToast(lang==='ar'?'✅ تم قبول الاشتراك':'✅ Subscription approved')
    refetchSubs()
  }
  const handleReject = async () => {
    if (!rejectId) return
    await rejectSubscription(rejectId, rejectReason)
    showToast(lang==='ar'?'❌ تم رفض الاشتراك':'❌ Subscription rejected')
    setRejectId(null); setRejectReason('')
    refetchSubs()
  }

  const { toasts, showToast } = useToast()
  const { data: payments,      loading: pl } = useApi(getPayments)
  const { data: subscriptions, loading: sl, refetch: refetchSubs } = useApi(getSubscriptions)

  // ── Payments ──
  const payStatusCfg = {
    paid:    { label: lang==='ar'?'مدفوع':'Paid',    cls:'badge-green' },
    pending: { label: lang==='ar'?'معلق':'Pending',  cls:'badge-amber' },
    failed:  { label: lang==='ar'?'فاشل':'Failed',   cls:'badge-red'   },
  }
  const filteredPay = (payments||[]).filter(p => {
    const q = search.toLowerCase()
    return (p.student?.toLowerCase().includes(q) || p.method?.includes(search)) &&
           (statusFilter==='all' || p.status===statusFilter)
  })
  const totalPaid    = (payments||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+Number(p.amount),0)
  const totalPending = (payments||[]).filter(p=>p.status==='pending').reduce((s,p)=>s+Number(p.amount),0)
  const paidCount    = (payments||[]).filter(p=>p.status==='paid').length

  // ── Subscriptions ──
  const subStatusCfg = {
    active:    { label: lang==='ar'?'نشط':'Active',       cls:'badge-green' },
    expired:   { label: lang==='ar'?'منتهي':'Expired',    cls:'badge-red'   },
    cancelled: { label: lang==='ar'?'ملغي':'Cancelled',   cls:'badge-amber' },
  }
  const filteredSub = (subscriptions||[]).filter(s => {
    const q = search.toLowerCase()
    return (s.student?.toLowerCase().includes(q)) &&
           (statusFilter==='all' || s.status===statusFilter)
  })
  const activeSubs = (subscriptions||[]).filter(s=>s.status==='active').length

  const payStatuses = ['all','paid','pending','failed']
  const subStatuses = ['all','active','expired','cancelled']
  const currentStatuses = tab === 'payments' ? payStatuses : subStatuses
  const statLabel = {
    all:'الكل / All', paid:lang==='ar'?'مدفوع':'Paid', pending:lang==='ar'?'معلق':'Pending',
    failed:lang==='ar'?'فاشل':'Failed', active:lang==='ar'?'نشط':'Active',
    expired:lang==='ar'?'منتهي':'Expired', cancelled:lang==='ar'?'ملغي':'Cancelled'
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1300, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{lang==='ar'?'المالية':'Finance'}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{lang==='ar'?'المدفوعات والاشتراكات':'Payments & Subscriptions'}</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label: lang==='ar'?'إجمالي المحصّل':'Collected',   value:`${totalPaid.toLocaleString()} ${lang==='ar'?'ج.م':'EGP'}`,    icon:CheckCircle, color:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', text:'#34d399' },
          { label: lang==='ar'?'معلق التحصيل':'Pending Pay',   value:`${totalPending.toLocaleString()} ${lang==='ar'?'ج.م':'EGP'}`, icon:Clock,       color:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', text:'var(--amber)' },
          { label: lang==='ar'?'عدد المدفوعات':'Payments',     value:(payments||[]).length,                                          icon:CreditCard,  color:'rgba(114,138,110,0.12)', border:'rgba(114,138,110,0.25)', text:'var(--blue-light)' },
          { label: lang==='ar'?'اشتراكات نشطة':'Active Subs',  value:activeSubs,                                                    icon:Shield,      color:'rgba(38,101,140,0.12)', border:'rgba(38,101,140,0.25)', text:'var(--blue-light)' },
          { label: lang==='ar'?'متوسط الدفعة':'Avg Payment',   value:paidCount?`${Math.round(totalPaid/paidCount)} ${lang==='ar'?'ج.م':'EGP'}`:'—', icon:TrendingUp, color:'rgba(38,101,140,0.12)', border:'rgba(38,101,140,0.25)', text:'var(--blue-light)' },
        ].map(({ label, value, icon: Icon, color, border, text }) => (
          <div key={label} className="card" style={{ padding:16, display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:color, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={22} color={text}/>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:text }}>{value}</div>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:1 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', background:'var(--surface)', borderRadius:10, padding:6, marginBottom:18, border:'1px solid var(--border)', width:'fit-content' }}>
        {[
          { key:'payments',      icon:CreditCard, label:lang==='ar'?'المدفوعات':'Payments' },
          { key:'subscriptions', icon:Shield,     label:lang==='ar'?'الاشتراكات':'Subscriptions' },
        ].map(t => (
          <button key={t.key} onClick={()=>{ setTab(t.key); setStatusFilter('all'); setSearch('') }}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:16, fontWeight:600, transition:'all 0.2s',
              background: tab===t.key ? 'var(--calm)' : 'transparent',
              color:      tab===t.key ? 'white' : 'var(--text-muted)',
            }}>
            <t.icon size={17}/> {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-input" placeholder={lang==='ar'?'بحث...':'Search...'} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
        </div>
        {currentStatuses.map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className="btn" style={{ background:statusFilter===s?'var(--calm)':'var(--surface)', color:statusFilter===s?'white':'var(--text-secondary)', border:`1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily:'var(--font)' }}>
            {statLabel[s]}
          </button>
        ))}
      </div>

      {/* ── Payments table ── */}
      {tab === 'payments' && (
        <>
          {pl && <div className="skeleton" style={{ height:200, borderRadius:12 }}/>}
          {!pl && filteredPay.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <CreditCard size={48} style={{ opacity:0.3, marginBottom:16 }}/><p>{lang==='ar'?'لا توجد مدفوعات':'No payments'}</p>
            </div>
          )}
          {!pl && filteredPay.length > 0 && (
            <div className="card" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['#', lang==='ar'?'الطالب':'Student', lang==='ar'?'المبلغ':'Amount', lang==='ar'?'طريقة الدفع':'Method', lang==='ar'?'التاريخ':'Date', lang==='ar'?'الحالة':'Status'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-muted)', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPay.map(p=>(
                    <tr key={p.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'12px 16px', fontSize:16, color:'var(--text-muted)' }}>#{p.id}</td>
                      <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--calm),var(--early))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'white', flexShrink:0 }}>
                            {p.student?.[0]||'ط'}
                          </div>
                          {p.student}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}><span style={{ fontWeight:700, fontSize:18, color:'var(--amber)' }}>{Number(p.amount).toLocaleString()} {lang==='ar'?'ج.م':'EGP'}</span></td>
                      <td style={{ padding:'12px 16px', fontSize:16 }}>{lang==='ar'?p.method:p.method_en}</td>
                      <td style={{ padding:'12px 16px', fontSize:16 }}>{p.date}</td>
                      <td style={{ padding:'12px 16px' }}><span className={`badge ${payStatusCfg[p.status]?.cls||'badge-blue'}`}>{payStatusCfg[p.status]?.label||p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Subscriptions table ── */}
      {tab === 'subscriptions' && (
        <>
          {sl && <div className="skeleton" style={{ height:200, borderRadius:12 }}/>}
          {!sl && filteredSub.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <Shield size={48} style={{ opacity:0.3, marginBottom:16 }}/><p>{lang==='ar'?'لا توجد اشتراكات':'No subscriptions'}</p>
            </div>
          )}
          {!sl && filteredSub.length > 0 && (
            <div className="card" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['#', lang==='ar'?'الطالب':'Student', lang==='ar'?'الباقة':'Plan', lang==='ar'?'الدفع':'Payment', lang==='ar'?'الحالة':'Status', ''].map(h=>(
                      <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-primary)', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {filteredSub.map(s=>(
                    <tr key={s.id} style={{ borderBottom:'1px solid rgba(142,164,139,0.06)', background: s.status==='pending_review'||s.status==='pending_payment' ? 'rgba(245,158,11,0.04)' : undefined }}>
                      <td style={{ padding:'12px 16px', fontSize:16, color:'var(--text-primary)', fontWeight:600 }}>#{s.id}</td>
                      <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--calm),var(--matcha))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>
                            {s.student?.[0]||'ط'}
                          </div>
                          <span style={{ color:'var(--text-primary)' }}>{s.student}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{lang==='ar'?(s.plan_ar||s.plan):(s.plan_en||s.plan)}</td>
                      <td style={{ padding:'12px 16px', fontSize:15 }}>
                        <span style={{ padding:'3px 10px', borderRadius:8, fontSize:13, fontWeight:600,
                          background: s.payment_method==='instapay'?'rgba(84,172,191,0.12)':'rgba(201,168,76,0.12)',
                          color: s.payment_method==='instapay'?'var(--calm)':'var(--amber)' }}>
                          {s.payment_method==='instapay'?'InstaPay':s.payment_method==='cash'?(lang==='ar'?'كاش':'Cash'):'—'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px' }}><span className={`badge ${subStatusCfg[s.status]?.cls||'badge-blue'}`}>{subStatusCfg[s.status]?.label||s.status}</span></td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          {s.receipt_image && (
                            <button onClick={()=>setReceiptSub(s)} className="btn btn-sm" style={{ background:'rgba(84,172,191,0.1)',border:'1px solid rgba(84,172,191,0.3)',color:'var(--calm)',gap:4,display:'flex',alignItems:'center' }}>
                              <Eye size={14}/> {lang==='ar'?'الإيصال':'Receipt'}
                            </button>
                          )}
                          {(s.status==='pending_review'||s.status==='pending_payment') && (
                            <>
                              {!s.receipt_image && (
                                <button onClick={()=>handleApprove(s.id)} className="btn btn-sm" style={{ background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.3)',color:'#34d399',display:'flex',alignItems:'center',gap:4 }}>
                                  <CheckCircle size={14}/> {lang==='ar'?'قبول':'Approve'}
                                </button>
                              )}
                              <button onClick={()=>setRejectId(s.id)} className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',display:'flex',alignItems:'center',gap:4 }}>
                                <XCircle size={14}/> {lang==='ar'?'رفض':'Reject'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
