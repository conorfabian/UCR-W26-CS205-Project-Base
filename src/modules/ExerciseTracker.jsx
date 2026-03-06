import { useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import {
  differenceInDayKeys,
  getEntryDayKey,
  getLocalDayKey,
  getTodayFormatted,
} from '../utils/helpers'

function ExerciseTracker() {
  const { exerciseEntries, addExerciseEntry, deleteExerciseEntry } = useHealthData()
  const [workoutType, setWorkoutType] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [error, setError] = useState('')

  const weeklyStats = useMemo(() => {
    const todayKey = getLocalDayKey()
    const weeklyEntries = exerciseEntries.filter((entry) => {
      const dayKey = getEntryDayKey(entry)
      if (!dayKey) return false
      const diff = differenceInDayKeys(todayKey, dayKey)
      return Number.isFinite(diff) && diff >= 0 && diff < 7
    })

    const totalMinutes = weeklyEntries.reduce((sum, entry) => sum + Number(entry.durationMinutes || 0), 0)
    const totalCalories = weeklyEntries.reduce((sum, entry) => sum + Number(entry.caloriesBurned || 0), 0)

    return {
      sessions: weeklyEntries.length,
      totalMinutes,
      totalCalories,
    }
  }, [exerciseEntries])

  const handleSave = () => {
    setError('')

    const trimmedWorkoutType = workoutType.trim()
    const parsedDuration = Number(durationMinutes)
    const parsedCalories = Number(caloriesBurned)

    if (!trimmedWorkoutType) {
      setError('Workout type is required.')
      return
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > 600) {
      setError('Duration must be between 1 and 600 minutes.')
      return
    }

    if (!Number.isFinite(parsedCalories) || parsedCalories <= 0 || parsedCalories > 5000) {
      setError('Calories burned must be between 1 and 5000.')
      return
    }

    const now = new Date()
    addExerciseEntry({
      id: Date.now(),
      workoutType: trimmedWorkoutType,
      durationMinutes: Math.round(parsedDuration),
      caloriesBurned: Math.round(parsedCalories),
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      dayKey: getLocalDayKey(now),
    })

    setWorkoutType('')
    setDurationMinutes('')
    setCaloriesBurned('')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Exercise Log</h2>
      <p className="text-sm text-gray-600 mb-4">Record workouts, duration, and calories burned.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <label className="text-sm text-gray-700">
          Workout type
          <input
            type="text"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value)}
            placeholder="Run, Cycling, Weights..."
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>

        <label className="text-sm text-gray-700">
          Duration (min)
          <input
            type="number"
            min="1"
            max="600"
            step="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </label>

        <label className="text-sm text-gray-700">
          Calories burned
          <input
            type="number"
            min="1"
            max="5000"
            step="1"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
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
        Save Workout
      </button>

      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
        <p className="text-xs text-indigo-700 uppercase tracking-wide mb-1">Last 7 days</p>
        <p className="text-sm text-indigo-800">
          {weeklyStats.sessions} session{weeklyStats.sessions === 1 ? '' : 's'} · {weeklyStats.totalMinutes} min · {weeklyStats.totalCalories} calories
        </p>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {exerciseEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-3">No workouts logged yet.</p>
        ) : (
          [...exerciseEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{entry.workoutType}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.durationMinutes} min · {entry.caloriesBurned} cal · {entry.date} at {entry.time}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this exercise entry?')) {
                      deleteExerciseEntry(entry.id)
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

export default ExerciseTracker
