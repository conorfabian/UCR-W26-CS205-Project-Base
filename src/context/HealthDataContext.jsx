import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'

const HealthDataContext = createContext()
export const MAX_NOTE_LENGTH = 500

function normalizeNote(note) {
  if (typeof note !== 'string') return ''
  const trimmedNote = note.trim()
  if (!trimmedNote) return ''
  return trimmedNote.slice(0, MAX_NOTE_LENGTH)
}

function normalizeMoodEntry(entry) {
  return {
    ...entry,
    note: normalizeNote(entry?.note),
  }
}

function normalizeMoodEntries(entries) {
  if (!Array.isArray(entries)) return []
  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => normalizeMoodEntry(entry))
}

export function HealthDataProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none') // 'none', 'saving', 'saved', 'error'
  const fileHandleRef = useRef(null)

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      // Load from localStorage first
      const loaded = loadData()
      const normalizedLoadedEntries = normalizeMoodEntries(loaded.moodEntries)
      setMoodEntries(normalizedLoadedEntries)
      setIsLoaded(true)
      
      // Try to set up file auto-save
      const handleInfo = getFileHandleInfo()
      if (handleInfo && 'showOpenFilePicker' in window) {
        const handle = await openFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          
          // Load data from file if it's newer
          const fileData = await readFile(handle)
          if (fileData?.moodEntries) {
            const normalizedFileEntries = normalizeMoodEntries(fileData.moodEntries)
            const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
            const storageDate = normalizedLoadedEntries.length > 0
              ? new Date(Math.max(...normalizedLoadedEntries.map((entry) => entry.id)))
              : null
            
            if (!storageDate || (fileDate && fileDate > storageDate)) {
              setMoodEntries(normalizedFileEntries)
              saveData(normalizedFileEntries)
            }
          }
        }
      } else {
        // Auto-setup file on first use
        const handle = await createFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          saveFileHandleInfo(handle)
          await writeFile(handle, {
            moodEntries: normalizedLoadedEntries,
            lastSaved: new Date().toISOString()
          })
        }
      }
    }
    
    initialize()
  }, [])

  // Auto-save to localStorage and file when data changes
  useEffect(() => {
    if (isLoaded) {
      saveData(moodEntries)
      saveToFile()
    }
  }, [moodEntries, isLoaded])

  async function saveToFile() {
    const handle = fileHandleRef.current
    if (!handle) return

    setFileStatus('saving')
    const success = await writeFile(handle, {
      moodEntries,
      lastSaved: new Date().toISOString()
    })
    
    if (success) {
      setFileStatus('saved')
      setTimeout(() => setFileStatus('none'), 2000)
    } else {
      setFileStatus('error')
      setTimeout(() => setFileStatus('none'), 3000)
    }
  }

  async function setupFileHandle() {
    const handle = await createFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      await saveToFile()
      return true
    }
    return false
  }

  async function loadFromFile() {
    const handle = await openFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      
      const data = await readFile(handle)
      if (data?.moodEntries) {
        const normalizedEntries = normalizeMoodEntries(data.moodEntries)
        setMoodEntries(normalizedEntries)
        saveData(normalizedEntries)
        return true
      }
    }
    return false
  }

  const addMoodEntry = (entry) => {
    setMoodEntries((prevEntries) => [...prevEntries, normalizeMoodEntry(entry)])
  }

  const deleteMoodEntry = (id) => {
    setMoodEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id))
  }

  const updateMoodEntryNote = (id, note) => {
    const normalizedNote = normalizeNote(note)
    setMoodEntries((prevEntries) => prevEntries.map((entry) => (
      entry.id === id
        ? { ...entry, note: normalizedNote }
        : entry
    )))
  }

  const setAllData = (moodEntries) => {
    setMoodEntries(normalizeMoodEntries(moodEntries))
  }

  const exportData = () => {
    const data = {
      moodEntries,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.moodEntries && Array.isArray(data.moodEntries)) {
        setAllData(data.moodEntries)
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  return (
    <HealthDataContext.Provider
      value={{
        moodEntries,
        addMoodEntry,
        deleteMoodEntry,
        updateMoodEntryNote,
        exportData,
        importData,
        setAllData,
        setupFileHandle,
        loadFromFile,
        fileHandle,
        fileStatus,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider')
  }
  return context
}
