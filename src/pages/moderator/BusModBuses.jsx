import React, { useState } from 'react'
import { Plus, Search, Bus, Edit2, Trash2, Wind, Thermometer, Image } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useApi, useToast } from '../../hooks/useApi'
import { getBuses, createBus, updateBus, deleteBus } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'

// All CSS colors with Arabic/English names
const ALL_COLORS = [
  { ar:'أبيض',   en:'White',   hex:'#f8fafc' },
  { ar:'أصفر',   en:'Yellow',  hex:'#fbbf24' },
  { ar:'أزرق',   en:'Blue',    hex:'#3b82f6' },
  { ar:'أحمر',   en:'Red',     hex:'#ef4444' },
  { ar:'فضي',    en:'Silver',  hex:'#94a3b8' },
  { ar:'أخضر',   en:'Green',   hex:'#22c55e' },
  { ar:'برتقالي',en:'Orange',  hex:'#f97316' },
  { ar:'أزرق فاتح', en:'Light Blue',  hex:'#54ACBF' },
  { ar:'بني',    en:'Brown',   hex:'#92400e' },
  { ar:'أسود',   en:'Black',   hex:'#1e293b' },
  { ar:'ذهبي',   en:'Gold',    hex:'#d97706' },
  { ar:'وردي',   en:'Pink',    hex:'#ec4899' },
]

const emptyForm = { plate_number:'', capacity:45, color_en:'White', has_ac:false, status:'active', image_url:'' }

