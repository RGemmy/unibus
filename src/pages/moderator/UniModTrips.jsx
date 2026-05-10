import React, { useState } from 'react'
import { Bus, MapPin, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getTrips } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function UniModTrips() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: trips, loading } = useApi(getTrips)

  const statusCfg = {
    active:    { label: t('status_active'),    cls:'badge-green' },
    completed: { label: t('status_completed'), cls:'badge-blue'  },
    pending:   { label: t('status_pending'),   cls:'badge-amber' },
    cancelled: { label: t('status_cancelled'), cls:'badge-red'   },
  }
  const statuses = ['all','active','pending','completed','cancelled']
  const statusLabel = { all:t('all'), active:t('status_active'), pending:t('status_pending'), completed:t('status_completed'), cancelled:t('status_cancelled') }

  const filtered = (trips||[]).filter(tr => {
    const q = search.toLowerCase()
    const matchQ = tr.place_name?.toLowerCase().includes(q) || tr.bus_plate?.toLowerCase().includes(q)
    return matchQ && (statusFilter==='all' || tr.status===statusFilter)
  })

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('trips')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(trips||[]).length} {lang==='ar'?'رحلة':'trips'}</p>
      </div>
      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
        </div>
        {statuses.map(s => (
          <button key={s} onClick={()=>setStatusFilter(s)} className="btn" style={{ background:statusFilter===s?'var(--calm)':'var(--surface)', color:statusFilter===s?'white':'var(--text-secondary)', border:`1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily:'var(--font)' }}>
            {statusLabel[s]}
          </button>
        ))}
      </div>
      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:180, borderRadius:12 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={Bus} message={t('no_trips')}/>}
      {!loading && filtered.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((tr,i) => (
            <div key={tr.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bus size={17} color="var(--matcha)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:17, fontWeight:700 }}>{tr.bus_plate}</div>
                    <div style={{ fontSize:14, color:'var(--text-muted)' }}>{t('bus_label')}</div>
                  </div>
                </div>
                <span className={`badge ${statusCfg[tr.status]?.cls}`}>{statusCfg[tr.status]?.label}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 11px', background:'var(--surface)', borderRadius:7, marginBottom:10 }}>
                <MapPin size={16} color="var(--evergreen)"/>
                <span style={{ fontSize:16 }}>{tr.place_name}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8 }}>
                {[{ v:tr.schedule_time, l:t('trip_time') },{ v:`${tr.bus_capacity-(tr.available_seats||0)}/${tr.bus_capacity}`, l:t('seats_label') },{ v:tr.trip_date, l:t('trip_date') }].map(({v,l})=>(
                  <div key={l} style={{ textAlign:'center', padding:9, background:'var(--surface)', borderRadius:6 }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>{v}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
