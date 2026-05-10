import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function EmptyState({ icon: Icon, message, size = 48 }) {
  const { t } = useLanguage()
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
      {Icon && <Icon size={size} style={{ opacity:0.25, marginBottom:14 }}/>}
      <p style={{ fontSize:18, fontWeight:500 }}>{message || t('no_data')}</p>
    </div>
  )
}
