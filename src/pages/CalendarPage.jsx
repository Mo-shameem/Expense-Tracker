import { useState, useMemo, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { CalendarSkeleton } from '../components/Skeleton'
import DaySheet from '../components/DaySheet'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage({ expenses, categories, loading, addExpense, removeExpense, addCategory, showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const dailyTotals = useMemo(() => {
    const map = {}
    for (const exp of expenses) {
      const key = exp.date
      map[key] = (map[key] || 0) + exp.amount
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

  const handleDayClick = useCallback((day) => {
    if (!isSameMonth(day, currentMonth)) return
    setSelectedDate(day)
  }, [currentMonth])

  if (loading) return <CalendarSkeleton />

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <div className="px-4 py-3 flex items-center justify-between bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors text-slate-300"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</p>
          <p className="text-xs text-slate-400">Total: ₹{monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
        </div>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors text-slate-300"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 px-2 pb-2 flex-1">
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
                flex flex-col items-center justify-start rounded-xl p-1 min-h-[52px] transition-all active:scale-95
                ${!inMonth ? 'opacity-25 pointer-events-none' : ''}
                ${selected ? 'bg-indigo-600 ring-2 ring-indigo-400' : today ? 'bg-slate-700 ring-1 ring-indigo-500' : 'hover:bg-slate-700'}
              `}
            >
              <span className={`text-xs font-medium ${today && !selected ? 'text-indigo-400' : selected ? 'text-white' : 'text-slate-300'}`}>
                {format(day, 'd')}
              </span>
              {total != null && inMonth && (
                <span className={`text-[9px] mt-0.5 font-semibold leading-tight text-center ${selected ? 'text-indigo-200' : 'text-emerald-400'}`}>
                  ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Day sheet */}
      {selectedDate && (
        <DaySheet
          date={selectedDate}
          expenses={selectedExpenses}
          categories={categories}
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
