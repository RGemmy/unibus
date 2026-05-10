import React, { useState } from 'react'
import { Search, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react'
import ToastContainer from '../components/Toast'
import { useApi, useToast } from '../hooks/useApi'
import { useLanguage } from '../context/LanguageContext'
import { getReservations, cancelReservation, createReservation } from '../services/api'
import api from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const statusConfig = {
  confirmed: { label: 'مؤكدة', class: 'badge-green', icon: CheckCircle },
  pending:   { label: 'معلقة', class: 'badge-amber', icon: Clock       },
  cancelled: { label: 'ملغية', class: 'badge-red',   icon: XCircle     },
}

export default function ReservationsPage() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: reservations, loading, error, refetch } = useApi(getReservations)
  const { toasts, showToast } = useToast()

  const filtered = (reservations||[]).filter(r => {
    const matchSearch = r.student_name?.includes(search) || r.trip_place?.includes(search)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCancel = async (id) => {
    try { await cancelReservation(id); refetch(); showToast('تم إلغاء الحجز') }
    catch { showToast('فشل الإلغاء', 'error') }
  }

  const handleConfirm = async (id) => {
    try { await api.patch(`/reservations/${id}/confirm/`); refetch(); showToast('تم تأكيد الحجز') }
    catch { showToast('فشل التأكيد', 'error') }
  }

  const total = (reservations||[]).filter(r => r.status !== 'cancelled').length
  const pending = (reservations||[]).filter(r => r.status === 'pending').length

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>الحجوزات</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{(reservations||[]).length} حجز</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>مؤكدة: </span>
            <span style={{ fontWeight: 700, color: '#34d399' }}>{total - pending}</span>
          </div>
          <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 9 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>معلقة: </span>
            <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{pending}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input className="form-input" placeholder="بحث بالطالب أو الرحلة..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 38 }}/>
        </div>
        {['all','confirmed','pending','cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn" style={{ background: statusFilter===s?'var(--calm)':'var(--surface)', color: statusFilter===s?'white':'var(--text-secondary)', border: `1px solid ${statusFilter===s?'var(--calm)':'var(--border)'}`, fontFamily: 'var(--font)' }}>
            {{ all:'الكل', confirmed:'مؤكدة', pending:'معلقة', cancelled:'ملغية' }[s]}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton" style={{ height: 300, borderRadius: 14 }}/>}
      {error   && <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red-light)' }}>{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>الطالب</th><th>الرحلة</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const StatusIcon = statusConfig[r.status]?.icon
                return (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {r.student_name?.[0]||'ط'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{r.student_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.trip_place}</td>
                    <td style={{ fontSize: 13 }}>{r.trip_date}</td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{r.schedule_time}</td>
                    <td><span className={`badge ${statusConfig[r.status]?.class}`}>{StatusIcon && <StatusIcon size={14}/>} {statusConfig[r.status]?.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'pending' && (
                          <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontFamily: 'var(--font)' }} onClick={() => handleConfirm(r.id)}>
                            <CheckCircle size={16}/> تأكيد
                          </button>
                        )}
                        {r.status !== 'cancelled' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>
                            <XCircle size={16}/> إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }}/><p>لا توجد حجوزات</p>
        </div>
      )}
    </div>
  )
}
