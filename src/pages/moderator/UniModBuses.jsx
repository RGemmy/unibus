import React, { useState } from 'react'
import { Bus, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getBuses } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function UniModBuses() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const { data: buses, loading } = useApi(getBuses)

  const filtered = (buses||[]).filter(b =>
    b.plate_number?.includes(search) || b.plate_en?.toLowerCase().includes(search.toLowerCase())
  )

  const statusCfg = {
    active:      { label: lang==='ar'?'نشط':'Active',           cls:'badge-green' },
    maintenance: { label: lang==='ar'?'صيانة':'Maintenance',    cls:'badge-amber' },
    inactive:    { label: lang==='ar'?'غير نشط':'Inactive',     cls:'badge-red'   },
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('buses')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(buses||[]).length} {lang==='ar'?'باص':'bus(es)'}</p>
      </div>
      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>
      {loading && Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:80, borderRadius:12, marginBottom:12 }}/>)}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((bus,i) => (
            <div key={bus.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(114,138,110,0.12)', border:'1px solid rgba(114,138,110,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Bus size={24} color="var(--matcha)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700 }}>{lang==='ar'?bus.plate_number:bus.plate_en}</div>
                  <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2 }}>{lang==='ar'?bus.color:bus.color_en} · {bus.capacity} {lang==='ar'?'مقعد':'seats'}</div>
                </div>
                <span className={`badge ${statusCfg[bus.status]?.cls||'badge-blue'}`}>{statusCfg[bus.status]?.label||bus.status}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState icon={Bus} message={lang==='ar'?'لا توجد باصات':'No buses found'}/>}
        </div>
      )}
    </div>
  )
}
