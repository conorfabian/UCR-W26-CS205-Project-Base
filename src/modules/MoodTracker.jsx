import { useState } from 'react'
import { MAX_NOTE_LENGTH, useHealthData } from '../context/HealthDataContext'
import { getTodayFormatted } from '../utils/helpers'

const MOOD_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
}

function MoodTracker() {
  const { moodEntries, addMoodEntry, deleteMoodEntry } = useHealthData()
  const [selectedMood, setSelectedMood] = useState(null)
  const [note, setNote] = useState('')
  const [expandedNotes, setExpandedNotes] = useState({})
  const NOTE_PREVIEW_LENGTH = 120

  const handleSelectMood = (mood) => {
    setSelectedMood(mood)
  }

  const handleSubmit = () => {
    if (!selectedMood) return

    const now = new Date()

    const newEntry = {
      id: Date.now(),
      mood: selectedMood,
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      note,
    }

    addMoodEntry(newEntry)
    setSelectedMood(null)
    setNote('')
  }

  const toggleExpandedNote = (entryId) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }))
  }

  const latestEntry = moodEntries.length > 0
    ? [...moodEntries].sort((a, b) => b.id - a.id)[0]
    : null

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">
        Mood Tracker
      </h2>
      <p className="mb-4 text-gray-600 dark:text-slate-300">
        Select how you&apos;re feeling and then submit. Date and time are recorded automatically.
      </p>

      <div className="mb-6 flex justify-between space-x-2">
        {[1, 2, 3, 4, 5].map((mood) => (
          <button
            key={mood}
            onClick={() => handleSelectMood(mood)}
            className={`flex-1 py-3 rounded-lg font-semibold border transition-colors ${
              selectedMood === mood
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            <div className="text-lg">{mood}</div>
            <div
              className={`text-xs mt-1 ${
                selectedMood === mood ? 'text-white' : 'text-gray-600 dark:text-slate-300'
              }`}
            >
              {MOOD_LABELS[mood]}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="mood-note" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Journal note (optional)
        </label>
        <textarea
          id="mood-note"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What happened today? Any context behind this mood?"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          rows="4"
        />
        <p className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedMood}
        className={`w-full mb-6 py-2 px-4 rounded-lg font-medium transition-colors ${
          selectedMood
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
        }`}
      >
        Save how I feel
      </button>

      {latestEntry && (
        <div className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/40">
          <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Last recorded mood:</p>
          <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
            {latestEntry.mood} - {MOOD_LABELS[latestEntry.mood] || 'Mood'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {latestEntry.date} at {latestEntry.time}
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {moodEntries.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-slate-400">
            No moods logged yet. Choose how you feel to get started.
          </p>
        ) : (
          [...moodEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-slate-100">
                      {entry.mood} - {MOOD_LABELS[entry.mood] || 'Mood'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-slate-300">
                      • {entry.date} at {entry.time}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this mood entry?')) {
                        deleteMoodEntry(entry.id)
                      }
                    }}
                    className="rounded px-2 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950/50 dark:hover:text-red-200"
                    title="Delete this entry"
                  >
                    Delete
                  </button>
                </div>
                {entry.note && (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
                    <p className="mb-1 text-xs font-medium text-gray-600 dark:text-slate-300">Note</p>
                    <p className="break-words whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-200">
                      {expandedNotes[entry.id] || entry.note.length <= NOTE_PREVIEW_LENGTH
                        ? entry.note
                        : `${entry.note.slice(0, NOTE_PREVIEW_LENGTH)}...`}
                    </p>
                    {entry.note.length > NOTE_PREVIEW_LENGTH && (
                      <button
                        onClick={() => toggleExpandedNote(entry.id)}
                        className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                      >
                        {expandedNotes[entry.id] ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  )
}

export default MoodTracker
