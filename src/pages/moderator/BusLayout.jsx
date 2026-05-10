import React, { useState } from 'react'
import { Bus, Save, RotateCcw, Check } from 'lucide-react'
import { useApi, useToast } from '../../hooks/useApi'
import { getBuses, updateBus } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useIsMobile } from '../../hooks/useIsMobile'

function LayoutPreview({ capacity, lang }) {
  const rows = Math.ceil(capacity / 4)
  // Always show 4 seats per row: 2 left | aisle | 2 right
  return (
    <div style={{ background:'var(--surface)', borderRadius:12, padding:14, border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'5px 10px', background:'rgba(38,101,140,0.12)', borderRadius:7 }}>
        <span style={{ fontSize:14, color:'var(--matcha)', fontWeight:600 }}>👤 {lang==='ar'?'السائق':'Driver'}</span>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>🚌 {lang==='ar'?'الأمام':'Front'}</span>
      </div>
      {/* Column headers — always 4 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'22px 1fr 1fr 10px 1fr 1fr 22px', gap:3, marginBottom:4, textAlign:'center' }}>
        <div/>
        <div style={{ fontSize:9, color:'var(--text-muted)', fontWeight:700 }}>A</div>
        <div style={{ fontSize:9, color:'var(--text-muted)', fontWeight:700 }}>B</div>
        <div/>
        <div style={{ fontSize:9, color:'var(--text-muted)', fontWeight:700 }}>C</div>
        <div style={{ fontSize:9, color:'var(--text-muted)', fontWeight:700 }}>D</div>
        <div/>
      </div>
      {Array.from({ length: Math.min(rows, 10) }, (_, r) => (
        <div key={r} style={{ display:'grid', gridTemplateColumns:'22px 1fr 1fr 10px 1fr 1fr 22px', gap:3, marginBottom:3, alignItems:'center' }}>
          <div style={{ textAlign:'center', fontSize:9, color:'var(--text-muted)' }}>{r+1}</div>
          {[0,1].map(c => {
            const idx = r*4+c
            return idx < capacity
              ? <div key={c} style={{ height:22, borderRadius:4, background:'var(--navy-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'var(--text-muted)', fontWeight:600 }}>{r+1}{'ABCD'[c]}</div>
              : <div key={c}/>
          })}
          <div style={{ textAlign:'center', color:'var(--border)', fontSize:9 }}>│</div>
          {[2,3].map(c => {
            const idx = r*4+c
            return idx < capacity
              ? <div key={c} style={{ height:22, borderRadius:4, background:'var(--navy-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'var(--text-muted)', fontWeight:600 }}>{r+1}{'ABCD'[c]}</div>
              : <div key={c}/>
          })}
          <div style={{ textAlign:'center', fontSize:9, color:'var(--text-muted)' }}>{r+1}</div>
        </div>
      ))}
      {rows > 10 && <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', marginTop:4 }}>+{rows-10} {lang==='ar'?'صفوف':'rows'}</div>}
      <div style={{ textAlign:'center', marginTop:6, fontSize:10, color:'var(--text-muted)' }}>🔚 {lang==='ar'?'المؤخرة':'Back'}</div>
    </div>
  )
}

export default function BusLayout() {
  const isMobile = useIsMobile()
  const { t, lang }   = useLanguage()
  const { data: buses, loading, refetch } = useApi(getBuses)
  const { toasts, showToast } = useToast()
  const [selectedBus, setSelectedBus] = useState(null)
  const [capacity,    setCapacity]    = useState(45)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const editorRef = React.useRef(null)

  const handleSelectBus = (bus) => {
    setSelectedBus(bus)
    setCapacity(bus.capacity || 45)
    setSaved(false)
    // On mobile: scroll to editor immediately after selecting
    if (isMobile) {
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  const handleSave = async () => {
    if (!selectedBus) return
    setSaving(true)
    try {
      await updateBus(selectedBus.id, { capacity: Number(capacity) })
      showToast(lang==='ar'?`تم حفظ ترتيب مقاعد ${selectedBus.plate_number}`:`Layout saved for ${selectedBus.plate_number}`)
      setSaved(true); refetch()
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  const presets = [
    { label:lang==='ar'?'صغير (24)':'Small (24)',   val:24 },
    { label:lang==='ar'?'متوسط (36)':'Medium (36)', val:36 },
    { label:lang==='ar'?'كبير (45)':'Large (45)',   val:45 },
    { label:lang==='ar'?'كبير جداً (50)':'XL (50)', val:50 },
  ]

  // Mobile hint shown above bus list
  const mobileHint = isMobile && !selectedBus && (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(38,101,140,0.10)', border:'1px solid rgba(38,101,140,0.2)', marginBottom:14 }}>
      <span style={{ fontSize:18 }}>👇</span>
      <span style={{ fontSize:13, color:'var(--text-muted)' }}>{lang==='ar'?'اضغط على باص لتعديل مقاعده':'Tap a bus to edit its seat count'}</span>
    </div>
  )

  const EditorPanel = () => (
    <div ref={editorRef}>
      {!selectedBus ? (
        !isMobile && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, color:'var(--text-muted)' }}>
            <Bus size={48} style={{ opacity:0.2, marginBottom:12 }}/>
            <p style={{ fontSize:17 }}>{lang==='ar'?'اختر باصاً من القائمة':'Select a bus from the list'}</p>
          </div>
        )
      ) : (
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          {/* Mobile: show which bus is selected with back-feel */}
          {isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'rgba(38,101,140,0.10)', border:'1px solid var(--calm)', marginBottom:16 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:'rgba(38,101,140,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bus size={20} color="var(--matcha)"/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace' }}>{selectedBus.plate_number}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selectedBus.capacity} {lang==='ar'?'مقعد':'seats'} · {selectedBus.color}</div>
              </div>
              <Check size={20} color="var(--matcha)" style={{ marginRight:'auto' }}/>
            </div>
          )}

          <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14, color:'var(--text-muted)' }}>
            {lang==='ar'?'عدد المقاعد':'Seat Count'}
            {!isMobile && ` — ${selectedBus.plate_number}`}
          </h3>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {presets.map(p => (
              <button key={p.val} onClick={()=>{ setCapacity(p.val); setSaved(false) }}
                style={{ padding:'10px 12px', borderRadius:9, border:`2px solid ${capacity===p.val?'var(--calm)':'var(--border)'}`, background:capacity===p.val?'rgba(38,101,140,0.12)':'var(--surface)', color:capacity===p.val?'var(--matcha)':'var(--text-secondary)', cursor:'pointer', fontSize:16, fontWeight:600, transition:'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">{lang==='ar'?'عدد مخصص:':'Custom count:'}</label>
            <input type="number" className="form-input" min={10} max={80} value={capacity}
              onChange={e=>{ setCapacity(Number(e.target.value)); setSaved(false) }}/>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>
              {Math.ceil(capacity/4)} {lang==='ar'?'صف':'rows'} × 4 {lang==='ar'?'مقاعد':'seats'}
              {capacity%4!==0 ? ` + ${capacity%4} ${lang==='ar'?'إضافية':'extra'}` : ''}
            </p>
          </div>

          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:15, color:'var(--text-muted)', marginBottom:8, fontWeight:600 }}>
              {lang==='ar'?'معاينة:':'Preview:'}
            </p>
            <LayoutPreview capacity={capacity} lang={lang}/>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" style={{ flex:1 }} onClick={()=>{ setCapacity(selectedBus.capacity); setSaved(false) }}>
              <RotateCcw size={17}/> {lang==='ar'?'إعادة تعيين':'Reset'}
            </button>
            <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSave} disabled={saving}>
              {saving
                ? <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                : saved
                ? <><Check size={18}/> {lang==='ar'?'تم الحفظ':'Saved!'}</>
                : <><Save size={18}/> {lang==='ar'?'حفظ الترتيب':'Save Layout'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800 }}>{lang==='ar'?'ترتيب مقاعد الباصات':'Bus Seat Layout'}</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
          {lang==='ar'?'حدد عدد المقاعد لكل باص':'Set the seat count for each bus'}
        </p>
      </div>

      {/* Mobile: stack vertically. Desktop: side by side */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 24 }}>

        {/* Bus list */}
        <div>
          <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14, color:'var(--text-muted)' }}>
            {lang==='ar'?'اختر الباص':'Select Bus'}
          </h3>
          {mobileHint}
          {loading && Array(4).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:68, borderRadius:10, marginBottom:8 }}/>)}
          {!loading && (!buses||buses.length===0) && <EmptyState icon={Bus} message={t('no_data')}/>}
          {!loading && (buses||[]).map(bus => (
            <div key={bus.id} onClick={()=>handleSelectBus(bus)}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:12, cursor:'pointer', marginBottom:8, border:`2px solid ${selectedBus?.id===bus.id?'var(--calm)':'var(--border)'}`, background:selectedBus?.id===bus.id?'rgba(38,101,140,0.08)':'var(--card-bg)', transition:'all 0.2s' }}>
              <div style={{ width:42, height:42, borderRadius:10, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Bus size={19} color={selectedBus?.id===bus.id?'var(--matcha)':'var(--text-muted)'}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:700, fontFamily:'monospace' }}>{bus.plate_number}</div>
                <div style={{ fontSize:15, color:'var(--text-muted)', marginTop:2 }}>{bus.capacity} {lang==='ar'?'مقعد':'seats'} · {bus.color}</div>
              </div>
              {selectedBus?.id===bus.id
                ? <Check size={22} color="var(--matcha)"/>
                : isMobile && <span style={{ fontSize:11, color:'var(--text-muted)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px' }}>{lang==='ar'?'اضغط':'Tap'}</span>
              }
            </div>
          ))}
        </div>

        {/* Editor — on mobile appears below bus list */}
        <EditorPanel/>
      </div>
    </div>
  )
}
