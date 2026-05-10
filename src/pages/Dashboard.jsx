import React from 'react'
import { Link } from 'react-router-dom'
import { Bus, Users, Calendar, CreditCard, CheckCircle, AlertCircle, TrendingUp, Clock, ArrowLeft } from 'lucide-react'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useApi } from '../hooks/useApi'
import { useIsMobile } from '../hooks/useIsMobile'
import { getDashboardStats, getTrips, getReservations } from '../services/api'

const statusConfig = {
  active:    { label: 'نشطة',         class: 'badge-green' },
  completed: { label: 'مكتملة',       class: 'badge-blue'  },
  pending:   { label: 'قيد الانتظار', class: 'badge-amber' },
  cancelled: { label: 'ملغية',        class: 'badge-red'   },
  confirmed: { label: 'مؤكدة',        class: 'badge-green' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const isMobile = useIsMobile()
  const { data: stats,   loading: sl } = useApi(getDashboardStats)
  const { data: trips,   loading: tl } = useApi(() => getTrips({ page_size: 4 }))
  const { data: reservs, loading: rl } = useApi(() => getReservations({ page_size: 4 }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening')

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{greeting}، {user?.user_name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString(lang==='ar'?'ar-SA':'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Calendar}    label={t('total_trips')}  value={stats?.total_trips}          trend={8}  color="blue"  loading={sl} />
        <StatCard icon={Users}       label={t('total_students')} value={stats?.total_students}        trend={12} color="teal"  loading={sl} />
        <StatCard icon={Bus}         label={t('total_buses')}  value={stats?.total_buses}                      color="amber" loading={sl} />
        <StatCard icon={CreditCard}  label={t('monthly_revenue')}   value={stats?.revenue_month ? `${Number(stats.revenue_month).toLocaleString('ar-SA')} ر.س` : '--'} trend={5} color="green" loading={sl} />
        <StatCard icon={CheckCircle} label={t('active_reservations')}     value={stats?.active_reservations}  trend={3}  color="blue"  loading={sl} />
        <StatCard icon={AlertCircle} label={t('pending_payments')}   value={stats?.pending_payments}                color="red"   loading={sl} />
        <StatCard icon={TrendingUp}  label={t('active_subscriptions')}  value={stats?.active_subscriptions} trend={15} color="teal"  loading={sl} />
        <StatCard icon={Clock}       label={t('today_trips')}      value={stats?.today_trips}                     color="amber" loading={sl} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t('recent_trips')}</h3>
            <Link to="/trips" style={{ fontSize: 12, color: 'var(--matcha)', textDecoration: 'none', fontWeight: 600 }}>{lang==='ar'?'عرض الكل':'View All'}</Link>
          </div>
          {tl ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10, marginBottom: 8 }} />)
             : (trips || []).slice(0, 4).map(trip => (
              <div key={trip.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: 'rgba(38,101,140,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={20} color="var(--matcha)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.place_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{trip.bus_plate} · {lang==='ar'?'متاح:':'Available:'} {trip.available_seats}</div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{trip.schedule_time}</div>
                  <span className={`badge ${statusConfig[trip.status]?.class}`} style={{ fontSize: 10, padding: '2px 7px' }}>{statusConfig[trip.status]?.label}</span>
                </div>
              </div>
            ))}
          {!tl && !trips?.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>لا توجد رحلات</p>}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t('recent_reservations')}</h3>
            <Link to="/reservations" style={{ fontSize: 12, color: 'var(--matcha)', textDecoration: 'none', fontWeight: 600 }}>{lang==='ar'?'عرض الكل':'View All'}</Link>
          </div>
          {rl ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10, marginBottom: 8 }} />)
             : (reservs || []).slice(0, 4).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'rgba(38,101,140,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {r.student_name?.[0] || 'ط'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.student_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.trip_place}</div>
                </div>
                <span className={`badge ${statusConfig[r.status]?.class}`} style={{ fontSize: 10, padding: '2px 7px', flexShrink: 0 }}>{statusConfig[r.status]?.label}</span>
              </div>
            ))}
          {!rl && !reservs?.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>لا توجد حجوزات</p>}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>إجراءات سريعة</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/trips"    className="btn btn-primary"><Calendar size={18}/> إضافة رحلة</Link>
          <Link to="/buses"    className="btn btn-secondary"><Bus size={18}/> تسجيل باص</Link>
          <Link to="/students" className="btn btn-secondary"><Users size={18}/> إضافة طالب</Link>
          <Link to="/payments" className="btn btn-secondary"><CreditCard size={18}/> المدفوعات</Link>
        </div>
      </div>
    </div>
  )
}
