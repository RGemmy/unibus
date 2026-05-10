import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return String(h)
}
export function getDemoDB() {
  try { return JSON.parse(localStorage.getItem('demoDB')) || {} } catch { return {} }
}
export function saveDemoDB(db) { localStorage.setItem('demoDB', JSON.stringify(db)) }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const doLogin = (userObj) => {
    localStorage.setItem('token', 'demo-token')
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
  }

  const login = (email, password) => {
    const db     = getDemoDB()
    const record = db[email.toLowerCase().trim()]
    if (!record)                                      return { ok:false, error:'email' }
    if (simpleHash(password) !== record.passwordHash) return { ok:false, error:'password' }
    doLogin(record.user)
    return { ok:true, user:record.user }
  }

  const register = (name, email, password, role) => {
    const db  = getDemoDB()
    const key = email.toLowerCase().trim()
    if (db[key]) return { ok:false, error:'exists' }
    const newUser = { id:Date.now(), user_name:name, email:key, role, phone:'', national_id:'' }
    db[key] = { passwordHash: simpleHash(password), user: newUser }
    saveDemoDB(db)
    doLogin(newUser)
    return { ok:true, user:newUser }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const role             = user?.role || ''
  const isAdmin          = role === 'admin'
  const isUniversityMod  = role === 'university_mod'
  const isBusMod         = role === 'bus_mod'
  const isMod            = isUniversityMod || isBusMod
  const isStudent        = role === 'student'
  const isDriver         = role === 'driver'
  const isAdminOrMod     = isAdmin || isMod

  return (
    <AuthContext.Provider value={{ user, login, register, logout, role, isAdmin, isMod, isUniversityMod, isBusMod, isStudent, isDriver, isAdminOrMod }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
