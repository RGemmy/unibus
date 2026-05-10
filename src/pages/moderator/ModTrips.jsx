import React, { useState } from 'react'
import { Search, Bus, MapPin, Edit2 } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import { useApi, useToast } from '../../hooks/useApi'
import { getTrips, updateTrip } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

const statusConfig = {
  active:    { label: 'نشطة',         class: 'badge-green' },
  completed: { label: 'مكتملة',       class: 'badge-blue'  },
  pending:   { label: 'قيد الانتظار', class: 'badge-amber' },
  cancelled: { label: 'ملغية',        class: 'badge-red'   },
}

export default function ModTrips() {
  const isMobile = useIsMobile()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal,        setModal]        = useState(null)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [saving,       setSaving]       = useState(false)

  const { data: trips, loading, error, refetch } = useApi(getTrips)
  const { toasts, showToast } = useToast()

  const filtered = (trips||[]).filter(t => {
    const matchSearch = t.place_name?.includes(search) || t.bus_plate?.includes(search)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const openEdit = (trip) => { setSelectedTrip(trip); setModal('edit') }

  const handleStatusChange = async (newStatus) => {
    if (!selectedTrip) return
    setSaving(true)
    try {
      await updateTrip(selectedTrip.id, { status: newStatus })
      showToast(`تم تغيير حالة الرحلة إلى ${statusConfig[newStatus]?.label}`)
      refetch(); setModal(null)
    } catch { showToast('فشل التعديل', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>إدارة الرحلات</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{filtered.length} رحلة</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input className="form-input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
        </div>
        {['all','active','pending','completed','cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn" style={{ background: statusFilter===s?'var(--calm)':'var(--surface)', color: statusFilter===s?'white':'var(--text-secondary)', border: `1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily: 'var(--font)' }}>
            {{ all:'الكل', active:'نشطة', pending:'معلقة', completed:'مكتملة', cancelled:'ملغية' }[s]}
          </button>
        ))}
      </div>

      {loading && <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }}/>)}</div>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {filtered.map((trip, i) => (
            <div key={trip.id} className="card" style={{ padding: 18, animation: `fadeUp ${0.1+i*0.04}s ease` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(38,101,140,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bus size={22} color="var(--matcha)"/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{trip.bus_plate}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.trip_date}</div>
                  </div>
                </div>
                <span className={`badge ${statusConfig[trip.status]?.class}`}>{statusConfig[trip.status]?.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--surface)', borderRadius: 8, marginBottom: 12 }}>
                <MapPin size={16} color="var(--evergreen)"/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{trip.place_name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex:1, textAlign:'center', padding:10, background:'var(--surface)', borderRadius:7 }}>
                  <div style={{ fontSize:17, fontWeight:700, fontFamily:'monospace' }}>{trip.schedule_time}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)' }}>الوقت</div>
                </div>
                <div style={{ flex:1, textAlign:'center', padding:10, background:'var(--surface)', borderRadius:7 }}>
                  <div style={{ fontSize:17, fontWeight:700 }}>{trip.available_seats}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)' }}>متاح</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width:'100%' }} onClick={() => openEdit(trip)}>
                <Edit2 size={16}/> تغيير الحالة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit status modal */}
      <Modal isOpen={modal==='edit'} onClose={() => setModal(null)} title="تغيير حالة الرحلة" size="sm">
        {selectedTrip && (
          <div>
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedTrip.place_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{selectedTrip.schedule_time} · {selectedTrip.trip_date}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>اختر الحالة الجديدة:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['active','pending','completed','cancelled'].map(s => (
                <button key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={saving || selectedTrip.status === s}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', gap: 10, opacity: selectedTrip.status === s ? 0.5 : 1 }}
                >
                  <span className={`badge ${statusConfig[s]?.class}`} style={{ fontSize: 11 }}>{statusConfig[s]?.label}</span>
                  {selectedTrip.status === s && '← الحالة الحالية'}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
