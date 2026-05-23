import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

const CATEGORY_COLORS = {
  Fuel: '#f59e0b', Grocery: '#10b981', Food: '#ef4444',
  Travel: '#3b82f6', Rent: '#8b5cf6'
}

function getCatColor(cat) {
  return CATEGORY_COLORS[cat] || '#6366f1'
}

export default function DaySheet({ date, expenses, categories, onAdd, onDelete, onAddCategory, onClose }) {
  const [mode, setMode] = useState('view') // 'view' | 'add'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [note, setNote] = useState('')
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const sheetRef = useRef(null)
  const amountRef = useRef(null)

  useEffect(() => {
    if (mode === 'add') setTimeout(() => amountRef.current?.focus(), 100)
  }, [mode])

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) return
    setSaving(true)
    try {
      await onAdd({ amount: parseFloat(amount), category, note })
      setAmount('')
      setNote('')
      setMode('view')
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
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full bg-slate-800 rounded-t-3xl max-h-[80dvh] flex flex-col shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{format(date, 'EEEE, d MMMM')}</h2>
            {dayTotal > 0 && (
              <p className="text-sm text-emerald-400 font-medium">
                Total: ₹{dayTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="space-y-2 mb-4">
              {expenses.map((exp, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-3 py-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCatColor(exp.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{exp.category}</p>
                    {exp.note && <p className="text-xs text-slate-400 truncate">{exp.note}</p>}
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">
                    ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => handleDelete(i)}
                    disabled={deleting === i}
                    className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    {deleting === i
                      ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {mode === 'add' ? (
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                placeholder="Amount (₹)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 text-lg font-semibold focus:outline-none focus:border-indigo-500"
                required
              />

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        category === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddingCat(!addingCat)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                  >
                    + New
                  </button>
                </div>

                {addingCat && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-indigo-600 rounded-xl text-white text-sm font-medium"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setMode('add')}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
