export default function Toast({ message, type = 'error', onClose }) {
  const colors = {
    error: 'bg-rose-600',
    info: 'bg-violet-600',
    success: 'bg-emerald-600'
  }
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm w-[calc(100%-2rem)] text-sm font-medium`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 opacity-75 hover:opacity-100">✕</button>
    </div>
  )
}
