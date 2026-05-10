import React, { useState, useEffect } from 'react'
import { Ban, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getAllCashStrikes, resetCashStrikes } from '../../services/api'

// ── Strike Badge dots ─────────────────────────────────────────────────────────
function StrikeDots({ count, blocked }) {
  return (
    <div style={{ display:'flex', gap:5 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 26, height: 26, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800,
          background: count >= n
            ? (blocked ? 'rgba(239,68,68,0.85)' : 'rgba(245,158,11,0.8)')
            : 'rgba(255,255,255,0.06)',
          color: count >= n ? 'white' : 'var(--text-muted)',
          border: `1px solid ${count >= n ? (blocked ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)') : 'var(--border)'}`,
        }}>
          {n}
        </div>
      ))}
    </div>
  )
}

// ── Entry Card — matches WaitlistCard style ───────────────────────────────────
function BlacklistCard({ entry, lang, onReset }) {
  const [expanded, setExpanded] = useState(false)
  const isBlocked = entry.blocked

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
      borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Main row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: isBlocked ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20,
        }}>
          {isBlocked ? '🚫' : '⚠️'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
            {entry.student_name || entry.userId}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <StrikeDots count={entry.count} blocked={isBlocked}/>
            <span style={{ color: isBlocked ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
              {entry.count}/3 {lang === 'ar' ? 'مخالفات' : 'violations'}
            </span>
            {entry.history?.length > 0 && (
              <span>📅 {lang === 'ar' ? 'آخر مخالفة:' : 'Last:'} {entry.history[entry.history.length - 1]?.tripDate}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isBlocked
            ? <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ban size={11}/> {lang === 'ar' ? 'محظور' : 'Blocked'}
              </span>
            : <span className="badge badge-amber">
                {lang === 'ar' ? `تحذير (${entry.count}/3)` : `Warning (${entry.count}/3)`}
              </span>
          }
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'var(--surface-hover,rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {/* Violation history */}
          {entry.history?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {lang === 'ar' ? 'سجل المخالفات:' : 'Violation History:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entry.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#f87171', minWidth: 20 }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{h.tripPlace || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.tripDate || '—'}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {h.at ? new Date(h.at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB') : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status description */}
          {isBlocked ? (
            <div style={{ fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ban size={14}/>
              {lang === 'ar'
                ? 'هذا الطالب لا يستطيع اختيار الكاش عند الدفع — InstaPay فقط'
                : 'This student cannot select cash at checkout — InstaPay only'}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <AlertTriangle size={14}/>
              {lang === 'ar'
                ? `${3 - entry.count} مخالفة أخرى وسيتم حظره من الكاش نهائياً`
                : `${3 - entry.count} more violation(s) and cash will be permanently blocked`}
            </div>
          )}

          {/* Unblock button */}
          <button
            onClick={() => onReset(entry.userId, entry.student_name)}
            className="btn btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontWeight: 700 }}
          >
            <RefreshCw size={13}/>
            {lang === 'ar' ? 'إعادة تعيين المخالفات' : 'Reset Violations'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CashBlacklistPage() {
  const isMobile = useIsMobile()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all') // 'all' | 'blocked' | 'warning'

  function loadEntries() {
    setLoading(true)
    try {
      setEntries(getAllCashStrikes().sort((a, b) => b.count - a.count))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEntries() }, [])

  function handleReset(userId, studentName) {
    if (!window.confirm(
      lang === 'ar'
        ? `إعادة تعيين مخالفات الطالب "${studentName}"؟`
        : `Reset violations for "${studentName}"?`
    )) return
    resetCashStrikes(userId)
    loadEntries()
  }

  const blockedCount = entries.filter(e => e.blocked).length
  const warningCount = entries.filter(e => !e.blocked).length
  const totalStrikes = entries.reduce((sum, e) => sum + e.count, 0)

  const filtered = entries.filter(e => {
    if (filter === 'blocked') return e.blocked
    if (filter === 'warning') return !e.blocked
    return true
  })

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ban size={24} color="var(--calm)"/>
            {lang === 'ar' ? 'قائمة الحظر' : 'Blacklist'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            {lang === 'ar'
              ? 'طلاب حجزوا بكاش ولم يركبوا — بعد 3 مخالفات يُحظر عليهم الدفع بالكاش'
              : 'Students who booked with cash and didn\'t board — blocked after 3 violations'}
          </p>
        </div>

      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: lang === 'ar' ? 'محظورون' : 'Blocked',      value: blockedCount,  color: '#f87171', bg: 'rgba(239,68,68,0.1)',   icon: '🚫' },
          { label: lang === 'ar' ? 'تحذيرات' : 'Warnings',     value: warningCount,  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  icon: '⚠️' },
          { label: lang === 'ar' ? 'إجمالي الطلاب' : 'Total Students', value: entries.length, color: '#54ACBF', bg: 'rgba(84,172,191,0.1)', icon: '👤' },
          { label: lang === 'ar' ? 'إجمالي المخالفات' : 'Total Violations', value: totalStrikes, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '📋' },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderRadius: 12, padding: '14px 16px', borderColor: `${s.color}44` }}>
            <div style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, color: s.color }}>{s.icon} {s.value}</div>
            <div style={{ fontSize: isMobile ? 13 : 16, color: 'var(--text-muted)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert if blocked students exist */}
      {blockedCount > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: 14, fontWeight: 600, color: '#f87171' }}>
          <Ban size={18}/>
          {lang === 'ar'
            ? `${blockedCount} ${blockedCount === 1 ? 'طالب محظور' : 'طلاب محظورون'} من الدفع بالكاش`
            : `${blockedCount} student(s) blocked from cash payment`}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { k: 'all',     l: lang === 'ar' ? 'الكل' : 'All' },
          { k: 'blocked', l: lang === 'ar' ? '🚫 محظورون' : '🚫 Blocked' },
          { k: 'warning', l: lang === 'ar' ? '⚠️ تحذيرات' : '⚠️ Warnings' },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            style={{
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${filter === f.k ? 'var(--calm)' : 'var(--border)'}`,
              background: filter === f.k ? 'rgba(84,172,191,0.15)' : 'var(--surface)',
              color: filter === f.k ? 'var(--calm)' : 'var(--text-secondary)',
              fontSize: 15, fontWeight: filter === f.k ? 700 : 400,
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {lang === 'ar' ? 'لا يوجد طلاب في قائمة الحظر' : 'No students in the blacklist'}
          </div>
          <div style={{ fontSize: 16, marginTop: 6 }}>
            {lang === 'ar' ? 'كل الطلاب ملتزمون بالحضور' : 'All students are compliant'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(entry => (
            <BlacklistCard
              key={entry.userId}
              entry={entry}
              lang={lang}
              onReset={handleReset}
            />
          ))}
        </div>
      )}
    </div>
  )
}
