import React, { useEffect, useState } from 'react'
import UniBusLogo from './UniBusLogo'

/**
 * SplashScreen — يظهر شعار ونبذة المشروع لمدة 5 ثواني ثم يختفي
 */
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'),  4_000)
    const t3 = setTimeout(() => onDone(),          5_000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D1B2A 0%, #1A3D54 40%, #1E5278 70%, #26658C 100%)',
      opacity:    phase === 'out' ? 0 : 1,
      transition: phase === 'in' ? 'opacity 0.6s ease' : phase === 'out' ? 'opacity 1s ease' : 'none',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>

      {/* Decorative circles */}
      <div style={{
        position:'absolute', width:500, height:500, borderRadius:'50%',
        background:'rgba(255,255,255,0.03)', top:-120, right:-120,
      }}/>
      <div style={{
        position:'absolute', width:350, height:350, borderRadius:'50%',
        background:'rgba(255,255,255,0.04)', bottom:-80, left:-80,
      }}/>

      {/* Content */}
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:28,
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'translateY(20px)' : 'translateY(0)',
        transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
      }}>

        {/* Real UniBus Logo — always white (background is always dark) */}
        <UniBusLogo size={180} color="white" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))' }} />

        {/* Project description */}
        <div style={{ textAlign:'center', marginTop: -8 }}>
          <div style={{
            fontSize:18, color:'rgba(255,255,255,0.75)', marginTop:10,
            fontFamily:"'Cairo', sans-serif",
            letterSpacing:'0.3px',
          }}>
            نظام إدارة نقل الطلاب الجامعيين
          </div>
          <div style={{
            fontSize:14, color:'rgba(255,255,255,0.5)', marginTop:6,
            fontFamily:"'Cairo', sans-serif",
          }}>
            University Student Transportation Management
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width:80, height:2,
          background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          borderRadius:2,
        }}/>

        {/* Tagline */}
        <div style={{
          fontSize:15, color:'rgba(255,255,255,0.55)',
          fontFamily:"'Cairo', sans-serif",
          textAlign:'center', maxWidth:300,
          lineHeight:1.6,
        }}>
          رحلة آمنة، وصول مضمون
        </div>

        {/* Loading dots */}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width:8, height:8, borderRadius:'50%',
              background:'rgba(255,255,255,0.6)',
              animation:`splashDot 1.4s ${i * 0.22}s ease-in-out infinite`,
            }}/>
          ))}
        </div>
      </div>

      {/* Version tag */}
      <div style={{
        position:'absolute', bottom:24, right:28,
        fontSize:12, color:'rgba(255,255,255,0.3)',
        fontFamily:"'Cairo', sans-serif",
      }}>
        v3.0
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
