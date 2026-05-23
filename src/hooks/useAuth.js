import { useState, useEffect, useCallback } from 'react'
import {
  loadGsiScript,
  initTokenClient,
  requestAccessToken,
  signOut,
  loadTokenFromSession,
  setTokenRefreshCallback,
  findOrCreateSpreadsheet
} from '../lib/googleApi'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const decodeJwt = (token) => {
    try {
      const payload = token.split('.')[1]
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
      return null
    }
  }

  const setupSpreadsheet = useCallback(async (email) => {
    const id = await findOrCreateSpreadsheet(email)
    setSpreadsheetId(id)
    return id
  }, [])

  const handleCredential = useCallback(async (credentialResponse) => {
    const payload = decodeJwt(credentialResponse.credential)
    if (!payload) return
    const userInfo = { email: payload.email, name: payload.name, picture: payload.picture }
    setUser(userInfo)
    localStorage.setItem('expense_user', JSON.stringify(userInfo))

    try {
      await requestAccessToken()
      await setupSpreadsheet(userInfo.email)
    } catch (e) {
      setError(e.message)
    }
  }, [setupSpreadsheet])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await loadGsiScript()
        await initTokenClient()

        setTokenRefreshCallback(async () => {
          const stored = localStorage.getItem('expense_user')
          if (stored && mounted) {
            const u = JSON.parse(stored)
            if (!spreadsheetId) await setupSpreadsheet(u.email)
          }
        })

        // Try to restore session
        const storedUser = localStorage.getItem('expense_user')
        if (storedUser && loadTokenFromSession()) {
          const u = JSON.parse(storedUser)
          if (mounted) {
            setUser(u)
            await setupSpreadsheet(u.email)
          }
        } else if (storedUser) {
          // Token expired, need fresh token - init one-tap
          const u = JSON.parse(storedUser)
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredential,
            auto_select: true
          })
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Will require manual sign-in
              if (mounted) setUser(null)
            }
          })
          if (mounted) setUser(u) // Optimistic
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
    try {
      await loadGsiScript()

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredential
      })

      await requestAccessToken()

      // After we get the access token, fetch user info
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${window.__gsi_token || ''}` }
      })

      // Fallback: use one-tap prompt to get user info via ID token
      window.google.accounts.id.prompt()
    } catch (e) {
      setError(e.message)
    }
  }, [handleCredential])

  const loginWithOneTap = useCallback(() => {
    setError(null)
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredential,
      context: 'signin'
    })
    window.google.accounts.id.prompt()
  }, [handleCredential])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
    setSpreadsheetId(null)
    localStorage.removeItem('expense_user')
    window.google?.accounts.id.disableAutoSelect()
  }, [])

  return { user, spreadsheetId, loading, error, login: loginWithOneTap, logout }
}
