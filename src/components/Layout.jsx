import { NavLink } from 'react-router-dom'

export default function Layout({ children, user, onLogout, pendingCount, onManageCategories }) {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      {/* Header */}
      <header className="safe-top bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-sm font-bold">₹</div>
          <span className="font-semibold text-white">Expenses</span>
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onManageCategories}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Manage categories"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 12h.01M7 17h.01M11 7h6M11 12h6M11 17h6" />
            </svg>
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            {user.picture && (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full ring-1 ring-zinc-700" referrerPolicy="no-referrer" />
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom nav */}
      <nav className="safe-bottom bg-zinc-900 border-t border-zinc-800 flex sticky bottom-0 z-40">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-200'}`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Trans
        </NavLink>
        <NavLink
          to="/charts"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-200'}`
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Stats
        </NavLink>
      </nav>
    </div>
  )
}
