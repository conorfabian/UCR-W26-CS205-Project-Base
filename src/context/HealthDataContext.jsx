import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'

const HealthDataContext = createContext()
const DEFAULT_WATER_GOAL_OZ = 64

function normalizeGoalValue(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.round(parsed)
}

function normalizeDataShape(data = {}) {
  return {
    moodEntries: Array.isArray(data.moodEntries) ? data.moodEntries : [],
    sleepEntries: Array.isArray(data.sleepEntries) ? data.sleepEntries : [],
    waterEntries: Array.isArray(data.waterEntries) ? data.waterEntries : [],
    exerciseEntries: Array.isArray(data.exerciseEntries) ? data.exerciseEntries : [],
    goals: {
      waterDailyGoalOz: normalizeGoalValue(data?.goals?.waterDailyGoalOz, DEFAULT_WATER_GOAL_OZ),
    },
  }
}

function getLatestEntryId(data) {
  const ids = [
    ...(data.moodEntries || []),
    ...(data.sleepEntries || []),
    ...(data.waterEntries || []),
    ...(data.exerciseEntries || []),
  ]
    .map((entry) => Number(entry?.id))
    .filter((id) => Number.isFinite(id))

  if (ids.length === 0) return null
  return Math.max(...ids)
}

export function HealthDataProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState([])
  const [sleepEntries, setSleepEntries] = useState([])
  const [waterEntries, setWaterEntries] = useState([])
  const [exerciseEntries, setExerciseEntries] = useState([])
  const [goals, setGoals] = useState({ waterDailyGoalOz: DEFAULT_WATER_GOAL_OZ })
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none') // 'none', 'saving', 'saved', 'error'
  const fileHandleRef = useRef(null)

  const getCurrentData = () => ({
    moodEntries,
    sleepEntries,
    waterEntries,
    exerciseEntries,
    goals,
  })

  const setAllData = (data) => {
    const normalized = Array.isArray(data)
      ? normalizeDataShape({ moodEntries: data })
      : normalizeDataShape(data)

    setMoodEntries(normalized.moodEntries)
    setSleepEntries(normalized.sleepEntries)
    setWaterEntries(normalized.waterEntries)
    setExerciseEntries(normalized.exerciseEntries)
    setGoals(normalized.goals)
  }

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      // Load from localStorage first
      const loaded = loadData()
      setAllData(loaded)
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
          if (fileData && typeof fileData === 'object') {
            const normalizedFileData = normalizeDataShape(fileData)
            const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
            const latestStorageEntryId = getLatestEntryId(loaded)
            const storageDate = latestStorageEntryId ? new Date(latestStorageEntryId) : null

            if (!storageDate || (fileDate && fileDate > storageDate)) {
              setAllData(normalizedFileData)
              saveData(normalizedFileData)
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
            ...loaded,
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
      const data = getCurrentData()
      saveData(data)
      saveToFile(data)
    }
  }, [moodEntries, sleepEntries, waterEntries, exerciseEntries, goals, isLoaded])

  async function saveToFile(dataOverride = null) {
    const handle = fileHandleRef.current
    if (!handle) return

    const data = dataOverride || getCurrentData()

    setFileStatus('saving')
    const success = await writeFile(handle, {
      ...data,
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
      await saveToFile(getCurrentData())
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
      if (data && typeof data === 'object') {
        const normalized = normalizeDataShape(data)
        setAllData(normalized)
        saveData(normalized)
        return true
      }
    }
    return false
  }

  const addMoodEntry = (entry) => {
    setMoodEntries((current) => [...current, entry])
  }

  const deleteMoodEntry = (id) => {
    setMoodEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const addSleepEntry = (entry) => {
    setSleepEntries((current) => [...current, entry])
  }

  const deleteSleepEntry = (id) => {
    setSleepEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const addWaterEntry = (entry) => {
    setWaterEntries((current) => [...current, entry])
  }

  const deleteWaterEntry = (id) => {
    setWaterEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const addExerciseEntry = (entry) => {
    setExerciseEntries((current) => [...current, entry])
  }

  const deleteExerciseEntry = (id) => {
    setExerciseEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const setWaterGoal = (goalOz) => {
    const parsedGoal = Number(goalOz)
    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) return false

    setGoals((current) => ({
      ...current,
      waterDailyGoalOz: Math.round(parsedGoal),
    }))
    return true
  }

  const exportData = () => {
    const data = {
      ...getCurrentData(),
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      const hasKnownField = data && typeof data === 'object' && (
        Object.prototype.hasOwnProperty.call(data, 'moodEntries')
        || Object.prototype.hasOwnProperty.call(data, 'sleepEntries')
        || Object.prototype.hasOwnProperty.call(data, 'waterEntries')
        || Object.prototype.hasOwnProperty.call(data, 'exerciseEntries')
        || Object.prototype.hasOwnProperty.call(data, 'goals')
      )

      if (hasKnownField) {
        setAllData(data)
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
        waterEntries,
        exerciseEntries,
        goals,
        addMoodEntry,
        deleteMoodEntry,
        addSleepEntry,
        deleteSleepEntry,
        addWaterEntry,
        deleteWaterEntry,
        addExerciseEntry,
        deleteExerciseEntry,
        setWaterGoal,
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
