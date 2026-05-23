import { useState, useEffect, useCallback } from 'react'
import {
  loadGsiScript,
  initTokenClient,
  requestAccessToken,
  redirectToGoogleLogin,
  signOut,
  loadTokenFromSession,
  getAccessToken,
  findOrCreateSpreadsheet
} from '../lib/googleApi'

async function fetchUserInfo(token) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!resp.ok) throw new Error('Failed to fetch user info')
  const info = await resp.json()
  return { email: info.email, name: info.name, picture: info.picture }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState(null)

  const setupSpreadsheet = useCallback(async (email) => {
    const id = await findOrCreateSpreadsheet(email)
    setSpreadsheetId(id)
    return id
  }, [])

  const finalizeLogin = useCallback(async (token) => {
    const userInfo = await fetchUserInfo(token)
    setUser(userInfo)
    localStorage.setItem('expense_user', JSON.stringify(userInfo))
    await setupSpreadsheet(userInfo.email)
  }, [setupSpreadsheet])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Case 1: returning from OAuth redirect — token already stored by main.jsx
        const storedUser = localStorage.getItem('expense_user')
        const tokenRestored = loadTokenFromSession()

        if (tokenRestored) {
          const token = getAccessToken()
          if (storedUser) {
            // Known user, valid token — restore session silently
            const u = JSON.parse(storedUser)
            if (mounted) { setUser(u); await setupSpreadsheet(u.email) }
          } else {
            // New login from redirect — fetch user info
            if (mounted) await finalizeLogin(token)
          }
          return
        }

        // Case 2: stored user but expired token — try silent popup refresh (desktop only)
        if (storedUser) {
          try {
            await loadGsiScript()
            await initTokenClient()
            const token = await requestAccessToken()
            const u = JSON.parse(storedUser)
            if (mounted) { setUser(u); await setupSpreadsheet(u.email) }
          } catch {
            // Popup blocked (mobile) — clear user, require re-login
            if (mounted) setUser(null)
          }
        }
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async () => {
    setError(null)
    setSigningIn(true)

    // Try popup first (works on desktop + Android Chrome)
    try {
      await loadGsiScript()
      await initTokenClient()
      const token = await requestAccessToken()
      await finalizeLogin(token)
      setSigningIn(false)
      return
    } catch {
      // Popup blocked — fall through to redirect
    }

    // Redirect flow (works everywhere, including iOS Safari)
    redirectToGoogleLogin()
    // Page will navigate away; signingIn stays true during redirect
  }, [finalizeLogin])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
    setSpreadsheetId(null)
    localStorage.removeItem('expense_user')
  }, [])

  return { user, spreadsheetId, loading, signingIn, error, login, logout }
}
