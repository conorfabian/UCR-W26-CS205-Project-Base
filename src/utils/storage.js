const STORAGE_KEY = 'healthTrackingData'
const FILE_HANDLE_KEY = 'healthTrackingFileHandle'
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

export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return normalizeDataShape(data)
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  return normalizeDataShape()
}

export function saveData(dataOrMoodEntries) {
  try {
    const data = Array.isArray(dataOrMoodEntries)
      ? normalizeDataShape({ moodEntries: dataOrMoodEntries })
      : normalizeDataShape(dataOrMoodEntries)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function saveFileHandleInfo(fileHandle) {
  const info = { name: fileHandle.name, kind: fileHandle.kind }
  localStorage.setItem(FILE_HANDLE_KEY, JSON.stringify(info))
}

export function getFileHandleInfo() {
  try {
    const stored = localStorage.getItem(FILE_HANDLE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}
