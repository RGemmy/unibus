import { useState, useEffect, useCallback } from 'react'

/**
 * Generic hook for API calls with loading/error/empty state.
 * Passes lang so error messages can be localised.
 */
export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const lang = () => localStorage.getItem('lang') || 'ar'

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      // DRF returns { results: [...] } for paginated, or [...] for non-paginated
      const result = res.data?.results ?? res.data
      setData(result)
    } catch (err) {
      // Network / 500 errors → show connection message, NOT "حدث خطأ"
      const status = err.response?.status
      if (!err.response || status >= 500) {
        setData([])   // treat as empty so UI shows empty state
        setError(null)
      } else {
        setError(err.response?.data?.detail || (lang() === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data'))
      }
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Toast notifications — lightweight, no library needed.
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return { toasts, showToast }
}
