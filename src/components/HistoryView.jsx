import { useMemo, useState } from 'react'
import { MAX_NOTE_LENGTH, useHealthData } from '../context/HealthDataContext'

function HistoryView() {
  const { moodEntries, deleteMoodEntry, updateMoodEntryNote } = useHealthData()
  const [expandedNotes, setExpandedNotes] = useState({})
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editingNote, setEditingNote] = useState('')
  const NOTE_PREVIEW_LENGTH = 120

  const sortedEntries = useMemo(() => {
    return [...moodEntries].sort((a, b) => b.id - a.id)
  }, [moodEntries])

  const groupedByDate = useMemo(() => {
    const grouped = {}
    sortedEntries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    return grouped
  }, [sortedEntries])

  const toggleExpandedNote = (entryId) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }))
  }

  const startEditingNote = (entry) => {
    setEditingEntryId(entry.id)
    setEditingNote(entry.note || '')
  }

  const cancelEditingNote = () => {
    setEditingEntryId(null)
    setEditingNote('')
  }

  const saveEditingNote = () => {
    if (!editingEntryId) return
    updateMoodEntryNote(editingEntryId, editingNote)
    cancelEditingNote()
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mood History</h2>
      
      {Object.keys(groupedByDate).length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No history yet. Start logging your mood to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, entries]) => (
              <div key={date} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">{date}</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">
                            Mood: {entry.mood}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            • {entry.time}
                          </span>
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

                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                        {editingEntryId === entry.id ? (
                          <>
                            <label htmlFor={`note-${entry.id}`} className="block text-xs font-medium text-gray-600 mb-1">
                              Edit note
                            </label>
                            <textarea
                              id={`note-${entry.id}`}
                              value={editingNote}
                              maxLength={MAX_NOTE_LENGTH}
                              onChange={(event) => setEditingNote(event.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              rows="4"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {editingNote.length}/{MAX_NOTE_LENGTH}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={saveEditingNote}
                                className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingNote}
                                className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {entry.note ? (
                              <>
                                <p className="text-xs font-medium text-gray-600 mb-1">Note</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                  {expandedNotes[entry.id] || entry.note.length <= NOTE_PREVIEW_LENGTH
                                    ? entry.note
                                    : `${entry.note.slice(0, NOTE_PREVIEW_LENGTH)}...`}
                                </p>
                                <div className="flex gap-3 mt-2">
                                  {entry.note.length > NOTE_PREVIEW_LENGTH && (
                                    <button
                                      onClick={() => toggleExpandedNote(entry.id)}
                                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                    >
                                      {expandedNotes[entry.id] ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => startEditingNote(entry)}
                                    className="text-xs font-medium text-gray-600 hover:text-gray-800"
                                  >
                                    Edit note
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-gray-500">No note for this entry.</p>
                                <button
                                  onClick={() => startEditingNote(entry)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  Add note
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default HistoryView
