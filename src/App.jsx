import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useExpenses } from './hooks/useExpenses'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import Layout from './components/Layout'
import Toast from './components/Toast'
import { Skeleton } from './components/Skeleton'

const ChartsPage = lazy(() => import('./pages/ChartsPage'))

export default function App() {
  const { user, spreadsheetId, loading: authLoading, error: authError, login, logout } = useAuth()
  const {
    expenses, categories, loading, syncing, error, pendingCount,
    refresh, addExpense, removeExpense, addCategory, clearError
  } = useExpenses(spreadsheetId)

  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (error) { showToast(error, 'error'); clearError() }
  }, [error, clearError])

  useEffect(() => {
    if (authError) showToast(authError, 'error')
  }, [authError])

  useEffect(() => {
    if (syncing) showToast('Syncing offline changes…', 'info')
  }, [syncing])

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sharedProps = { expenses, categories, loading, refresh, addExpense, removeExpense, addCategory, showToast, spreadsheetId }

  return (
    <HashRouter>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {!user ? (
        <LoginPage onLogin={login} />
      ) : (
        <Layout user={user} onLogout={logout} pendingCount={pendingCount}>
          <Routes>
            <Route path="/" element={<CalendarPage {...sharedProps} />} />
            <Route path="/charts" element={
              <Suspense fallback={<div className="p-4 space-y-3"><Skeleton className="h-10 rounded-xl" /><Skeleton className="h-64 rounded-2xl" /></div>}>
                <ChartsPage {...sharedProps} />
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  )
}
