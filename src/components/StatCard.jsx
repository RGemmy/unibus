import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, sub, trend, color = 'blue', loading }) {
  const colors = {
    blue:  { bg: 'rgba(84,172,191,0.12)', border: 'rgba(84,172,191,0.25)',  icon: 'var(--blue-light)',  glow: 'rgba(84,172,191,0.12)' },
    amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)',   icon: 'var(--amber)',       glow: 'rgba(245,158,11,0.10)' },
    green: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)',   icon: '#34d399',            glow: 'rgba(16,185,129,0.10)' },
    teal:  { bg: 'rgba(84,172,191,0.12)', border: 'rgba(84,172,191,0.25)',  icon: 'var(--blue-light)',  glow: 'rgba(84,172,191,0.10)' },
    red:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)',    icon: '#f87171',            glow: 'rgba(239,68,68,0.10)'  },
  }
  const c = colors[color] || colors.blue

  // Detect if icon is a string (emoji) or a React component
  const isEmoji = typeof Icon === 'string'

  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 10, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 28, width: '40%' }} />
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: c.glow, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        {/* Icon box — handles both emoji string and lucide component */}
        <div style={{ width: 42, height: 42, borderRadius: 11, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isEmoji
            ? <span style={{ fontSize: 20, lineHeight: 1 }}>{Icon}</span>
            : Icon && <Icon size={24} color={c.icon} />
          }
        </div>

        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: trend > 0 ? '#34d399' : trend < 0 ? 'var(--red-light)' : 'var(--text-muted)' }}>
            {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
