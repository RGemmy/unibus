import React, { useState } from 'react'
import { Route, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getRoutes } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function UniModRoutes() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const { data: routes, loading } = useApi(getRoutes)

  const filtered = (routes||[]).filter(r =>
    r.start_point?.includes(search) || r.end_point?.includes(search) ||
    r.start_point_en?.toLowerCase().includes(search.toLowerCase()) || r.end_point_en?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{t('routes')}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(routes||[]).length} {lang==='ar'?'مسار':'route(s)'}</p>
      </div>
      <div style={{ position:'relative', marginBottom:20, maxWidth:400 }}>
        <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
      </div>
      {loading && Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:120, borderRadius:12, marginBottom:12 }}/>)}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
          {filtered.map((route,i) => (
            <div key={route.id} className="card" style={{ padding:20, animation:`fadeUp ${0.1+i*0.05}s ease` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(38,101,140,0.12)', border:'1px solid rgba(38,101,140,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Route size={22} color="var(--evergreen)"/>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:14, background:'var(--surface)', borderRadius:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, marginBottom:3 }}>{lang==='ar'?'من':'From'}</div>
                  <div style={{ fontSize:16, fontWeight:600 }}>{lang==='ar'?route.start_point:route.start_point_en}</div>
                </div>
                <div style={{ width:40, height:1, background:'var(--calm)', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, marginBottom:3 }}>{lang==='ar'?'إلى':'To'}</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{lang==='ar'?route.end_point:route.end_point_en}</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState icon={Route} message={lang==='ar'?'لا توجد مسارات':'No routes found'}/>}
        </div>
      )}
    </div>
  )
}
