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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Mood Tracker
      </h2>
      <p className="text-gray-600 mb-4">
        Select how you&apos;re feeling and then submit. Date and time are recorded automatically.
      </p>

      <div className="flex justify-between mb-6 space-x-2">
        {[1, 2, 3, 4, 5].map((mood) => (
          <button
            key={mood}
            onClick={() => handleSelectMood(mood)}
            className={`flex-1 py-3 rounded-lg font-semibold border transition-colors ${
              selectedMood === mood
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
            }`}
          >
            <div className="text-lg">{mood}</div>
            <div
              className={`text-xs mt-1 ${
                selectedMood === mood ? 'text-white' : 'text-gray-600'
              }`}
            >
              {MOOD_LABELS[mood]}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="mood-note" className="block text-sm font-medium text-gray-700 mb-1">
          Journal note (optional)
        </label>
        <textarea
          id="mood-note"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What happened today? Any context behind this mood?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows="4"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedMood}
        className={`w-full mb-6 py-2 px-4 rounded-lg font-medium transition-colors ${
          selectedMood
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        Save how I feel
      </button>

      {latestEntry && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Last recorded mood:</p>
          <p className="text-lg font-semibold text-indigo-700">
            {latestEntry.mood} – {MOOD_LABELS[latestEntry.mood] || 'Mood'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {latestEntry.date} at {latestEntry.time}
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {moodEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No moods logged yet. Choose how you feel to get started.
          </p>
        ) : (
          [...moodEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-medium text-gray-800">
                      {entry.mood} – {MOOD_LABELS[entry.mood] || 'Mood'}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      • {entry.date} at {entry.time}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this mood entry?')) {
                        deleteMoodEntry(entry.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 font-medium text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete this entry"
                  >
                    Delete
                  </button>
                </div>
                {entry.note && (
                  <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Note</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {expandedNotes[entry.id] || entry.note.length <= NOTE_PREVIEW_LENGTH
                        ? entry.note
                        : `${entry.note.slice(0, NOTE_PREVIEW_LENGTH)}...`}
                    </p>
                    {entry.note.length > NOTE_PREVIEW_LENGTH && (
                      <button
                        onClick={() => toggleExpandedNote(entry.id)}
                        className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
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
