import { NavLink } from 'react-router-dom'

export default function Layout({ children, user, onLogout, pendingCount }) {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-900">
      {/* Header */}
      <header className="safe-top bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-semibold text-white">Expenses</span>
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          {user.picture && (
            <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span className="text-sm hidden sm:block">{user.name}</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom nav */}
      <nav className="safe-bottom bg-slate-800 border-t border-slate-700 flex sticky bottom-0 z-40">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar
        </NavLink>
        <NavLink
          to="/charts"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Charts
        </NavLink>
      </nav>
    </div>
  )
}
