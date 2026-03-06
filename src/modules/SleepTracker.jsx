import { useEffect, useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import {
  calculateSleepHours,
  differenceInDayKeys,
  getEntryDayKey,
  getLocalDayKey,
  getTodayFormatted,
} from '../utils/helpers'

const QUALITY_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
}

function SleepTracker() {
  const { sleepEntries, addSleepEntry, deleteSleepEntry } = useHealthData()
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [hoursSlept, setHoursSlept] = useState('')
  const [quality, setQuality] = useState(3)
  const [error, setError] = useState('')

  useEffect(() => {
    const calculatedHours = calculateSleepHours(bedtime, wakeTime)
    if (calculatedHours !== null) {
      setHoursSlept(String(calculatedHours))
    }
  }, [bedtime, wakeTime])

  const latestEntry = useMemo(() => {
    if (sleepEntries.length === 0) return null
    return [...sleepEntries].sort((a, b) => b.id - a.id)[0]
  }, [sleepEntries])

  const weeklyStats = useMemo(() => {
    const todayKey = getLocalDayKey()
    const weeklyEntries = sleepEntries.filter((entry) => {
      const dayKey = getEntryDayKey(entry)
      if (!dayKey) return false
      const diff = differenceInDayKeys(todayKey, dayKey)
      return Number.isFinite(diff) && diff >= 0 && diff < 7
    })

    if (weeklyEntries.length === 0) {
      return {
        nightsLogged: 0,
        avgHours: 0,
        avgQuality: 0,
      }
    }

    const totalHours = weeklyEntries.reduce((sum, entry) => sum + Number(entry.hoursSlept || 0), 0)
    const totalQuality = weeklyEntries.reduce((sum, entry) => sum + Number(entry.quality || 0), 0)

    return {
      nightsLogged: weeklyEntries.length,
      avgHours: Number((totalHours / weeklyEntries.length).toFixed(2)),
      avgQuality: Number((totalQuality / weeklyEntries.length).toFixed(2)),
    }
  }, [sleepEntries])

  const handleSave = () => {
    setError('')

    if (!bedtime || !wakeTime) {
      setError('Please provide both bedtime and wake time.')
      return
    }

    const parsedHours = Number(hoursSlept)
    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      setError('Hours slept must be between 0 and 24.')
      return
    }

    const parsedQuality = Number(quality)
    if (!Number.isInteger(parsedQuality) || parsedQuality < 1 || parsedQuality > 5) {
      setError('Sleep quality must be between 1 and 5.')
      return
    }

    const now = new Date()
    addSleepEntry({
      id: Date.now(),
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      dayKey: getLocalDayKey(now),
      bedtime,
      wakeTime,
      hoursSlept: Number(parsedHours.toFixed(2)),
      quality: parsedQuality,
    })

    setBedtime('')
    setWakeTime('')
    setHoursSlept('')
    setQuality(3)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sleep Tracker</h2>
      <p className="text-sm text-gray-600 mb-4">Log bedtime, wake time, total sleep, and sleep quality.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm text-gray-700">
          Bedtime
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>

        <label className="text-sm text-gray-700">
          Wake time
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <label className="text-sm text-gray-700">
          Hours slept
          <input
            type="number"
            min="0"
            max="24"
            step="0.25"
            value={hoursSlept}
            onChange={(e) => setHoursSlept(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>

        <label className="text-sm text-gray-700">
          Sleep quality
          <select
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {Object.entries(QUALITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{value} - {label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full mb-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Save Sleep Entry
      </button>

      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
        <p className="text-xs text-indigo-700 uppercase tracking-wide mb-1">Last 7 days</p>
        {weeklyStats.nightsLogged === 0 ? (
          <p className="text-sm text-indigo-800">No sleep entries logged yet this week.</p>
        ) : (
          <p className="text-sm text-indigo-800">
            {weeklyStats.nightsLogged} night{weeklyStats.nightsLogged === 1 ? '' : 's'} logged · Avg {weeklyStats.avgHours} hrs · Quality {weeklyStats.avgQuality}/5
          </p>
        )}
      </div>

      {latestEntry && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Latest sleep log</p>
          <p className="text-sm text-gray-800 mt-1">
            {latestEntry.date} · {latestEntry.hoursSlept} hrs · Quality {latestEntry.quality}/5
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {sleepEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-3">No sleep entries yet.</p>
        ) : (
          [...sleepEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {entry.hoursSlept} hrs · Quality {entry.quality}/5
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.date} · Bed {entry.bedtime} / Wake {entry.wakeTime}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this sleep entry?')) {
                      deleteSleepEntry(entry.id)
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

export default SleepTracker
