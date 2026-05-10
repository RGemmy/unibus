import React, { useState } from 'react'
import { User, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getDrivers } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function UniModDrivers() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const { data: drivers, loading } = useApi(getDrivers)

  const filtered = (drivers||[]).filter(d =>
    d.user_name?.includes(search) || d.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('drivers')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(drivers||[]).length} {lang==='ar'?'سائق':'driver(s)'}</p>
      </div>
      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>
      {loading && Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:80, borderRadius:12, marginBottom:12 }}/>)}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((d,i) => (
            <div key={d.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(38,101,140,0.12)', border:'1px solid rgba(38,101,140,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <User size={24} color="var(--evergreen)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700 }}>{d.user_name}</div>
                  <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2 }}>{d.license_number} · {d.experience_years} {lang==='ar'?'سنة خبرة':'yrs exp'}</div>
                </div>
                <span className={d.status==='active'?'badge badge-green':'badge badge-red'}>{d.status==='active'?(lang==='ar'?'نشط':'Active'):(lang==='ar'?'غير نشط':'Inactive')}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState icon={User} message={lang==='ar'?'لا يوجد سائقون':'No drivers found'}/>}
        </div>
      )}
    </div>
  )
}
