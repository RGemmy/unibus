import React, { useState } from 'react'
import { Plus, Search, Bus, MapPin, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import ToastContainer from '../components/Toast'
import EmptyState from '../components/EmptyState'
import { useApi, useToast } from '../hooks/useApi'
import { getTrips, createTrip, updateTrip, deleteTrip, getPlaces, getBuses, getSchedules } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { useIsMobile } from '../hooks/useIsMobile'

const emptyForm = { place:'', bus:'', schedule:'', trip_date:'', status:'pending',
  // free-text fallbacks when dropdown has no data
  place_name_txt:'', bus_plate_txt:'', schedule_time_txt:'' }

export default function TripsPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState(emptyForm)
  const [editId,       setEditId]       = useState(null)
  const [saving,       setSaving]       = useState(false)

  const { data: trips,     loading, refetch } = useApi(getTrips)
  const { data: places }    = useApi(getPlaces)
  const { data: buses }     = useApi(getBuses)
  const { data: schedules } = useApi(getSchedules)
  const { toasts, showToast } = useToast()

  const statusCfg = {
    active:    { label:t('status_active'),    cls:'badge-green' },
    completed: { label:t('status_completed'), cls:'badge-blue'  },
    pending:   { label:t('status_pending'),   cls:'badge-amber' },
    cancelled: { label:t('status_cancelled'), cls:'badge-red'   },
  }
  const statuses = ['all','active','pending','completed','cancelled']
  const statusLabel = { all:t('all'), active:t('status_active'), pending:t('status_pending'), completed:t('status_completed'), cancelled:t('status_cancelled') }

  const filtered = (trips||[]).filter(tr => {
    const q = search.toLowerCase()
    const matchQ = tr.place_name?.toLowerCase().includes(q) || tr.bus_plate?.toLowerCase().includes(q)
    return matchQ && (statusFilter==='all' || tr.status===statusFilter)
  })

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (tr) => {
    setForm({ place:tr.place||'', bus:tr.bus||'', schedule:tr.schedule||'', trip_date:tr.trip_date||'', status:tr.status||'pending', place_name_txt:tr.place_name||'', bus_plate_txt:tr.bus_plate||'', schedule_time_txt:tr.schedule_time||'' })
    setEditId(tr.id); setModal('form')
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_trip'))) return
    try { await deleteTrip(id); refetch(); showToast(t('trip_deleted')) }
    catch { showToast(t('save_fail'), 'error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      // Build final payload — use dropdown id OR free text
      const payload = {
        place:         form.place     || null,
        bus:           form.bus       || null,
        schedule:      form.schedule  || null,
        trip_date:     form.trip_date,
        status:        form.status,
        // For display when no backend relationship
        place_name:    (places||[]).find(p=>String(p.id)===String(form.place))?.place_name || form.place_name_txt || form.place,
        bus_plate:     (buses||[]).find(b=>String(b.id)===String(form.bus))?.plate_number  || form.bus_plate_txt  || form.bus,
        schedule_time: (schedules||[]).find(s=>String(s.id)===String(form.schedule))?.schedule_time || form.schedule_time_txt || form.schedule,
        bus_capacity:  (buses||[]).find(b=>String(b.id)===String(form.bus))?.capacity || 45,
        available_seats: (buses||[]).find(b=>String(b.id)===String(form.bus))?.capacity || 45,
      }
      if (editId) { await updateTrip(editId, payload); showToast(t('trip_updated')) }
      else        { await createTrip(payload);          showToast(t('trip_added'))   }
      refetch(); setModal(null)
    } catch { showToast(t('save_fail'), 'error') }
    finally { setSaving(false) }
  }

  const hasPlaces    = (places||[]).length > 0
  const hasBuses     = (buses||[]).length > 0
  const hasSchedules = (schedules||[]).length > 0

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1300, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>

      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('manage_trips')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>{filtered.length} {t('trips')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> {t('add_trip')}</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={18} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:38 }}/>
        </div>
        {statuses.map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className="btn" style={{ background:statusFilter===s?'var(--calm)':'var(--surface)', color:statusFilter===s?'white':'var(--text-secondary)', border:`1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily:'var(--font)' }}>
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {loading && <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:220, borderRadius:14 }}/>)}</div>}
      {!loading && filtered.length===0 && <EmptyState icon={Bus} message={t('no_trips')}/>}

      {!loading && filtered.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
          {filtered.map((trip,i)=>(
            <div key={trip.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(38,101,140,0.12)', border:'1px solid rgba(114,138,110,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bus size={22} color="var(--matcha)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:17, fontWeight:700 }}>{trip.bus_plate}</div>
                    <div style={{ fontSize:14, color:'var(--text-muted)' }}>{t('bus_label')}</div>
                  </div>
                </div>
                <span className={`badge ${statusCfg[trip.status]?.cls}`}>{statusCfg[trip.status]?.label}</span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'10px 12px', background:'var(--surface)', borderRadius:8 }}>
                <MapPin size={17} color="var(--evergreen)"/>
                <span style={{ fontSize:16, fontWeight:500 }}>{trip.place_name}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { val:trip.schedule_time,  lbl:t('trip_time'),   mono:true },
                  { val:`${trip.bus_capacity-(trip.available_seats||0)}/${trip.bus_capacity}`, lbl:t('seats_label') },
                  { val:trip.trip_date,      lbl:t('trip_date') },
                ].map(({val,lbl,mono})=>(
                  <div key={lbl} style={{ textAlign:'center', padding:10, background:'var(--surface)', borderRadius:7 }}>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:mono?'monospace':'inherit' }}>{val}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(trip)}><Edit2 size={16}/> {t('edit_btn')}</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(trip.id)}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?t('edit_trip'):t('add_trip')}>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>

            {/* Destination */}
            <div className="form-group">
              <label className="form-label">{t('destination')}</label>
              {hasPlaces ? (
                <select className="form-input" value={form.place} onChange={e=>setForm({...form,place:e.target.value})} required>
                  <option value="">— {t('destination')} —</option>
                  {places.map(p=><option key={p.id} value={p.id}>{p.place_name}</option>)}
                </select>
              ) : (
                <input className="form-input" placeholder={lang==='ar'?'مثال: جامعة الملك سعود':'e.g. King Saud University'} value={form.place_name_txt} onChange={e=>setForm({...form,place_name_txt:e.target.value})} required/>
              )}
            </div>

            {/* Bus */}
            <div className="form-group">
              <label className="form-label">{t('bus_label')}</label>
              {hasBuses ? (
                <select className="form-input" value={form.bus} onChange={e=>setForm({...form,bus:e.target.value})} required>
                  <option value="">— {t('bus_label')} —</option>
                  {buses.map(b=><option key={b.id} value={b.id}>{b.plate_number} ({b.capacity} {t('seats')})</option>)}
                </select>
              ) : (
                <input className="form-input" placeholder={lang==='ar'?'رقم اللوحة':'Plate number'} value={form.bus_plate_txt} onChange={e=>setForm({...form,bus_plate_txt:e.target.value})} required/>
              )}
            </div>

            {/* Schedule */}
            <div className="form-group">
              <label className="form-label">{t('schedule')}</label>
              {hasSchedules ? (
                <select className="form-input" value={form.schedule} onChange={e=>setForm({...form,schedule:e.target.value})} required>
                  <option value="">— {t('schedule')} —</option>
                  {schedules.map(s=><option key={s.id} value={s.id}>{s.schedule_time} {s.days?`(${s.days})`:''}</option>)}
                </select>
              ) : (
                <input className="form-input" placeholder="07:30" value={form.schedule_time_txt} onChange={e=>setForm({...form,schedule_time_txt:e.target.value})} required/>
              )}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">{t('trip_date')}</label>
              <input type="date" className="form-input" value={form.trip_date} onChange={e=>setForm({...form,trip_date:e.target.value})} required/>
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">{t('filter')}</label>
            <select className="form-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="pending">{t('status_pending')}</option>
              <option value="active">{t('status_active')}</option>
              <option value="completed">{t('status_completed')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </select>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?t('saving'):editId?t('save_changes'):t('add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
