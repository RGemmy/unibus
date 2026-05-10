import React, { useState, useMemo } from 'react'
import { Plus, Search, Bus, MapPin, Edit2, Trash2, User, Bell, ArrowRight, ArrowLeft, ArrowLeftRight, CalendarDays, CheckSquare, Square, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useApi, useToast } from '../../hooks/useApi'
import { getTrips, createTrip, updateTrip, deleteTrip, getBuses, getPlaces, getSchedules, getDrivers } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Helper: get next workday string ─────────────────────────────────────────
function getNextWorkday(fromDate) {
  const d = new Date(fromDate || new Date())
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 5 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function formatArabicDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

// Pricing constants — change here to update all trips
const PRICE_SINGLE = 55   // single trip price (go only or return only)
const PRICE_ROUND  = 105  // round trip discount price (go + return together)

const emptyForm = {
  place: '', bus: '', driver_id: '', trip_date: '', status: 'active',
  trip_type: 'go',
  go_time: '',      // وقت الذهاب
  return_time: '',  // وقت العودة
  price: PRICE_SINGLE,
}

// Badge for trip type
function TripTypeBadge({ type, returnTime, lang }) {
  // If it's a 'go' trip that also has a return_time, display it as round
  const effectiveType = (type === 'go' && returnTime) ? 'round' : type
  const cfg = {
    go:     { ar:'ذهاب',         en:'Outbound', icon:'🚌', bg:'rgba(59,130,246,0.15)',  border:'rgba(59,130,246,0.4)',  color:'#60a5fa' },
    return: { ar:'عودة',         en:'Return',   icon:'🔄', bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.4)', color:'#34d399' },
    round:  { ar:'ذهاب وعودة',   en:'Round',    icon:'🔁', bg:'rgba(38,101,140,0.15)', border:'rgba(38,101,140,0.4)', color:'#54ACBF' },
  }
  const c = cfg[effectiveType] || cfg.go
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:8,
      background:c.bg, border:`1px solid ${c.border}`, color:c.color,
      display:'inline-flex', alignItems:'center', gap:4,
    }}>
      {c.icon} {lang==='ar' ? c.ar : c.en}
    </span>
  )
}

