import React, { useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getReservations } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function UniModReservations() {
  const isMobile = useIsMobile()
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: reservations, loading } = useApi(getReservations)

  const statusCfg = {
    confirmed: { label:t('status_confirmed'), cls:'badge-green' },
    pending:   { label:t('status_pending'),   cls:'badge-amber' },
    cancelled: { label:t('status_cancelled'), cls:'badge-red'   },
  }
  const filtered = (reservations||[]).filter(r => {
    const q = search.toLowerCase()
    const matchQ = r.student_name?.toLowerCase().includes(q) || r.trip_info?.toLowerCase().includes(q)
    return matchQ && (statusFilter==='all' || r.status===statusFilter)
  })

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('reservations')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(reservations||[]).length}</p>
      </div>
      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
        </div>
        {['all','confirmed','pending','cancelled'].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className="btn" style={{ background:statusFilter===s?'var(--calm)':'var(--surface)', color:statusFilter===s?'white':'var(--text-secondary)', border:`1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily:'var(--font)' }}>
            {{all:t('all'),confirmed:t('status_confirmed'),pending:t('status_pending'),cancelled:t('status_cancelled')}[s]}
          </button>
        ))}
      </div>
      {loading && <div>{Array(5).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:60, borderRadius:10, marginBottom:8 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={BookOpen} message={t('no_reservations')}/>}
      {!loading && filtered.length>0 && (
        <div className="card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {[t('student_name'), t('trip_label'), t('trip_date'), t('amount'), t('status_active')].map(h=>(
                  <th key={h} style={{ padding:'12px 16px', textAlign:'right', fontSize:15, color:'var(--text-muted)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'12px 16px', fontSize:17, fontWeight:600 }}>{r.student_name||r.student}</td>
                  <td style={{ padding:'12px 16px', fontSize:16, color:'var(--text-muted)' }}>{r.trip_info||r.trip}</td>
                  <td style={{ padding:'12px 16px', fontSize:16 }}>{r.date}</td>
                  <td style={{ padding:'12px 16px', fontSize:16, fontFamily:'monospace' }}>{r.amount}</td>
                  <td style={{ padding:'12px 16px' }}><span className={`badge ${statusCfg[r.status]?.cls||'badge-blue'}`}>{statusCfg[r.status]?.label||r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
