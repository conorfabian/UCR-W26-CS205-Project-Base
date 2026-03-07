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
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-slate-100">Mood History</h2>
      
      {Object.keys(groupedByDate).length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-slate-400">
          No history yet. Start logging your mood to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, entries]) => (
              <div key={date} className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-slate-700">
                <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-slate-200">{date}</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 dark:text-slate-100">
                            Mood: {entry.mood}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-slate-300">
                            • {entry.time}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this mood entry?')) {
                              deleteMoodEntry(entry.id)
                            }
                          }}
                          className="ml-4 rounded px-2 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950/50 dark:hover:text-red-200"
                          title="Delete this entry"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
                        {editingEntryId === entry.id ? (
                          <>
                            <label htmlFor={`note-${entry.id}`} className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                              Edit note
                            </label>
                            <textarea
                              id={`note-${entry.id}`}
                              value={editingNote}
                              maxLength={MAX_NOTE_LENGTH}
                              onChange={(event) => setEditingNote(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                              rows="4"
                            />
                            <p className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">
                              {editingNote.length}/{MAX_NOTE_LENGTH}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={saveEditingNote}
                                className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingNote}
                                className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {entry.note ? (
                              <>
                                <p className="mb-1 text-xs font-medium text-gray-600 dark:text-slate-300">Note</p>
                                <p className="break-words whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-200">
                                  {expandedNotes[entry.id] || entry.note.length <= NOTE_PREVIEW_LENGTH
                                    ? entry.note
                                    : `${entry.note.slice(0, NOTE_PREVIEW_LENGTH)}...`}
                                </p>
                                <div className="flex gap-3 mt-2">
                                  {entry.note.length > NOTE_PREVIEW_LENGTH && (
                                    <button
                                      onClick={() => toggleExpandedNote(entry.id)}
                                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                                    >
                                      {expandedNotes[entry.id] ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => startEditingNote(entry)}
                                    className="text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-slate-100"
                                  >
                                    Edit note
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-gray-500 dark:text-slate-300">No note for this entry.</p>
                                <button
                                  onClick={() => startEditingNote(entry)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
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
