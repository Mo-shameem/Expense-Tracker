import { useState, useMemo, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { CalendarSkeleton } from '../components/Skeleton'
import DaySheet from '../components/DaySheet'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function CalendarPage({ expenses, categories, loading, addExpense, removeExpense, addCategory, showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [sheetMode, setSheetMode] = useState('view')

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const dailyTotals = useMemo(() => {
    const map = {}
    for (const exp of expenses) {
      map[exp.date] = (map[exp.date] || 0) + exp.amount
    }
    return map
  }, [expenses])

  const selectedExpenses = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return expenses.filter(e => e.date === key)
  }, [selectedDate, expenses])

  const monthTotal = useMemo(() => {
    const prefix = format(currentMonth, 'yyyy-MM')
    return expenses
      .filter(e => e.date?.startsWith(prefix))
      .reduce((s, e) => s + e.amount, 0)
  }, [currentMonth, expenses])

  // Tap a calendar date — go to add mode if no expenses, view mode if has expenses
  const handleDayClick = useCallback((day) => {
    if (!isSameMonth(day, currentMonth)) return
    const key = format(day, 'yyyy-MM-dd')
    const hasExpenses = !!dailyTotals[key]
    setSheetMode(hasExpenses ? 'view' : 'add')
    setSelectedDate(day)
  }, [currentMonth, dailyTotals])

  // FAB — always open today in add mode directly
  const openToday = useCallback(() => {
    const today = new Date()
    setCurrentMonth(today)
    setSheetMode('add')
    setSelectedDate(today)
  }, [])

  if (loading) return <CalendarSkeleton />

  return (
    <div className="flex flex-col h-full relative">
      {/* Month navigation */}
      <div className="px-4 py-3 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 text-xl"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</p>
          <p className="text-xs text-emerald-400 font-medium">
            ₹{monthTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 text-xl"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 pt-2 bg-zinc-950">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-zinc-600 py-1 font-semibold tracking-wide">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 px-2 pb-24 flex-1 bg-zinc-950">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const total = dailyTotals[key]
          const inMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)
          const selected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              className={`
                flex flex-col items-center justify-start rounded-xl p-1 min-h-[52px] transition-all active:scale-90
                ${!inMonth ? 'opacity-20 pointer-events-none' : ''}
                ${selected
                  ? 'bg-violet-600 ring-2 ring-violet-400'
                  : today
                    ? 'bg-zinc-800 ring-1 ring-violet-500'
                    : 'hover:bg-zinc-800/70'}
              `}
            >
              <span className={`text-xs font-semibold ${
                today && !selected ? 'text-violet-400' : selected ? 'text-white' : 'text-zinc-300'
              }`}>
                {format(day, 'd')}
              </span>
              {total != null && inMonth && (
                <span className={`text-[9px] mt-0.5 font-bold leading-tight ${
                  selected ? 'text-violet-200' : 'text-emerald-400'
                }`}>
                  ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* FAB — opens today in add mode directly */}
      <button
        onClick={openToday}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 shadow-xl shadow-violet-900/60 flex items-center justify-center text-white text-3xl font-light active:scale-90 transition-transform"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        +
      </button>

      {/* Day sheet */}
      {selectedDate && (
        <DaySheet
          key={`${format(selectedDate, 'yyyy-MM-dd')}-${sheetMode}`}
          date={selectedDate}
          expenses={selectedExpenses}
          categories={categories}
          defaultMode={sheetMode}
          onAdd={async (data) => {
            try {
              await addExpense({ ...data, date: format(selectedDate, 'yyyy-MM-dd') })
              showToast('Expense added', 'success')
            } catch (e) {
              showToast(e.message)
            }
          }}
          onDelete={async (idx) => {
            const globalIdx = expenses.findIndex(e => e === selectedExpenses[idx])
            try {
              await removeExpense(globalIdx)
              showToast('Deleted', 'success')
            } catch (e) {
              showToast(e.message)
            }
          }}
          onAddCategory={addCategory}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
