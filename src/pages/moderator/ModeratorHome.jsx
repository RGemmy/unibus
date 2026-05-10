import React from 'react'
import { Link } from 'react-router-dom'
import { Bus, Users, Calendar, BookOpen, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { getTrips, getReservations, getStudents } from '../../services/api'
import StatCard from '../../components/StatCard'
import { useIsMobile } from '../../hooks/useIsMobile'

const statusConfig = {
  active:    { label: 'نشطة',         class: 'badge-green' },
  completed: { label: 'مكتملة',       class: 'badge-blue'  },
  pending:   { label: 'قيد الانتظار', class: 'badge-amber' },
  cancelled: { label: 'ملغية',        class: 'badge-red'   },
  confirmed: { label: 'مؤكدة',        class: 'badge-green' },
}

export default function ModeratorHome() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { data: trips,   loading: tl } = useApi(() => getTrips({ page_size: 5 }))
  const { data: reservs, loading: rl } = useApi(() => getReservations({ page_size: 4 }))
  const { data: students } = useApi(getStudents)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'

  const activeTrips   = (trips   || []).filter(t => t.status === 'active').length
  const pendingRes    = (reservs  || []).filter(r => r.status === 'pending').length

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{greeting}، {user?.user_name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Calendar} label="رحلات نشطة"    value={activeTrips}             color="blue"  loading={tl} />
        <StatCard icon={BookOpen} label="حجوزات معلقة"  value={pendingRes}  color="amber" loading={rl} />
        <StatCard icon={Users}    label="الطلاب المسجلين" value={(students||[]).length} color="teal"  loading={false} />
        <StatCard icon={Bus}      label="إجمالي الرحلات" value={(trips||[]).length}     color="green" loading={tl} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 20 }}>
        {/* Recent trips */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>آخر الرحلات</h3>
            <Link to="/mod/trips" style={{ fontSize: 12, color: 'var(--matcha)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              عرض الكل <ArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
          {tl ? Array(3).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 9, marginBottom: 8 }}/>)
            : (trips||[]).slice(0, 4).map(trip => (
              <div key={trip.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 8 }}>
                <Bus size={20} color="var(--matcha)" style={{ flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.place_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.schedule_time} · {trip.trip_date}</div>
                </div>
                <span className={`badge ${statusConfig[trip.status]?.class}`} style={{ fontSize: 10 }}>{statusConfig[trip.status]?.label}</span>
              </div>
            ))
          }
        </div>

        {/* Pending reservations */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>الحجوزات المعلقة</h3>
            <Link to="/mod/reservations" style={{ fontSize: 12, color: 'var(--matcha)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              عرض الكل <ArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
          {rl ? Array(3).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 9, marginBottom: 8 }}/>)
            : (reservs||[]).filter(r => r.status === 'pending').slice(0, 4).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, var(--calm), var(--early))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {r.student_name?.[0] || 'ط'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.student_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.trip_place}</div>
                </div>
                <span className="badge badge-amber" style={{ fontSize: 10 }}>معلقة</span>
              </div>
            ))
          }
          {!rl && (reservs||[]).filter(r => r.status === 'pending').length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>لا توجد حجوزات معلقة ✅</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>إجراءات سريعة</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/mod/trips"        className="btn btn-primary"   style={{ textDecoration: 'none' }}><Calendar size={17}/> إدارة الرحلات</Link>
          <Link to="/mod/reservations" className="btn btn-secondary" style={{ textDecoration: 'none' }}><BookOpen size={17}/> مراجعة الحجوزات</Link>
          <Link to="/mod/students"     className="btn btn-secondary" style={{ textDecoration: 'none' }}><Users size={17}/> عرض الطلاب</Link>
          <Link to="/mod/buses"        className="btn btn-secondary" style={{ textDecoration: 'none' }}><Bus size={17}/> الباصات</Link>
        </div>
      </div>
    </div>
  )
}
