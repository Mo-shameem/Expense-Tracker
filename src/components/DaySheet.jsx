import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

const CAT_COLORS = ['#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316']

function getCatColor(cat, categories) {
  const idx = categories.indexOf(cat)
  return CAT_COLORS[idx % CAT_COLORS.length] || '#8b5cf6'
}

export default function DaySheet({ date, expenses, categories, onAdd, onDelete, onAddCategory, onClose, defaultMode }) {
  const [mode, setMode] = useState(defaultMode || 'view')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [note, setNote] = useState('')
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const amountRef = useRef(null)

  useEffect(() => {
    if (mode === 'add') setTimeout(() => amountRef.current?.focus(), 150)
  }, [mode])

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) return
    setSaving(true)
    try {
      await onAdd({ amount: parsed, category, note })
      onClose()
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleDelete = async (i) => {
    setDeleting(i)
    try { await onDelete(i) } catch {} finally { setDeleting(null) }
  }

  const handleAddCategory = async () => {
    const cat = newCat.trim()
    if (!cat) return
    await onAddCategory(cat)
    setCategory(cat)
    setNewCat('')
    setAddingCat(false)
  }

  const dayTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full bg-zinc-900 rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl border-t border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">{format(date, 'EEEE, d MMMM')}</h2>
            {dayTotal > 0 && (
              <p className="text-sm text-emerald-400 font-semibold">
                ₹{dayTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="space-y-2">
              {expenses.map((exp, i) => (
                <div key={i} className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCatColor(exp.category, categories) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{exp.category}</p>
                    {exp.note && <p className="text-xs text-zinc-400 truncate">{exp.note}</p>}
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">
                    ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => handleDelete(i)}
                    disabled={deleting === i}
                    className="text-zinc-600 hover:text-rose-400 transition-colors shrink-0 ml-1"
                  >
                    {deleting === i
                      ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form — shown directly if defaultMode='add', or after tapping + */}
          {mode === 'add' ? (
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                placeholder="Amount (₹)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 text-xl font-bold focus:outline-none focus:border-violet-500 transition-colors"
                required
              />

              {/* Category chips */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        category === cat
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddingCat(!addingCat)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors border border-dashed border-zinc-600"
                  >
                    + Category
                  </button>
                </div>

                {addingCat && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2.5 bg-violet-600 rounded-xl text-white text-sm font-semibold"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          ) : (
            /* Only show + button in view mode when there are existing expenses */
            expenses.length > 0 && (
              <button
                onClick={() => setMode('add')}
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-2xl font-light transition-all shadow-lg shadow-violet-900/40"
              >
                +
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
