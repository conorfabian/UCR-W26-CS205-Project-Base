import { useEffect, useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import {
  differenceInDayKeys,
  getEntryDayKey,
  getLocalDayKey,
  getTodayFormatted,
  isEntryOnDay,
} from '../utils/helpers'

function WaterTracker() {
  const { waterEntries, goals, addWaterEntry, deleteWaterEntry, setWaterGoal } = useHealthData()
  const [amountOz, setAmountOz] = useState('')
  const [goalInput, setGoalInput] = useState(String(goals.waterDailyGoalOz))
  const [error, setError] = useState('')

  useEffect(() => {
    setGoalInput(String(goals.waterDailyGoalOz))
  }, [goals.waterDailyGoalOz])

  const todayKey = getLocalDayKey()
  const todayTotalOz = useMemo(() => {
    return waterEntries
      .filter((entry) => isEntryOnDay(entry, todayKey))
      .reduce((sum, entry) => sum + Number(entry.amountOz || 0), 0)
  }, [waterEntries, todayKey])

  const weeklyStats = useMemo(() => {
    const dailyTotals = {}
    waterEntries.forEach((entry) => {
      const dayKey = getEntryDayKey(entry)
      if (!dayKey) return

      const diff = differenceInDayKeys(todayKey, dayKey)
      if (!Number.isFinite(diff) || diff < 0 || diff >= 7) return

      dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + Number(entry.amountOz || 0)
    })

    const dayKeys = Object.keys(dailyTotals)
    const totalWeekOz = dayKeys.reduce((sum, dayKey) => sum + dailyTotals[dayKey], 0)
    const daysMetGoal = dayKeys.filter((dayKey) => dailyTotals[dayKey] >= goals.waterDailyGoalOz).length

    return {
      daysLogged: dayKeys.length,
      totalWeekOz,
      avgDailyOz: Number((totalWeekOz / 7).toFixed(2)),
      daysMetGoal,
    }
  }, [waterEntries, todayKey, goals.waterDailyGoalOz])

  const progressPercent = Math.min(
    100,
    Math.round((todayTotalOz / Math.max(1, goals.waterDailyGoalOz)) * 100),
  )

  const handleAddWater = () => {
    setError('')
    const parsedAmount = Number(amountOz)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000) {
      setError('Water amount must be between 1 and 1000 ounces.')
      return
    }

    const now = new Date()
    addWaterEntry({
      id: Date.now(),
      amountOz: Math.round(parsedAmount),
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      dayKey: getLocalDayKey(now),
    })

    setAmountOz('')
  }

  const handleSaveGoal = () => {
    setError('')
    const parsedGoal = Number(goalInput)
    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0 || parsedGoal > 1000) {
      setError('Daily goal must be between 1 and 1000 ounces.')
      return
    }

    const success = setWaterGoal(parsedGoal)
    if (!success) {
      setError('Unable to save water goal.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Water Intake</h2>
      <p className="text-sm text-gray-600 mb-4">Track hydration in ounces and set a daily goal.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm text-gray-700">
          Add water (oz)
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            value={amountOz}
            onChange={(e) => setAmountOz(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>

        <div className="text-sm text-gray-700">
          Daily goal (oz)
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleSaveGoal}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleAddWater}
        className="w-full mb-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Log Water Intake
      </button>

      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-indigo-700">Today&apos;s progress</span>
          <span className="text-indigo-700">{todayTotalOz}/{goals.waterDailyGoalOz} oz</span>
        </div>
        <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Last 7 days</p>
        <p className="text-sm text-blue-800">
          {weeklyStats.totalWeekOz} oz total · {weeklyStats.avgDailyOz} oz/day avg · Goal met {weeklyStats.daysMetGoal} day{weeklyStats.daysMetGoal === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {waterEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-3">No water entries yet.</p>
        ) : (
          [...waterEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{entry.amountOz} oz</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date} at {entry.time}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this water entry?')) {
                      deleteWaterEntry(entry.id)
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

export default WaterTracker
