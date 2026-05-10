import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const key = (userId) => `notifications_${userId}`
function loadNotifs(userId) {
  try { return JSON.parse(localStorage.getItem(key(userId))) || [] } catch { return [] }
}
function saveNotifs(userId, list) {
  localStorage.setItem(key(userId), JSON.stringify(list))
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return }
    const stored = loadNotifs(user.id).filter(n => n.id > 1000000)
    if (stored.length === 0) {
      const welcome = {
        id: Date.now(),
        // Store both languages so display can switch
        message_ar: `مرحباً بك يا ${user.user_name} 👋`,
        message_en: `Welcome, ${user.user_name} 👋`,
        // Legacy fallback
        message: `مرحباً بك يا ${user.user_name} 👋`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      }
      const initial = [welcome]
      saveNotifs(user.id, initial)
      setNotifications(initial)
      setUnreadCount(1)
    } else {
      saveNotifs(user.id, stored)
      setNotifications(stored)
      setUnreadCount(stored.filter(n => !n.is_read).length)
    }
  }, [user?.id])

  const markAllRead = () => {
    if (!user) return
    const updated = notifications.map(n => ({ ...n, is_read: true }))
    setNotifications(updated); setUnreadCount(0); saveNotifs(user.id, updated)
  }

  /**
   * addLocalNotification
   * @param {string} msgAr       - Arabic message (or single message if msgEn omitted)
   * @param {string} type        - 'info' | 'success' | 'error' | 'warning'
   * @param {string|null} targetUserId - send to another user's storage (moderators etc.)
   * @param {string} msgEn       - English message (optional)
   */
  const addLocalNotification = useCallback((msgAr, type = 'info', targetUserId = null, msgEn = null) => {
    const uid = targetUserId || user?.id
    if (!uid) return
    const n = {
      id:         Date.now(),
      message_ar: msgAr,
      message_en: msgEn || msgAr,   // fallback to same text if no English provided
      message:    msgAr,            // legacy fallback
      type,
      is_read:    false,
      created_at: new Date().toISOString()
    }
    if (uid === user?.id) {
      setNotifications(prev => {
        const updated = [n, ...prev.slice(0, 19)]
        saveNotifs(uid, updated)
        return updated
      })
      setUnreadCount(c => c + 1)
    } else {
      const existing = loadNotifs(uid)
      saveNotifs(uid, [n, ...existing.slice(0, 19)])
    }
  }, [user?.id])

  const clearNotifications = useCallback(() => {
    if (!user) return
    localStorage.removeItem(key(user.id))
    setNotifications([]); setUnreadCount(0)
  }, [user?.id])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, addLocalNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
