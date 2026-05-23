import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchExpenses,
  appendExpense,
  deleteExpense,
  fetchCategories,
  appendCategory,
  queueOfflineExpense,
  flushOfflineQueue,
  getOfflineQueue
} from '../lib/googleApi'

export function useExpenses(spreadsheetId) {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const abortRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!spreadsheetId) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const [exp, cats] = await Promise.all([
        fetchExpenses(spreadsheetId),
        fetchCategories(spreadsheetId)
      ])
      setExpenses(exp)
      setCategories(cats)
      setPendingCount(getOfflineQueue().length)
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [spreadsheetId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Sync offline queue on reconnect
  useEffect(() => {
    const sync = async () => {
      if (!spreadsheetId || !navigator.onLine) return
      const queue = getOfflineQueue()
      if (!queue.length) return

      setSyncing(true)
      try {
        const flushed = await flushOfflineQueue()
        if (flushed > 0) await refresh()
        setPendingCount(getOfflineQueue().length)
      } catch {} finally {
        setSyncing(false)
      }
    }

    window.addEventListener('online', sync)
    sync()
    return () => window.removeEventListener('online', sync)
  }, [spreadsheetId, refresh])

  const addExpense = useCallback(async (expense) => {
    if (!spreadsheetId) return

    const optimistic = {
      ...expense,
      timestamp: new Date().toISOString(),
      _pending: !navigator.onLine
    }
    setExpenses(prev => [...prev, optimistic])

    if (!navigator.onLine) {
      queueOfflineExpense(spreadsheetId, expense)
      setPendingCount(getOfflineQueue().length)
      return
    }

    try {
      await appendExpense(spreadsheetId, expense)
      await refresh()
    } catch (e) {
      setExpenses(prev => prev.filter(x => x !== optimistic))
      setError(e.message)
      throw e
    }
  }, [spreadsheetId, refresh])

  const removeExpense = useCallback(async (rowIndex) => {
    if (!spreadsheetId) return
    const prev = [...expenses]
    setExpenses(e => e.filter((_, i) => i !== rowIndex))

    try {
      await deleteExpense(spreadsheetId, rowIndex)
    } catch (e) {
      setExpenses(prev)
      setError(e.message)
      throw e
    }
  }, [spreadsheetId, expenses])

  const addCategory = useCallback(async (category) => {
    if (!spreadsheetId) return
    setCategories(prev => [...prev, category])
    try {
      await appendCategory(spreadsheetId, category)
    } catch (e) {
      setCategories(prev => prev.filter(c => c !== category))
      setError(e.message)
      throw e
    }
  }, [spreadsheetId])

  return {
    expenses,
    categories,
    loading,
    syncing,
    error,
    pendingCount,
    refresh,
    addExpense,
    removeExpense,
    addCategory,
    clearError: () => setError(null)
  }
}
