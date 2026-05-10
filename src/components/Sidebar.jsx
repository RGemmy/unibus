import UniBusLogo from './UniBusLogo'
import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useLanguage } from '../context/LanguageContext'
import {
  LayoutDashboard, Bus, Route, Calendar, Users, BookOpen,
  CreditCard, MapPin, GraduationCap, LogOut, ChevronLeft, ChevronRight,
  Menu, Shield, User, Navigation, Settings, Eye, Wrench, Layers, DollarSign, CalendarCheck, Ban
} from 'lucide-react'

const roleColors = {
  admin:          'linear-gradient(135deg,#26658C,#54ACBF)',
  university_mod: 'linear-gradient(135deg,#1E5278,#54ACBF)',
  bus_mod:        'linear-gradient(135deg,#54ACBF,#A7EBF2)',
  student:        'linear-gradient(135deg,#26658C,#54ACBF)',
  driver:         'linear-gradient(135deg,#26658C,#54ACBF)',
}

export default function Sidebar({ isMobile = false }) {
  const { user, role, logout }    = useAuth()
  const { unreadCount }           = useNotifications()
  // Separate count for pending_confirm reservations (shown on reservations badge)
  const [pendingResCount, setPendingResCount] = React.useState(0)
  React.useEffect(() => {
    const compute = () => {
      try {
        const res = JSON.parse(localStorage.getItem('mock_reservations') || '[]')
        setPendingResCount(res.filter(r => r.status === 'pending_confirm').length)
      } catch { setPendingResCount(0) }
    }
    compute()
    const iv = setInterval(compute, 3000)
    return () => clearInterval(iv)
  }, [])
  const { t, lang }               = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const isRtl = lang === 'ar'

  const roleLabels = {
    admin:          t('role_admin'),
    university_mod: t('role_university_mod'),
    bus_mod:        t('role_bus_mod'),
    student:        t('role_student'),
    driver:         t('role_driver'),
  }

  const NAV = {
    admin: [
      { group:t('home'), items:[{ to:'/dashboard', icon:LayoutDashboard, label:t('dashboard') }] },
      { group:t('transport_mgmt'), items:[
        { to:'/trips',   icon:Calendar, label:t('trips')  },
        { to:'/routes',  icon:Route,    label:t('routes') },
        { to:'/buses',   icon:Bus,      label:t('buses')  },
        { to:'/places',  icon:MapPin,   label:t('places') },
      ]},
      { group:t('user_mgmt'), items:[
        { to:'/students',      icon:GraduationCap, label:t('students')                       },
        { to:'/reservations',  icon:BookOpen,      label:t('reservations'), badge:true        },
        { to:'/subscriptions', icon:Shield,        label:t('subscriptions')                  },
        { to:'/drivers',       icon:User,          label:t('drivers')                        },
      ]},
      { group:t('finance'), items:[{ to:'/payments', icon:CreditCard, label:t('payments') }] },
      { group:t('system'),  items:[
        { to:'/users',        icon:Users,         label:t('users')        },
        { to:'/universities', icon:GraduationCap, label:t('universities') },
      ]},
    ],
    university_mod: [
      { group:t('home'), items:[{ to:'/uni-mod', icon:LayoutDashboard, label:t('dashboard') }] },
      { group:t('transport_mgmt'), items:[
        { to:'/uni-mod/trips',   icon:Calendar,      label:t('trips')   },
        { to:'/uni-mod/routes',  icon:Route,         label:t('routes')  },
        { to:'/uni-mod/buses',   icon:Bus,           label:t('buses')   },
        { to:'/uni-mod/drivers', icon:User,          label:t('drivers') },
      ]},
      { group:t('user_mgmt'), items:[
        { to:'/uni-mod/students', icon:GraduationCap, label:t('students') },
        { to:'/uni-mod/users',    icon:Users,         label:t('users')    },
      ]},
    ],
    bus_mod: [
      { group:t('home'), items:[{ to:'/bus-mod', icon:LayoutDashboard, label:t('dashboard') }] },
      { group:t('transport_mgmt'), items:[
        { to:'/bus-mod/buses',   icon:Bus,         label:t('buses')   },
        { to:'/bus-mod/trips',   icon:Calendar,    label:t('trips')   },
        { to:'/bus-mod/routes',  icon:Route,       label:t('routes')  },
        { to:'/bus-mod/places',  icon:MapPin,      label:t('places')  },
        { to:'/bus-mod/drivers', icon:User,        label:t('drivers') },
        { to:'/bus-mod/layout',  icon:Layers,      label:lang==='ar'?'ترتيب المقاعد':'Seat Layout' },
        { to:'/bus-mod/plans',   icon:DollarSign,  label:lang==='ar'?'باقات الاشتراك':'Sub Plans'  },
      ]},
      { group:t('user_mgmt'), items:[
        { to:'/bus-mod/reservations', icon:BookOpen,  label:t('reservations'), badge:'pending' },
      ]},
      { group:t('finance'), items:[
        { to:'/bus-mod/payments', icon:CreditCard, label:t('payments') },
        { to:'/bus-mod/waitlist',   icon:Users, label:lang==='ar'?'قائمة الانتظار':'No-Show List', badge:'waitlist' },
        { to:'/bus-mod/blacklist',  icon:Ban,   label:lang==='ar'?'قائمة الحظر':'Blacklist',      badge:'blacklist' },
      ]},
    ],
    student: [
      { group:t('home'), items:[{ to:'/student', icon:LayoutDashboard, label:t('home') }] },
      { group:t('my_trips'), items:[
        { to:'/student/trips',           icon:Bus,        label:t('available_trips') },
        { to:'/student/my-reservations', icon:BookOpen,   label:t('my_reservations') },
        { to:'/student/track',           icon:Navigation, label:t('track_bus')       },
      ]},
      { group:t('my_account'), items:[{ to:'/student/subscription', icon:Shield, label:t('my_subscription') }] },
    ],
    driver: [
      { group:t('home'), items:[{ to:'/driver', icon:LayoutDashboard, label:t('home') }] },
      { group:t('my_trips'), items:[
        { to:'/driver/trips',       icon:Calendar,      label:t('trips')       },
        { to:'/driver/month-trips', icon:CalendarCheck, label:lang==='ar'?'رحلات الشهر':'Monthly Trips' },
        { to:'/driver/active',      icon:Navigation,    label:t('active_trip') },
      ]},
    ],
  }

  const navGroups = NAV[role] || []
  const allItems  = navGroups.flatMap(g => g.items)
  const CollapseIcon = isRtl ? ChevronRight : ChevronLeft

  function NavItem({ to, icon:Icon, label, badge }) {
    // For reservations badge: show pending_confirm count; for others: unreadCount
    // waitlist badge: count no_show entries pending resolution
    const waitlistCount = React.useMemo(() => {
      try {
        const res = JSON.parse(localStorage.getItem('mock_reservations') || '[]')
        return res.filter(r => r.status === 'no_show' && (!r.waitlist_resolution || r.waitlist_resolution === 'pending')).length
      } catch { return 0 }
    }, [])
    const blacklistCount = React.useMemo(() => {
      try {
        const strikes = JSON.parse(localStorage.getItem('cash_no_show_strikes') || '{}')
        return Object.values(strikes).filter(s => s.count >= 3).length
      } catch { return 0 }
    }, [])
    const badgeNum = badge === 'pending' ? pendingResCount : badge === 'waitlist' ? waitlistCount : badge === 'blacklist' ? blacklistCount : (badge === true ? unreadCount : 0)
    return (
      <NavLink to={to} style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:12,
        padding:'11px 16px', borderRadius:9, textDecoration:'none',
        color:      isActive ? 'white' : 'var(--text-secondary)',
        background: isActive ? 'var(--calm)' : 'transparent',
        fontWeight: isActive ? 600 : 400, fontSize:15, transition:'all 0.18s',
      })}>
        {({ isActive }) => (
          <>
            <Icon size={20} style={{ flexShrink:0 }}/>
            <span style={{ flex:1 }}>{label}</span>
            {badgeNum > 0 && (
              <span style={{ fontSize:11, fontWeight:700, background: isActive ? 'rgba(255,255,255,0.3)' : 'var(--amber)', color: isActive ? 'white' : 'var(--navy)', borderRadius:20, padding:'2px 6px', display: isActive ? 'none' : 'inline' }}>
                {badgeNum>9?'9+':badgeNum}
              </span>
            )}
          </>
        )}
      </NavLink>
    )
  }

  // Role badge color for sidebar icon
  const modIcon = role==='university_mod' ? <Eye size={16}/> : role==='bus_mod' ? <Wrench size={16}/> : null

  // ── Mobile: bottom tab bar with full drawer ──────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    // لو allItems + settings ≤ 6 → كل حاجة في البار، مفيش hamburger ولا drawer
    // لو أكتر → أول 4 في البار، الباقي + settings في الـ drawer + hamburger
    const MAX_TOTAL    = 6
    const settingsItem = { to:'/settings', icon:Settings, label:t('settings') }
    const totalNeeded  = allItems.length + 1  // +1 للـ settings
    const fitsAll      = totalNeeded <= MAX_TOTAL
    // لو بيتناسب كله → كل حاجة في البار
    // لو مش بيتناسب → 5 items في البار + hamburger (مش 4)
    const primaryItems = fitsAll ? allItems : allItems.slice(0, 5)
    const extraItems   = fitsAll ? []       : allItems.slice(5)
    const hasDrawer    = !fitsAll

    return (
      <>
        {/* ── Drawer overlay ── */}
        {hasDrawer && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:198, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)' }}
          />
        )}

        {/* ── Slide-up drawer — بس لو في items زيادة ── */}
        {hasDrawer && (
          <div style={{
            position:'fixed', bottom: drawerOpen ? 62 : -400, left:0, right:0, zIndex:199,
            background:'var(--navy-2)', borderTop:'1px solid var(--border)',
            borderRadius:'18px 18px 0 0',
            padding:'14px 12px 8px',
            transition:'bottom 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:'0 -8px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)', margin:'0 auto 14px' }}/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {/* extra items + الإعدادات آخر حاجة في الـ drawer */}
              {[...extraItems, { to:'/settings', icon:Settings, label:t('settings') }].map(({ to, icon:Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setDrawerOpen(false)}
                  style={({ isActive }) => ({
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap:5, textDecoration:'none', padding:'12px 4px', borderRadius:10,
                    color: isActive ? 'white' : 'var(--text-muted)',
                    background: isActive ? 'var(--calm)' : 'var(--surface)',
                    border: isActive ? 'none' : '1px solid var(--border)',
                    fontSize:10, fontWeight: isActive ? 700 : 400, transition:'all 0.18s',
                  })}>
                  {({ isActive }) => (
                    <>
                      <Icon size={20} style={{ strokeWidth: isActive ? 2.2 : 1.8 }}/>
                      <span style={{ fontSize:9, lineHeight:1, textAlign:'center', maxWidth:64, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom bar ── */}
        <nav style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:200,
          background:'var(--navy-2)', borderTop:'1px solid var(--border)',
          display:'flex', alignItems:'stretch',
          height:62, paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {/* Nav items */}
          {primaryItems.map(({ to, icon:Icon, label, badge }) => {
            const badgeNum = badge === 'pending' ? pendingResCount : badge === true ? unreadCount : 0
            return (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', gap:3, textDecoration:'none', position:'relative',
                color: isActive ? 'var(--calm)' : 'var(--text-muted)',
                fontSize:10, fontWeight: isActive ? 700 : 400,
                borderTop: isActive ? '2px solid var(--calm)' : '2px solid transparent',
                transition:'all 0.18s', padding:'4px 2px 0',
              })}>
                {({ isActive }) => (
                  <>
                    <Icon size={22} style={{ strokeWidth: isActive ? 2.2 : 1.8 }}/>
                    <span style={{ fontSize:9, lineHeight:1, textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {label}
                    </span>
                    {badgeNum > 0 && (
                      <span style={{ position:'absolute', top:4, insetInlineEnd:6, fontSize:9, fontWeight:700, background:'var(--amber)', color:'var(--navy)', borderRadius:20, padding:'1px 4px', lineHeight:1.4 }}>
                        {badgeNum > 9 ? '9+' : badgeNum}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}

          {/* الإعدادات — تظهر في الـ bar بس لو مفيش drawer */}
          {!hasDrawer && (
            <NavLink to="/settings" style={({ isActive }) => ({
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:3, textDecoration:'none',
              color: isActive ? 'var(--calm)' : 'var(--text-muted)',
              fontSize:10, fontWeight: isActive ? 700 : 400,
              borderTop: isActive ? '2px solid var(--calm)' : '2px solid transparent',
              transition:'all 0.18s', padding:'4px 2px 0',
            })}>
              {({ isActive }) => (
                <>
                  <Settings size={22} style={{ strokeWidth: isActive ? 2.2 : 1.8 }}/>
                  <span style={{ fontSize:9 }}>{t('settings')}</span>
                </>
              )}
            </NavLink>
          )}

          {/* Hamburger — بس لو في items زيادة */}
          {hasDrawer && (
            <button onClick={() => setDrawerOpen(o => !o)}
              style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', gap:3, background:'none', border:'none',
                color: drawerOpen ? 'var(--calm)' : 'var(--text-muted)',
                fontSize:10, fontWeight: drawerOpen ? 700 : 400, cursor:'pointer',
                borderTop: drawerOpen ? '2px solid var(--calm)' : '2px solid transparent',
                padding:'4px 2px 0', transition:'all 0.18s',
              }}>
              <Menu size={22} style={{ strokeWidth: drawerOpen ? 2.2 : 1.8 }}/>
              <span style={{ fontSize:9 }}>{lang==='ar' ? 'المزيد' : 'More'}</span>
            </button>
          )}
        </nav>
      </>
    )
  }

  return (
    <aside style={{ width:collapsed?60:230, flexShrink:0, background:'var(--navy-2)', borderRight:isRtl?'none':'1px solid var(--border)', borderLeft:isRtl?'1px solid var(--border)':'none', display:'flex', flexDirection:'column', transition:'width 0.25s ease', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ padding:'20px 14px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        {!collapsed ? (
          <>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <UniBusLogo size={52} color="auto" />
              <div style={{ fontSize:9, color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.02em' }}>
                {lang==='ar'?'نظام النقل الجامعي':'University Transport'}
              </div>
            </div>
            <button onClick={()=>setCollapsed(true)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:6 }}>
              <CollapseIcon size={16}/>
            </button>
          </>
        ) : (
          <button onClick={()=>setCollapsed(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <UniBusLogo size={36} color="auto" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'12px 10px', display:'flex', flexDirection:'column', gap:4 }}>
        {!collapsed
          ? navGroups.map(group=>(
              <div key={group.group} style={{ marginBottom:8 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', padding:'6px 14px', letterSpacing:'0.1em', textTransform:'uppercase' }}>{group.group}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {group.items.map(item=><NavItem key={item.to} {...item}/>)}
                </div>
              </div>
            ))
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
              {allItems.map(({ to, icon:Icon })=>(
                <NavLink key={to} to={to} style={({ isActive })=>({ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:isActive?'white':'var(--text-muted)', background:isActive?'var(--calm)':'transparent', transition:'all 0.18s' })}>
                  <Icon size={20}/>
                </NavLink>
              ))}
            </div>
          )
        }
      </nav>

      {/* Settings */}
      {!collapsed ? (
        <div style={{ padding:'0 10px 6px' }}>
          <NavLink to="/settings" style={({ isActive })=>({ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:9, textDecoration:'none', color:isActive?'white':'var(--text-muted)', background:isActive?'rgba(38,101,140,0.30)':'transparent', fontSize:15, transition:'all 0.18s' })}>
            <Settings size={18}/> {t('settings')}
          </NavLink>
        </div>
      ) : (
        <div style={{ display:'flex', justifyContent:'center', padding:'0 0 6px' }}>
          <NavLink to="/settings" style={({ isActive })=>({ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:isActive?'white':'var(--text-muted)', background:isActive?'var(--calm)':'transparent' })}>
            <Settings size={18}/>
          </NavLink>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
        {!collapsed ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:10, background:'var(--surface)' }}>
            <NavLink to="/profile" style={{ display:'flex', alignItems:'center', gap:10, flex:1, textDecoration:'none' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:roleColors[role]||roleColors.admin, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:18, fontWeight:700, color:'white' }}>{user?.user_name?.[0]||'م'}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.user_name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                  {modIcon}{roleLabels[role]||role}
                </div>
              </div>
            </NavLink>
            <button onClick={logout} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:6 }} title={t('logout')}>
              <LogOut size={19}/>
            </button>
          </div>
        ) : (
          <button onClick={logout} style={{ width:40, height:40, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', borderRadius:10 }}>
            <LogOut size={26}/>
          </button>
        )}
      </div>
    </aside>
  )
}
