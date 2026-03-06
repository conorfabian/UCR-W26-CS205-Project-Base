import { useMemo } from 'react'
import { useHealthData } from '../context/HealthDataContext'

function HistoryView() {
  const {
    moodEntries,
    sleepEntries,
    waterEntries,
    exerciseEntries,
    deleteMoodEntry,
    deleteSleepEntry,
    deleteWaterEntry,
    deleteExerciseEntry,
  } = useHealthData()

  const sortedMoodEntries = useMemo(
    () => [...moodEntries].sort((a, b) => b.id - a.id),
    [moodEntries],
  )

  const groupedMoodByDate = useMemo(() => {
    const grouped = {}
    sortedMoodEntries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    return grouped
  }, [sortedMoodEntries])

  const sortedSleepEntries = useMemo(
    () => [...sleepEntries].sort((a, b) => b.id - a.id),
    [sleepEntries],
  )

  const sortedWaterEntries = useMemo(
    () => [...waterEntries].sort((a, b) => b.id - a.id),
    [waterEntries],
  )

  const sortedExerciseEntries = useMemo(
    () => [...exerciseEntries].sort((a, b) => b.id - a.id),
    [exerciseEntries],
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mood History</h2>

        {Object.keys(groupedMoodByDate).length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No mood history yet.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMoodByDate)
              .sort((a, b) => new Date(b[0]) - new Date(a[0]))
              .map(([date, entries]) => (
                <div key={date} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">{date}</h3>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">Mood: {entry.mood}</span>
                          <span className="text-gray-500 text-sm ml-2">• {entry.time}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this mood entry?')) {
                              deleteMoodEntry(entry.id)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-medium text-sm ml-4 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete this entry"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sleep History</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedSleepEntries.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No sleep entries yet.</p>
            ) : (
              sortedSleepEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{entry.hoursSlept} hrs · Quality {entry.quality}/5</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date} · Bed {entry.bedtime} / Wake {entry.wakeTime}</p>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this sleep entry?')) {
                        deleteSleepEntry(entry.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm mt-2"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Water History</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedWaterEntries.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No water entries yet.</p>
            ) : (
              sortedWaterEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{entry.amountOz} oz</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date} at {entry.time}</p>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this water entry?')) {
                        deleteWaterEntry(entry.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm mt-2"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Exercise History</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedExerciseEntries.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No exercise entries yet.</p>
            ) : (
              sortedExerciseEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{entry.workoutType}</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.durationMinutes} min · {entry.caloriesBurned} cal</p>
                  <p className="text-xs text-gray-500 mt-1">{entry.date} at {entry.time}</p>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this exercise entry?')) {
                        deleteExerciseEntry(entry.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm mt-2"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoryView
