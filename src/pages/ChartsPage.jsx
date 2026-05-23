import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, parseISO, subWeeks, subMonths
} from 'date-fns'
import { Skeleton } from '../components/Skeleton'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16']

function getCategoryData(expenses) {
  const map = {}
  for (const exp of expenses) {
    map[exp.category] = (map[exp.category] || 0) + exp.amount
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
}

export default function ChartsPage({ expenses, loading }) {
  const [period, setPeriod] = useState('month') // 'week' | 'month'
  const [offset, setOffset] = useState(0)

  const { filtered, label } = useMemo(() => {
    const now = new Date()
    let start, end, label

    if (period === 'week') {
      const ref = subWeeks(now, offset)
      start = startOfWeek(ref)
      end = endOfWeek(ref)
      label = offset === 0 ? 'This Week' : offset === 1 ? 'Last Week' : `Week of ${format(start, 'MMM d')}`
    } else {
      const ref = subMonths(now, offset)
      start = startOfMonth(ref)
      end = endOfMonth(ref)
      label = offset === 0 ? 'This Month' : format(ref, 'MMMM yyyy')
    }

    const filtered = expenses.filter(e => {
      try {
        return isWithinInterval(parseISO(e.date), { start, end })
      } catch { return false }
    })

    return { filtered, label, start, end }
  }, [expenses, period, offset])

  const data = useMemo(() => getCategoryData(filtered), [filtered])
  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0].payload
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="font-medium text-white">{name}</p>
        <p className="text-emerald-400">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        <p className="text-slate-400">{((value / total) * 100).toFixed(1)}%</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      {/* Period toggle */}
      <div className="flex gap-2 bg-slate-800 p-1 rounded-2xl">
        {['week', 'month'].map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setOffset(0) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOffset(o => o + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-semibold text-white">{label}</p>
          <p className="text-sm text-emerald-400">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>
        <button
          onClick={() => setOffset(o => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-300 transition-colors"
        >
          ›
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-2xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm">No expenses for this period</p>
        </div>
      ) : (
        <>
          {/* Pie chart */}
          <div className="bg-slate-800 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <p className="text-center -mt-4 text-slate-400 text-sm">
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Category breakdown */}
          <div className="space-y-2">
            {data.map((item, i) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={item.name} className="bg-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-white">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct.toFixed(1)}% of total</p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
