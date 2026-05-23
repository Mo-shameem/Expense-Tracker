import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadGsiScript, initTokenClient, requestAccessToken,
  signOut, loadTokenFromSession, getAccessToken, findOrCreateSpreadsheet
} from '../lib/googleApi'

async function fetchUserInfo(token) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!resp.ok) throw new Error('Failed to fetch user info')
  return resp.json()
}

export function useAuth() {
  const [user, setUser]             = useState(null)
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [signingIn, setSigningIn]   = useState(false)
  const [error, setError]           = useState(null)
  const gsiReady = useRef(false)

  const setupSpreadsheet = useCallback(async (email) => {
    const id = await findOrCreateSpreadsheet(email)
    setSpreadsheetId(id)
    return id
  }, [])

  // Pre-load GSI script silently on mount so it's ready when user taps login
  useEffect(() => {
    loadGsiScript()
      .then(() => initTokenClient())
      .then(() => { gsiReady.current = true })
      .catch(() => {})
  }, [])

  // Restore session on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (loadTokenFromSession()) {
          const token = getAccessToken()
          const stored = localStorage.getItem('expense_user')
          if (stored) {
            const u = JSON.parse(stored)
            if (mounted) { setUser(u); await setupSpreadsheet(u.email) }
          } else {
            const info = await fetchUserInfo(token)
            const u = { email: info.email, name: info.name, picture: info.picture }
            localStorage.setItem('expense_user', JSON.stringify(u))
            if (mounted) { setUser(u); await setupSpreadsheet(u.email) }
          }
        } else {
          localStorage.removeItem('expense_user')
          if (mounted) setUser(null)
        }
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [setupSpreadsheet])

  // Login — called directly from button tap, triggers popup synchronously
  const login = useCallback(async () => {
    setError(null)
    setSigningIn(true)
    try {
      // Ensure GSI is ready (usually already loaded from useEffect)
      if (!gsiReady.current) {
        await loadGsiScript()
        await initTokenClient()
        gsiReady.current = true
      }
      // requestAccessToken opens the Google popup synchronously
      const token = await requestAccessToken()
      const info = await fetchUserInfo(token)
      const u = { email: info.email, name: info.name, picture: info.picture }
      localStorage.setItem('expense_user', JSON.stringify(u))
      setUser(u)
      await setupSpreadsheet(u.email)
    } catch (e) {
      setError(e.message || 'Sign-in failed. Please allow popups and try again.')
      setSigningIn(false)
    }
  }, [setupSpreadsheet])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
    setSpreadsheetId(null)
    localStorage.removeItem('expense_user')
  }, [])

  return { user, spreadsheetId, loading, signingIn, error, login, logout }
}
