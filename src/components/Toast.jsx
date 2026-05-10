import React from 'react'
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
}

const colors = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', icon: '#34d399' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  icon: 'var(--red-light)' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: 'var(--amber)' },
  info:    { bg: 'rgba(114,138,110,0.12)', border: 'rgba(30,107,212,0.35)', icon: 'var(--matcha)' },
}

export default function ToastContainer({ toasts }) {
  if (!toasts?.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map(t => {
        const Icon = icons[t.type] || CheckCircle
        const c = colors[t.type] || colors.success
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10, minWidth: 240, maxWidth: 340,
            background: c.bg, border: `1px solid ${c.border}`,
            backdropFilter: 'blur(12px)',
            animation: 'fadeUp 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <Icon size={20} color={c.icon} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