export default function BusModTrips() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const { addLocalNotification } = useNotifications()

  const [search, setSearch] = useState('')
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  // ── Tomorrow Scheduler State ────────────────────────────────────────────────
  const [tomorrowSelected, setTomorrowSelected] = useState(new Set())
  const [schedulingTomorrow, setSchedulingTomorrow] = useState(false)

  // ── API Hooks (must come before any logic that uses their data) ─────────────
  const { data:trips,     loading, refetch } = useApi(getTrips)
  const { data:buses }    = useApi(getBuses)
  const { data:places }   = useApi(getPlaces)
  const { data:drivers }  = useApi(getDrivers)
  const { toasts, showToast } = useToast()

  const tomorrowDate = getNextWorkday()

  // trips that are "template" trips (today or future active) to pick from
  const templateTrips = useMemo(() => {
    const seen = new Set()
    return (trips || []).filter(tr => {
      if (tr.status === 'cancelled' || tr.status === 'completed') return false
      const key = `${tr.bus}-${tr.schedule_time}-${tr.trip_type}-${tr.place}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [trips])

  const openTomorrowScheduler = () => {
    // Pre-select trips that are already scheduled for tomorrow
    const alreadyTomorrow = new Set(
      (trips || [])
        .filter(tr => tr.trip_date === tomorrowDate && tr.status === 'active')
        .map(tr => `${tr.bus}-${tr.schedule_time}-${tr.trip_type}-${tr.place}`)
    )
    setTomorrowSelected(alreadyTomorrow)
    setModal('tomorrow')
  }

  const toggleTomorrowTrip = (key) => {
    setTomorrowSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const applyTomorrowSchedule = async () => {
    setSchedulingTomorrow(true)
    try {
      // Remove existing tomorrow active trips
      const existingTomorrow = (trips || []).filter(
        tr => tr.trip_date === tomorrowDate && tr.status === 'active'
      )
      for (const tr of existingTomorrow) {
        await deleteTrip(tr.id)
      }
      // Create new trips for selected templates
      const selectedTrips = templateTrips.filter(tr => {
        const key = `${tr.bus}-${tr.schedule_time}-${tr.trip_type}-${tr.place}`
        return tomorrowSelected.has(key)
      })
      for (const tr of selectedTrips) {
        await createTrip({
          place: tr.place,
          bus: tr.bus,
          driver_id: tr.driver_id || '',
          trip_date: tomorrowDate,
          status: 'active',
          trip_type: tr.trip_type || 'go',
          schedule_time: tr.schedule_time,
          go_time: tr.trip_type === 'return' ? '' : tr.schedule_time,
          return_time: tr.trip_type === 'return' ? tr.schedule_time : (tr.return_time || ''),
        })
      }
      showToast(lang === 'ar' ? `تم جدولة ${selectedTrips.length} رحلة ليوم ${tomorrowDate} ✅` : `Scheduled ${selectedTrips.length} trips for ${tomorrowDate} ✅`)
      setModal(null)
      refetch()
    } catch {
      showToast(lang === 'ar' ? 'حدث خطأ أثناء الجدولة' : 'Error scheduling trips', 'error')
    } finally {
      setSchedulingTomorrow(false)
    }
  }

  // Count how many trips are already set for tomorrow
  const tomorrowTripCount = (trips || []).filter(
    tr => tr.trip_date === tomorrowDate && tr.status === 'active'
  ).length

  const statusCfg = {
    active:    { label: t('status_active'),    cls:'badge-green' },
    hidden:    { label: lang==='ar'?'غير نشط':'Inactive',        cls:'badge-amber' },
    completed: { label: t('status_completed'), cls:'badge-blue'  },
    pending:   { label: t('status_pending'),   cls:'badge-amber' },
    cancelled: { label: t('status_cancelled'), cls:'badge-red'   },
  }

  const handleToggleVisibility = async (tr) => {
    const newStatus = tr.status === 'hidden' ? 'active' : 'hidden'
    try {
      await updateTrip(tr.id, { ...tr, status: newStatus })
      refetch()
      showToast(newStatus === 'hidden'
        ? (lang==='ar' ? 'تم إخفاء الرحلة عن الطلاب' : 'Trip hidden from students')
        : (lang==='ar' ? 'الرحلة ظاهرة للطلاب الآن' : 'Trip is now visible to students')
      )
    } catch { showToast(lang==='ar'?'فشل التعديل':'Failed to update', 'error') }
  }

  const filtered = (trips||[]).filter(tr =>
    tr.place_name?.toLowerCase().includes(search.toLowerCase()) ||
    tr.bus_plate?.toLowerCase().includes(search.toLowerCase()) ||
    tr.driver_name?.includes(search)
  ).sort((a, b) => {
    const dateCompare = (a.trip_date || '').localeCompare(b.trip_date || '')
    if (dateCompare !== 0) return dateCompare
    return (a.schedule_time || '').localeCompare(b.schedule_time || '')
  })

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (tr) => {
    // Detect round trip: go type that has a return_time stored
    const effectiveType = (tr.trip_type === 'go' && tr.return_time) ? 'round' : (tr.trip_type || 'go')
    setForm({
      place: tr.place, bus: tr.bus, driver_id: tr.driver_id || '',
      trip_date: tr.trip_date, status: tr.status,
      trip_type: effectiveType,
      go_time:     tr.trip_type === 'return' ? '' : (tr.schedule_time || ''),
      return_time: tr.trip_type === 'return' ? (tr.schedule_time || '') : (tr.return_time || ''),
    })
    setEditId(tr.id)
    setModal('form')
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_trip'))) return
    try { await deleteTrip(id); refetch(); showToast(t('trip_deleted')) }
    catch { showToast(t('save_fail'), 'error') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        // Edit: use go_time or return_time based on trip type
        const sched_time = form.trip_type === 'return' ? form.return_time : form.go_time
        await updateTrip(editId, { ...form, schedule_time: sched_time })
        showToast(t('trip_updated'))
        const oldTrip = (trips||[]).find(t => t.id === editId)
        const driverChanged = form.driver_id && String(form.driver_id) !== String(oldTrip?.driver_id)
        const dateChanged   = form.trip_date && form.trip_date !== oldTrip?.trip_date
        const timeChanged   = (form.go_time && form.go_time !== oldTrip?.go_time) ||
                              (form.return_time && form.return_time !== oldTrip?.return_time) ||
                              (form.schedule_time && form.schedule_time !== oldTrip?.schedule_time)
        if (form.driver_id && (driverChanged || dateChanged || timeChanged)) {
          if (form.trip_type === 'round') {
            notifyDriver(form.driver_id, form.go_time, 'go')
            notifyDriver(form.driver_id, form.return_time, 'return')
          } else {
            notifyDriver(form.driver_id, form.go_time || form.return_time || sched_time)
          }
        }
      } else if (form.trip_type === 'round') {
        // Create ONE trip with trip_type 'round' — moderator sees it as one, students see go+return tabs
        await createTrip({ ...form, schedule_time: form.go_time, go_time: form.go_time, return_time: form.return_time })
        if (form.driver_id) {
          notifyDriver(form.driver_id, form.go_time, 'go')
          notifyDriver(form.driver_id, form.return_time, 'return')
        }
        showToast(lang==='ar' ? '✅ تم إضافة رحلة الذهاب والعودة' : '✅ Round trip added')
      } else {
        const sched_time = form.trip_type === 'return' ? form.return_time : form.go_time
        await createTrip({ ...form, schedule_time: sched_time })
        if (form.driver_id) notifyDriver(form.driver_id, sched_time)
        showToast(t('trip_added'))
      }
      refetch()
      setModal(null)
    } catch {
      showToast(t('save_fail'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const notifyDriver = (driverId, time, leg) => {
    const driver = (drivers||[]).find(d => d.id === Number(driverId))
    const bus    = (buses||[]).find(b => b.id === Number(form.bus))
    const place  = (places||[]).find(p => p.id === Number(form.place))
    if (!driver) return
    const legLabelAr = leg === 'go' ? '[ذهاب] ' : leg === 'return' ? '[عودة] ' : ''
    const legLabelEn = leg === 'go' ? '[Go] '   : leg === 'return' ? '[Return] ' : ''
    const dirAr = leg === 'return' ? 'من' : 'إلى'
    const msgAr = `🚌 ${legLabelAr}تم تعيينك لرحلة ${dirAr} ${place?.place_name||'?'} الساعة ${time||'?'} بتاريخ ${form.trip_date||'?'} — الباص: ${bus?.plate_number||'?'}`
    const msgEn = `🚌 ${legLabelEn}Trip assigned — ${place?.place_name_en||place?.place_name||'?'} at ${time||'?'} on ${form.trip_date||'?'} — Bus: ${bus?.plate_number||'?'}`
    try {
      const db = JSON.parse(localStorage.getItem('demoDB') || '{}')
      let driverUserId = null
      for (const record of Object.values(db)) {
        if (record.user?.user_name === driver.user_name && record.user?.role === 'driver') {
          driverUserId = record.user.id; break
        }
      }
      const targetKey = driverUserId ? `notifications_${driverUserId}` : `notifications_driver_${driver.id}`
      const existing  = JSON.parse(localStorage.getItem(targetKey) || '[]')
      const n = { id: Date.now(), message_ar: msgAr, message_en: msgEn, message: msgAr, type:'info', is_read:false, created_at: new Date().toISOString() }
      localStorage.setItem(targetKey, JSON.stringify([n, ...existing.slice(0, 29)]))
    } catch {}
  }

  const driverLabel = (tr) => tr.driver_name
    ? (lang==='ar' ? `👤 ${tr.driver_name}` : `👤 ${tr.driver_name}`)
    : (lang==='ar' ? 'لم يُعيَّن سائق' : 'No driver assigned')

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1200, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{t('trips')}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {(trips||[]).length} {lang==='ar'?'رحلة':'trips'}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {/* Tomorrow scheduler button */}
          <button
            className="btn btn-secondary"
            onClick={openTomorrowScheduler}
            style={{ display:'flex', alignItems:'center', gap:8, position:'relative' }}
          >
            <CalendarDays size={18}/>
            {lang === 'ar' ? `رحلات بكرا` : `Tomorrow's Trips`}
            {tomorrowTripCount > 0 && (
              <span style={{
                background:'var(--calm,#54ACBF)', color:'white',
                borderRadius:10, fontSize:11, fontWeight:700,
                padding:'1px 7px', marginRight:2,
              }}>
                {tomorrowTripCount}
              </span>
            )}
          </button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> {t('add_trip')}</button>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:18, maxWidth:360 }}>
        <Search size={17} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:36 }}/>
      </div>

      {loading && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height:210, borderRadius:12 }}/>)}
        </div>
      )}
      {!loading && filtered.length===0 && <EmptyState icon={Bus} message={t('no_trips')}/>}

      {!loading && filtered.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {filtered.map((tr, i) => (
            <div key={tr.id} className="card" style={{ padding:18, animation:`fadeUp ${0.1+i*0.04}s ease`, display:'flex', flexDirection:'column' }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:'rgba(38,101,140,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bus size={17} color="var(--matcha)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:17, fontWeight:700 }}>
                      {lang==='en' ? (tr.bus_plate_en||tr.bus_plate) : tr.bus_plate}
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>{tr.trip_date}</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span className={`badge ${statusCfg[tr.status]?.cls}`}>{statusCfg[tr.status]?.label}</span>
                    {(tr.status === 'active' || tr.status === 'hidden') && (
                      <button
                        onClick={() => handleToggleVisibility(tr)}
                        title={tr.status === 'hidden' ? (lang==='ar'?'إظهار للطلاب':'Show to students') : (lang==='ar'?'إخفاء عن الطلاب':'Hide from students')}
                        style={{
                          width: 42, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none', padding: 0,
                          background: tr.status === 'active' ? '#3b82f6' : 'rgba(100,116,139,0.3)',
                          position: 'relative', transition: 'background 0.25s ease', flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 3,
                          right: tr.status === 'active' ? 3 : undefined,
                          left: tr.status === 'hidden' ? 3 : undefined,
                          width: 18, height: 18, borderRadius: '50%', background: 'white',
                          transition: 'left 0.25s ease, right 0.25s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}/>
                      </button>
                    )}
                  </div>
                  <TripTypeBadge type={tr.trip_type||'go'} returnTime={tr.return_time} lang={lang}/>
                </div>
              </div>

              {/* Destination */}
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 11px', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:7, marginBottom:8 }}>
                <MapPin size={16} color="var(--evergreen)"/>
                <span style={{ fontSize:16 }}>
                  {lang==='en' ? (tr.place_name_en||tr.place_name) : tr.place_name}
                </span>
              </div>

              {/* Driver */}
              <div style={{
                display:'flex', alignItems:'center', gap:7, padding:'9px 11px',
                background: tr.driver_name ? 'rgba(16,185,129,0.07)' : 'var(--surface)',
                border:`1px solid ${tr.driver_name?'rgba(16,185,129,0.25)':'var(--border)'}`,
                borderRadius:7, marginBottom:10,
              }}>
                <User size={16} color={tr.driver_name?'#34d399':'var(--text-muted)'}/>
                <span style={{ fontSize:15, color:tr.driver_name?'#34d399':'var(--text-muted)', fontWeight:tr.driver_name?600:400 }}>
                  {driverLabel(tr)}
                </span>
                {tr.driver_name && <Bell size={14} color="#34d399" style={{ marginRight:'auto' }}/>}
              </div>

              {/* Time */}
              <div style={{ fontSize:15, color:'var(--text-muted)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span>🕐 {tr.schedule_time}</span>
                {(tr.trip_type==='go'||tr.trip_type==='round') && tr.return_time && (
                  <span style={{ color:'var(--text-muted)', fontSize:13 }}>/ عودة {tr.return_time}</span>
                )}
              </div>

              {/* Spacer */}
              <div style={{ flex:1 }}/>

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(tr)}>
                  <Edit2 size={16}/> {t('edit_btn')}
                </button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(tr.id)}>
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tomorrow Scheduler Modal ── */}
      <Modal
        isOpen={modal === 'tomorrow'}
        onClose={() => setModal(null)}
        title={lang === 'ar' ? `🗓 جدول رحلات بكرا — ${formatArabicDate(tomorrowDate)}` : `🗓 Schedule Tomorrow — ${tomorrowDate}`}
        size="md"
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Info banner */}
          <div style={{
            padding:'12px 14px',
            background:'rgba(59,130,246,0.08)',
            border:'1.5px solid rgba(59,130,246,0.3)',
            borderRadius:10,
            fontSize:14, color:'var(--text-secondary)', lineHeight:1.7,
          }}>
            {lang === 'ar'
              ? `🗓 اختار الرحلات اللي هتتعمل بكرا (${formatArabicDate(tomorrowDate)}). الرحلات اللي مش مختارة هتتخفى من الطلاب بس هتفضل موجودة وتقدر تضيفها في أي وقت.`
              : `🗓 Select which trips will run tomorrow (${tomorrowDate}). Unselected trips will be hidden from students but remain saved — you can re-add them anytime.`}
          </div>

          {/* Trip list */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:420, overflowY:'auto' }}>
            {templateTrips.length === 0 && (
              <div style={{ textAlign:'center', color:'var(--text-muted)', padding:24 }}>
                {lang === 'ar' ? 'مفيش رحلات متاحة' : 'No trips available'}
              </div>
            )}
            {templateTrips.map(tr => {
              const key = `${tr.bus}-${tr.schedule_time}-${tr.trip_type}-${tr.place}`
              const selected = tomorrowSelected.has(key)
              const effectiveTripType = (tr.trip_type === 'go' && tr.return_time) ? 'round' : (tr.trip_type || 'go')
              const typeCfg = {
                go:     { color:'#60a5fa', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.45)', icon:'🚌', label: lang==='ar'?'ذهاب':'Go' },
                return: { color:'#60a5fa', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.45)', icon:'🔄', label: lang==='ar'?'عودة':'Return' },
                round:  { color:'#60a5fa', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.45)', icon:'🔁', label: lang==='ar'?'ذهاب وعودة':'Round' },
              }
              const tc = typeCfg[effectiveTripType]
              return (
                <div
                  key={key}
                  onClick={() => toggleTomorrowTrip(key)}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px',
                    borderRadius:10,
                    border:`2px solid ${selected ? tc.border : 'var(--border)'}`,
                    background: selected ? tc.bg : 'var(--surface)',
                    cursor:'pointer',
                    transition:'all 0.15s',
                    userSelect:'none',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ color: selected ? tc.color : 'var(--text-muted)', flexShrink:0 }}>
                    {selected
                      ? <CheckSquare size={20} strokeWidth={2.5}/>
                      : <Square size={20} strokeWidth={1.5}/>
                    }
                  </div>

                  {/* Trip icon */}
                  <span style={{ fontSize:20, flexShrink:0 }}>{tc.icon}</span>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                      <span>🕐 {tr.schedule_time}</span>
                      <span style={{
                        fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:8,
                        background: tc.bg, border:`1px solid ${tc.border}`, color: tc.color,
                      }}>
                        {tc.label}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3, display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span>🚌 {lang==='en'?(tr.bus_plate_en||tr.bus_plate):tr.bus_plate}</span>
                      <span>📍 {lang==='en'?(tr.place_name_en||tr.place_name):tr.place_name}</span>
                    </div>
                    {tr.driver_name && (
                      <div style={{ fontSize:12, color:'#34d399', marginTop:2 }}>
                        👤 {tr.driver_name}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div style={{
            padding:'10px 14px',
            background:'rgba(16,185,129,0.07)',
            border:'1px solid rgba(16,185,129,0.25)',
            borderRadius:8,
            fontSize:14, color:'#34d399', fontWeight:600,
          }}>
            {lang === 'ar'
              ? `✅ ${tomorrowSelected.size} رحلة مختارة من ${templateTrips.length}`
              : `✅ ${tomorrowSelected.size} of ${templateTrips.length} trips selected`}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyTomorrowSchedule}
              disabled={schedulingTomorrow}
            >
              {schedulingTomorrow
                ? (lang === 'ar' ? 'جاري الجدولة...' : 'Scheduling...')
                : (lang === 'ar' ? '✅ تأكيد الجدولة' : '✅ Confirm Schedule')
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Form Modal ── */}
      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId ? t('edit_trip') : t('add_trip')} size="md">
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* ── Trip type selector (big buttons) ── */}
          <div className="form-group">
            <label className="form-label">{lang==='ar'?'نوع الرحلة':'Trip Type'}</label>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:10, marginTop:4 }}>
              {[
                { val:'go',     arLabel:'ذهاب',       enLabel:'Outbound',   icon:'🚌', color:'#60a5fa', borderColor:'rgba(59,130,246,0.5)'  },
                { val:'return', arLabel:'عودة',        enLabel:'Return',     icon:'🔄', color:'#34d399', borderColor:'rgba(16,185,129,0.5)'  },
                { val:'round',  arLabel:'ذهاب وعودة', enLabel:'Round Trip', icon:'🔁', color:'#54ACBF', borderColor:'rgba(38,101,140,0.5)'  },
              ].map(({ val, arLabel, enLabel, icon, color, borderColor }) => {
                const active = form.trip_type === val
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm({ ...form, trip_type: val })}
                    style={{
                      padding:'14px 8px',
                      borderRadius:10,
                      border:`2px solid ${active ? borderColor : 'var(--border)'}`,
                      background: active ? `rgba(${color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.1)` : 'var(--surface)',
                      cursor:'pointer',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                      transition:'all 0.15s',
                      outline:'none',
                    }}
                  >
                    <span style={{ fontSize:24 }}>{icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color: active ? color : 'var(--text-secondary)', fontFamily:'var(--font)' }}>
                      {lang==='ar' ? arLabel : enLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Time inputs — changes based on trip_type ── */}
          {form.trip_type === 'round' ? (
            /* Round trip: expanded section with go + return times */
            <div style={{ padding:'16px', background:'rgba(38,101,140,0.06)', border:'2px solid rgba(38,101,140,0.25)', borderRadius:12 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#54ACBF', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                🔁 {lang==='ar' ? 'حدد مواعيد الذهاب والعودة' : 'Set departure & return times'}
              </div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label" style={{ color:'#60a5fa' }}>
                    🚌 {lang==='ar' ? 'موعد الذهاب' : 'Departure Time'}
                  </label>
                  <input
                    type="time" className="form-input"
                    value={form.go_time}
                    onChange={e => setForm({ ...form, go_time: e.target.value })}
                    required
                    style={{ fontFamily:'monospace', fontSize:16, borderColor:'rgba(59,130,246,0.4)' }}
                  />
                </div>
                <div className="form-group" style={{ margin:0 }}>
                  <label className="form-label" style={{ color:'#34d399' }}>
                    🔄 {lang==='ar' ? 'موعد العودة' : 'Return Time'}
                  </label>
                  <input
                    type="time" className="form-input"
                    value={form.return_time}
                    onChange={e => setForm({ ...form, return_time: e.target.value })}
                    required
                    style={{ fontFamily:'monospace', fontSize:16, borderColor:'rgba(16,185,129,0.4)' }}
                  />
                </div>
              </div>
              <div style={{ marginTop:10, fontSize:13, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
                ℹ️ {lang==='ar'
                  ? 'سيُنشئ النظام رحلتين: رحلة ذهاب ورحلة عودة، وستظهران بشكل منفصل للطلاب'
                  : 'The system will create 2 trips: outbound & return. Each will show separately to students.'}
              </div>
            </div>
          ) : form.trip_type === 'return' ? (
            <div className="form-group">
              <label className="form-label" style={{ color:'#34d399' }}>
                🔄 {lang==='ar' ? 'موعد العودة' : 'Return Time'}
              </label>
              <input
                type="time" className="form-input"
                value={form.return_time}
                onChange={e => setForm({ ...form, return_time: e.target.value })}
                required
                style={{ fontFamily:'monospace', fontSize:16 }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" style={{ color:'#60a5fa' }}>
                🚌 {lang==='ar' ? 'موعد الذهاب' : 'Departure Time'}
              </label>
              <input
                type="time" className="form-input"
                value={form.go_time}
                onChange={e => setForm({ ...form, go_time: e.target.value })}
                required
                style={{ fontFamily:'monospace', fontSize:16 }}
              />
            </div>
          )}

          {/* ── Destination + Bus ── */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{t('destination')}</label>
              <select className="form-input" value={form.place} onChange={e=>setForm({...form, place:e.target.value})} required>
                <option value="">{lang==='ar'?'اختر الوجهة':'Select destination'}</option>
                {(places||[]).map(p =>
                  <option key={p.id} value={p.id}>{lang==='en'?(p.place_name_en||p.place_name):p.place_name}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('bus_label')}</label>
              <select className="form-input" value={form.bus} onChange={e=>setForm({...form, bus:e.target.value})} required>
                <option value="">{lang==='ar'?'اختر الباص':'Select bus'}</option>
                {(buses||[]).map(b =>
                  <option key={b.id} value={b.id}>{lang==='en'?(b.plate_en||b.plate_number):b.plate_number} — {b.capacity} {t('seats')}</option>
                )}
              </select>
            </div>
          </div>

          {/* ── Date + Status ── */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{t('trip_date')}</label>
              <input
                type="date" className="form-input"
                value={form.trip_date}
                onChange={e=>setForm({...form, trip_date:e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'الحالة':'Status'}</label>
              <select className="form-input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                <option value="active">{t('status_active')}</option>
                <option value="pending">{t('status_pending')}</option>
                <option value="completed">{t('status_completed')}</option>
                <option value="cancelled">{t('status_cancelled')}</option>
              </select>
            </div>
          </div>

          {/* ── Driver ── */}
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <User size={17} color="var(--evergreen)"/>
              {lang==='ar' ? 'السائق المُعيَّن' : 'Assigned Driver'}
              {form.driver_id && (
                <span style={{ fontSize:13, color:'#34d399', fontWeight:500 }}>
                  — {lang==='ar'?'سيصله إشعار فوراً ✅':'will be notified ✅'}
                </span>
              )}
            </label>
            <select
              className="form-input"
              value={form.driver_id}
              onChange={e=>setForm({...form, driver_id:e.target.value})}
              style={{ borderColor: form.driver_id ? 'rgba(13,148,136,0.5)' : 'var(--border)' }}
            >
              <option value="">{lang==='ar'?'— اختر السائق (اختياري) —':'— Select driver (optional) —'}</option>
              {(drivers||[]).map(d =>
                <option key={d.id} value={d.id}>{d.user_name} — {lang==='ar'?'رقم الرخصة':'License'}: {d.license_number}</option>
              )}
            </select>
          </div>

          {/* ── Notification preview ── */}
          {form.driver_id && form.place && form.bus && (form.go_time||form.return_time) && form.trip_date && (
            <div style={{ padding:'12px 14px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:9 }}>
              <div style={{ fontSize:14, color:'#34d399', fontWeight:700, marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                <Bell size={15}/> {lang==='ar'?'معاينة الإشعار للسائق:':'Driver notification preview:'}
              </div>
              <div style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
                🚌 {lang==='ar'
                  ? `رحلة إلى ${(places||[]).find(p=>p.id===Number(form.place))?.place_name||'?'} — ${form.trip_type==='round'?`ذهاب ${form.go_time} / عودة ${form.return_time}`:form.go_time||form.return_time} — ${form.trip_date}`
                  : `Trip to ${(places||[]).find(p=>p.id===Number(form.place))?.place_name_en||'?'} — ${form.trip_type==='round'?`Go ${form.go_time} / Return ${form.return_time}`:form.go_time||form.return_time} — ${form.trip_date}`}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('saving') : editId ? t('save_changes') : t('add')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