export default function BusModBuses() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { data:buses, loading, refetch } = useApi(getBuses)
  const { toasts, showToast } = useToast()

  const statusCfg = {
    active:      { label:t('status_active'),      cls:'badge-green' },
    maintenance: { label:t('status_maintenance'), cls:'badge-amber' },
    inactive:    { label:t('status_inactive'),    cls:'badge-red'   },
  }

  const getColorHex = (colorEn) => ALL_COLORS.find(c=>c.en===colorEn)?.hex || '#94a3b8'
  const getColorName = (colorEn) => {
    const c = ALL_COLORS.find(c=>c.en===colorEn)
    return c ? (lang==='ar' ? c.ar : c.en) : colorEn
  }
  const getBusColor = (bus) => bus.color_en ? getColorHex(bus.color_en) : (ALL_COLORS.find(c=>c.ar===bus.color)?.hex || '#94a3b8')

  const filtered = (buses||[]).filter(b =>
    b.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.color?.toLowerCase().includes(search.toLowerCase()) ||
    b.color_en?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (b) => {
    setForm({ plate_number:b.plate_number, capacity:b.capacity, color_en:b.color_en||'White', has_ac:b.has_ac||false, status:b.status||'active', image_url:b.image_url||'' })
    setEditId(b.id); setModal('form')
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_bus'))) return
    try { await deleteBus(id); refetch(); showToast(t('bus_deleted')) }
    catch { showToast(t('save_fail'),'error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    const colorObj = ALL_COLORS.find(c=>c.en===form.color_en) || ALL_COLORS[0]
    const payload  = { ...form, color: colorObj.ar, color_en: colorObj.en }
    try {
      if (editId) { await updateBus(editId, payload); showToast(t('bus_updated')) }
      else        { await createBus(payload);          showToast(t('bus_added')) }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'),'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('bus_fleet')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{(buses||[]).length} {t('buses')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> {t('add_bus')}</button>
      </div>

      <div style={{ position:'relative', marginBottom:18, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
      </div>

      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:200, borderRadius:12 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={Bus} message={t('no_data')}/>}
      {!loading && filtered.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((bus,i) => {
            const c  = getBusColor(bus)
            const sc = statusCfg[bus.status] || statusCfg.active
            return (
              <div key={bus.id} className="card" style={{ display:"flex", flexDirection:"column", padding:0, overflow:'hidden', animation:`fadeUp ${0.1+i*0.04}s ease` }}>
                {/* Bus image or color strip */}
                {bus.image_url ? (
                  <div style={{ height:90, background:`url(${bus.image_url}) center/cover`, borderBottom:'1px solid var(--border)' }}/>
                ) : (
                  <div style={{ height:10, background:c }}/>
                )}
                <div style={{ padding:16, display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:46, height:46, borderRadius:11, background:`${c}22`, border:`2px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Bus size={26} color={c}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:18, fontWeight:700, fontFamily:'monospace' }}>{bus.plate_number}</div>
                      <div style={{ fontSize:15, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }}/>
                        {getColorName(bus.color_en)}
                      </div>
                    </div>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>

                  {/* AC + capacity */}
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8, marginBottom:12 }}>
                    <div style={{ padding:'8px 10px', background:'var(--surface)', borderRadius:7, textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>{bus.capacity}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{t('seats')}</div>
                    </div>
                    <div style={{ padding:'8px 10px', background:bus.has_ac?'rgba(30,107,212,0.08)':'var(--surface)', border:bus.has_ac?'1px solid rgba(114,138,110,0.2)':'1px solid var(--border)', borderRadius:7, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
                      {bus.has_ac ? <Wind size={20} color="var(--matcha)"/> : <Thermometer size={20} color="var(--text-muted)"/>}
                      <div style={{ fontSize:10, color:bus.has_ac?'var(--matcha)':'var(--text-muted)', fontWeight:600 }}>
                        {bus.has_ac ? (lang==='ar'?'مكيف':'A/C') : (lang==='ar'?'غير مكيف':'No A/C')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(bus)}><Edit2 size={16}/> {t('edit_btn')}</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(bus.id)}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?t('edit_bus'):t('add_bus')}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{t('plate_number')}</label>
              <input className="form-input" value={form.plate_number} onChange={e=>setForm({...form,plate_number:e.target.value})} placeholder={lang==='ar'?'أ ب ت 1234':'ABC 1234'} required/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('capacity')}</label>
              <input type="number" className="form-input" value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})} min="10" max="80" required/>
            </div>

            {/* Color picker */}
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">{t('color')}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginTop:4 }}>
                {ALL_COLORS.map(c => (
                  <button key={c.en} type="button" onClick={()=>setForm({...form,color_en:c.en})}
                    style={{ height:36, borderRadius:8, border:`3px solid ${form.color_en===c.en?'white':'transparent'}`, background:c.hex, cursor:'pointer', outline:form.color_en===c.en?`2px solid ${c.hex}`:'none', outlineOffset:2, transition:'all 0.15s' }}
                    title={lang==='ar'?c.ar:c.en}/>
                ))}
              </div>
              <div style={{ marginTop:6, fontSize:15, color:'var(--text-muted)' }}>
                {lang==='ar'?'اللون المختار:':'Selected:'} <strong style={{ color:getColorHex(form.color_en) }}>{getColorName(form.color_en)}</strong>
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'الحالة':'Status'}</label>
              <select className="form-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">{t('status_active')}</option>
                <option value="maintenance">{t('status_maintenance')}</option>
                <option value="inactive">{t('status_inactive')}</option>
              </select>
            </div>

            {/* AC toggle */}
            <div className="form-group" style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <label className="form-label">{lang==='ar'?'التكييف':'Air Conditioning'}</label>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={()=>setForm({...form,has_ac:true})}
                  style={{ flex:1, padding:'9px 0', borderRadius:8, border:`2px solid ${form.has_ac?'var(--calm)':'var(--border)'}`, background:form.has_ac?'rgba(38,101,140,0.12)':'var(--surface)', cursor:'pointer', fontSize:16, fontWeight:600, color:form.has_ac?'var(--matcha)':'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Wind size={17}/> {lang==='ar'?'مكيف':'A/C'}
                </button>
                <button type="button" onClick={()=>setForm({...form,has_ac:false})}
                  style={{ flex:1, padding:'9px 0', borderRadius:8, border:`2px solid ${!form.has_ac?'var(--border)':'var(--border)'}`, background:!form.has_ac?'rgba(38,101,140,0.12)':'var(--surface)', cursor:'pointer', fontSize:16, color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Thermometer size={17}/> {lang==='ar'?'غير مكيف':'No A/C'}
                </button>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}><Image size={17}/> {lang==='ar'?'رابط صورة الباص (اختياري)':'Bus Image URL (optional)'}</label>
            <input className="form-input" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..."/>
            {form.image_url && (
              <div style={{ marginTop:6, height:60, background:`url(${form.image_url}) center/cover`, borderRadius:6, border:'1px solid var(--border)' }}/>
            )}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?t('save_changes'):t('add_bus')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
