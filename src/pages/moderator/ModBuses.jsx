import React, { useState } from 'react'
import { Search, Bus } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getBuses } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const colorMap = { أبيض:'#f8fafc', أصفر:'#fbbf24', أزرق:'#3b82f6', أحمر:'#ef4444', فضي:'#94a3b8', White:'#f8fafc', Yellow:'#fbbf24', Blue:'#3b82f6' }

export default function ModBuses() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const { data: buses, loading, error } = useApi(getBuses)
  const filtered = (buses||[]).filter(b => b.plate_number?.includes(search) || b.color?.includes(search))

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>الباصات</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(buses||[]).length} باص مسجل</p>
      </div>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
        <input className="form-input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
      </div>
      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:140, borderRadius:14 }}/>)}</div>}
      {!loading && !error && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((bus,i) => {
            const c = colorMap[bus.color]||'#94a3b8'
            return (
              <div key={bus.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:`${c}22`, border:`2px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Bus size={26} color={c}/>
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, fontFamily:'monospace' }}>{bus.plate_number}</div>
                    <div style={{ fontSize:15, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:c, display:'inline-block' }}/>
                      {bus.color}
                    </div>
                  </div>
                </div>
                <div style={{ padding:'10px', background:'var(--surface)', borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800 }}>{bus.capacity}</div>
                  <div style={{ fontSize:14, color:'var(--text-muted)' }}>مقعد</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
