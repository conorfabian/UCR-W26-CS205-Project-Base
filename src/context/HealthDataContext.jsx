import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'

const HealthDataContext = createContext()
export const MAX_NOTE_LENGTH = 500

const TIME_24_HOUR_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
const US_DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

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

function toUSDateString(year, month, day) {
  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return ''
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeDateToUS(value) {
  if (typeof value !== 'string') return ''

  const usMatch = US_DATE_REGEX.exec(value)
  if (usMatch) {
    return toUSDateString(Number(usMatch[3]), Number(usMatch[1]), Number(usMatch[2]))
  }

  const isoMatch = ISO_DATE_REGEX.exec(value)
  if (isoMatch) {
    return toUSDateString(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

function parseTimeToMinutes(timeString) {
  if (typeof timeString !== 'string') return NaN
  const match = TIME_24_HOUR_REGEX.exec(timeString)
  if (!match) return NaN
  return Number(match[1]) * 60 + Number(match[2])
}

function calculateSleepHours(bedtime, wakeTime) {
  const bedtimeMinutes = parseTimeToMinutes(bedtime)
  const wakeMinutes = parseTimeToMinutes(wakeTime)

  if (!Number.isFinite(bedtimeMinutes) || !Number.isFinite(wakeMinutes)) {
    return NaN
  }

  const rawDiff = wakeMinutes - bedtimeMinutes
  if (rawDiff === 0) return NaN

  const minutesSlept = rawDiff < 0 ? rawDiff + 24 * 60 : rawDiff
  return Number((minutesSlept / 60).toFixed(2))
}

function normalizeSleepEntry(entry) {
  if (!entry || typeof entry !== 'object') return null

  const bedtime = typeof entry.bedtime === 'string' ? entry.bedtime : ''
  const wakeTime = typeof entry.wakeTime === 'string' ? entry.wakeTime : ''
  const hoursSlept = calculateSleepHours(bedtime, wakeTime)
  if (!Number.isFinite(hoursSlept) || hoursSlept <= 0) return null

  const quality = Number(entry.quality)
  if (!Number.isInteger(quality) || quality < 1 || quality > 5) return null

  const date = normalizeDateToUS(entry.date) || normalizeDateToUS(entry.timestamp)
  if (!date) return null

  const parsedTimestamp = new Date(entry.timestamp)
  const fallbackTimestamp = Number.isNaN(parsedTimestamp.getTime())
    ? new Date().toISOString()
    : parsedTimestamp.toISOString()

  const parsedId = Number(entry.id)
  const fallbackId = Number.isFinite(parsedTimestamp.getTime())
    ? parsedTimestamp.getTime()
    : Date.now()

  return {
    id: Number.isFinite(parsedId) ? parsedId : fallbackId,
    timestamp: fallbackTimestamp,
    date,
    bedtime,
    wakeTime,
    hoursSlept,
    quality,
  }
}

function normalizeSleepEntries(entries) {
  if (!Array.isArray(entries)) return []
  return entries
    .map((entry) => normalizeSleepEntry(entry))
    .filter(Boolean)
}

function getLatestEntryDate(moodEntries, sleepEntries) {
  const allEntryIds = [...moodEntries, ...sleepEntries]
    .map((entry) => Number(entry?.id))
    .filter((id) => Number.isFinite(id))

  if (allEntryIds.length === 0) return null
  return new Date(Math.max(...allEntryIds))
}

export function HealthDataProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState([])
  const [sleepEntries, setSleepEntries] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none') // 'none', 'saving', 'saved', 'error'
  const fileHandleRef = useRef(null)

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      // Load from localStorage first
      const loaded = loadData()
      const normalizedLoadedMoodEntries = normalizeMoodEntries(loaded.moodEntries)
      const normalizedLoadedSleepEntries = normalizeSleepEntries(loaded.sleepEntries)

      setMoodEntries(normalizedLoadedMoodEntries)
      setSleepEntries(normalizedLoadedSleepEntries)
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
          if (Array.isArray(fileData?.moodEntries)) {
            const normalizedFileMoodEntries = normalizeMoodEntries(fileData.moodEntries)
            const normalizedFileSleepEntries = normalizeSleepEntries(fileData.sleepEntries)
            const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
            const storageDate = getLatestEntryDate(normalizedLoadedMoodEntries, normalizedLoadedSleepEntries)

            if (!storageDate || (fileDate && fileDate > storageDate)) {
              setMoodEntries(normalizedFileMoodEntries)
              setSleepEntries(normalizedFileSleepEntries)
              saveData({
                moodEntries: normalizedFileMoodEntries,
                sleepEntries: normalizedFileSleepEntries,
              })
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
            moodEntries: normalizedLoadedMoodEntries,
            sleepEntries: normalizedLoadedSleepEntries,
            lastSaved: new Date().toISOString(),
          })
        }
      }
    }

    initialize()
  }, [])

  // Auto-save to localStorage and file when data changes
  useEffect(() => {
    if (isLoaded) {
      saveData({ moodEntries, sleepEntries })
      saveToFile()
    }
  }, [moodEntries, sleepEntries, isLoaded])

  async function saveToFile() {
    const handle = fileHandleRef.current
    if (!handle) return

    setFileStatus('saving')
    const success = await writeFile(handle, {
      moodEntries,
      sleepEntries,
      lastSaved: new Date().toISOString(),
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
      if (Array.isArray(data?.moodEntries)) {
        const normalizedMood = normalizeMoodEntries(data.moodEntries)
        const normalizedSleep = normalizeSleepEntries(data.sleepEntries)

        setMoodEntries(normalizedMood)
        setSleepEntries(normalizedSleep)
        saveData({ moodEntries: normalizedMood, sleepEntries: normalizedSleep })
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

  const addSleepEntry = (entry) => {
    const normalizedEntry = normalizeSleepEntry(entry)
    if (!normalizedEntry) return false

    setSleepEntries((prevEntries) => [...prevEntries, normalizedEntry])
    return true
  }

  const deleteSleepEntry = (id) => {
    setSleepEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id))
  }

  const setAllData = (nextMoodEntries, nextSleepEntries = []) => {
    setMoodEntries(normalizeMoodEntries(nextMoodEntries))
    setSleepEntries(normalizeSleepEntries(nextSleepEntries))
  }

  const exportData = () => {
    const data = {
      moodEntries,
      sleepEntries,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (Array.isArray(data.moodEntries)) {
        setAllData(data.moodEntries, data.sleepEntries)
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
        sleepEntries,
        addMoodEntry,
        deleteMoodEntry,
        updateMoodEntryNote,
        addSleepEntry,
        deleteSleepEntry,
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
