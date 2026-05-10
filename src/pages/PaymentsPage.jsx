import React, { useState } from 'react'
import { CreditCard, Search, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getPayments } from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const statusConfig = {
  paid:    { label: 'مدفوع', class: 'badge-green' },
  pending: { label: 'معلق',  class: 'badge-amber' },
  failed:  { label: 'فاشل',  class: 'badge-red'   },
}

export default function PaymentsPage() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: payments, loading, error } = useApi(getPayments)

  const filtered = (payments||[]).filter(p => {
    const matchSearch = p.student_name?.includes(search) || p.payment_type_name?.includes(search)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPaid    = (payments||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+Number(p.amount),0)
  const totalPending = (payments||[]).filter(p=>p.status==='pending').reduce((s,p)=>s+Number(p.amount),0)
  const paidCount    = (payments||[]).filter(p=>p.status==='paid').length

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 20, fontWeight: 800 }}>المدفوعات</h2><p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>إدارة العمليات المالية</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي المحصّل',  value: `${totalPaid.toLocaleString('ar-SA')} ر.س`,    icon: CheckCircle, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
          { label: 'معلق التحصيل',    value: `${totalPending.toLocaleString('ar-SA')} ر.س`, icon: Clock,       color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: 'var(--amber)' },
          { label: 'عدد العمليات',    value: (payments||[]).length,                          icon: CreditCard,  color: 'rgba(114,138,110,0.12)', border: 'rgba(114,138,110,0.25)', text: 'var(--blue-light)' },
          { label: 'متوسط العملية',   value: paidCount ? `${Math.round(totalPaid/paidCount)} ر.س` : '—', icon: TrendingUp, color: 'rgba(38,101,140,0.12)', border: 'rgba(38,101,140,0.25)', text: 'var(--blue-light)' },
        ].map(({ label, value, icon: Icon, color, border, text }) => (
          <div key={label} className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: color, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={text}/>
            </div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: text }}>{value}</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input className="form-input" placeholder="بحث بالطالب أو طريقة الدفع..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
        </div>
        {['all','paid','pending','failed'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className="btn" style={{ background: statusFilter===s?'var(--calm)':'var(--surface)', color: statusFilter===s?'white':'var(--text-secondary)', border: `1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily: 'var(--font)' }}>
            {{ all:'الكل', paid:'مدفوع', pending:'معلق', failed:'فاشل' }[s]}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>الطالب</th><th>الرحلة</th><th>طريقة الدفع</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {p.student_name?.[0]||'ط'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{p.student_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.trip_place}</td>
                  <td style={{ fontSize: 13 }}>{p.payment_type_name}</td>
                  <td style={{ fontSize: 13 }}>{p.created_at?.slice(0,10)}</td>
                  <td><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--amber-light)' }}>{Number(p.amount).toLocaleString('ar-SA')} ر.س</span></td>
                  <td><span className={`badge ${statusConfig[p.status]?.class}`}>{statusConfig[p.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}><CreditCard size={48} style={{ opacity: 0.3, marginBottom: 16 }}/><p>لا توجد مدفوعات</p></div>}
    </div>
  )
}
