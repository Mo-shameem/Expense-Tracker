import { useState } from 'react'

export default function CategoriesSheet({ categories, onAdd, onClose }) {
  const [newCat, setNewCat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    const cat = newCat.trim()
    if (!cat || categories.includes(cat)) return
    setSaving(true)
    try {
      await onAdd(cat)
      setNewCat('')
    } finally {
      setSaving(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={handleBackdrop}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full bg-zinc-900 rounded-t-3xl max-h-[70dvh] flex flex-col shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
          {/* Existing categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span
                key={cat}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-full text-sm font-medium"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Add new category */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="New category name"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={saving || !newCat.trim()}
              className="px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? '…' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
