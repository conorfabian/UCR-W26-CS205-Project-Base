import { useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'

const QUALITY_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
}

function getTodayDateInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toUSDateFromInputDate(inputDate) {
  if (typeof inputDate !== 'string') return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(inputDate)
  if (!match) return ''

  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseTimeToMinutes(timeString) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeString || '')
  if (!match) return NaN
  return Number(match[1]) * 60 + Number(match[2])
}

function calculateSleepHours(bedtime, wakeTime) {
  const bedtimeMinutes = parseTimeToMinutes(bedtime)
  const wakeMinutes = parseTimeToMinutes(wakeTime)

  if (!Number.isFinite(bedtimeMinutes) || !Number.isFinite(wakeMinutes)) {
    return null
  }

  const rawDiff = wakeMinutes - bedtimeMinutes
  if (rawDiff === 0) return null

  const minutesSlept = rawDiff < 0 ? rawDiff + 24 * 60 : rawDiff
  const hoursSlept = Number((minutesSlept / 60).toFixed(2))

  if (!Number.isFinite(hoursSlept) || hoursSlept <= 0) {
    return null
  }

  return hoursSlept
}

function SleepTracker() {
  const { sleepEntries, addSleepEntry, deleteSleepEntry } = useHealthData()
  const [sleepDate, setSleepDate] = useState(getTodayDateInputValue)
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState(null)
  const [formError, setFormError] = useState('')

  const calculatedHours = useMemo(() => calculateSleepHours(bedtime, wakeTime), [bedtime, wakeTime])

  const latestEntry = sleepEntries.length > 0
    ? [...sleepEntries].sort((a, b) => b.id - a.id)[0]
    : null

  const sortedEntries = useMemo(
    () => [...sleepEntries].sort((a, b) => b.id - a.id),
    [sleepEntries],
  )

  const handleSubmit = () => {
    setFormError('')

    if (!sleepDate || !bedtime || !wakeTime || !quality) {
      setFormError('Please fill out date, bedtime, wake time, and sleep quality.')
      return
    }

    const date = toUSDateFromInputDate(sleepDate)
    const hoursSlept = calculateSleepHours(bedtime, wakeTime)

    if (!date || !hoursSlept) {
      setFormError('Invalid sleep duration. Bedtime and wake time cannot be identical.')
      return
    }

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date,
      bedtime,
      wakeTime,
      hoursSlept,
      quality,
    }

    const success = addSleepEntry(newEntry)
    if (!success) {
      setFormError('Could not save this sleep entry. Check your inputs and try again.')
      return
    }

    setBedtime('')
    setWakeTime('')
    setQuality(null)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-slate-100">
        Sleep Tracker
      </h2>
      <p className="mb-4 text-gray-600 dark:text-slate-300">
        Log your sleep schedule and quality each day.
      </p>

      <div className="mb-4">
        <label htmlFor="sleep-date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Sleep date
        </label>
        <input
          id="sleep-date"
          type="date"
          value={sleepDate}
          onChange={(event) => setSleepDate(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bedtime" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Bedtime
          </label>
          <input
            id="bedtime"
            type="time"
            value={bedtime}
            onChange={(event) => setBedtime(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="wake-time" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Wake time
          </label>
          <input
            id="wake-time"
            type="time"
            value={wakeTime}
            onChange={(event) => setWakeTime(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">Sleep quality</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setQuality(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                quality === value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              {value} - {QUALITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/40">
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Estimated duration:{' '}
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {calculatedHours ? `${calculatedHours} hours` : 'Add bedtime and wake time'}
          </span>
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-600 dark:text-red-300">{formError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="mb-6 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Save sleep entry
      </button>

      {latestEntry && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/40">
          <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Last recorded sleep:</p>
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            {latestEntry.hoursSlept} hours, quality {latestEntry.quality}/5
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {latestEntry.date} ({latestEntry.bedtime} - {latestEntry.wakeTime})
          </p>
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {sortedEntries.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-slate-400">
            No sleep entries yet. Add your first night to get started.
          </p>
        ) : (
          sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-slate-100">
                    {entry.hoursSlept}h - Quality {entry.quality}/5
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-300">
                    {entry.date} • {entry.bedtime} - {entry.wakeTime}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this sleep entry?')) {
                      deleteSleepEntry(entry.id)
                    }
                  }}
                  className="rounded px-2 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950/50 dark:hover:text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SleepTracker
