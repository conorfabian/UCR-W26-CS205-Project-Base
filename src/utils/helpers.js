export function getTodayFormatted() {
  const today = new Date()
  return today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDayNumber(date) {
  const midnight = toLocalMidnight(date)
  return Date.UTC(midnight.getFullYear(), midnight.getMonth(), midnight.getDate()) / MS_PER_DAY
}

function parseUSDateString(dateStr) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr)
  if (!match) return null

  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

function parseTimeInput(timeString) {
  const match = /^(\d{2}):(\d{2})$/.exec(timeString || '')
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return (hours * 60) + minutes
}

export function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dayKeyToDate(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export function differenceInDayKeys(laterDayKey, earlierDayKey) {
  const later = dayKeyToDate(laterDayKey)
  const earlier = dayKeyToDate(earlierDayKey)
  if (!later || !earlier) return NaN
  return toDayNumber(later) - toDayNumber(earlier)
}

export function getWeekStartSundayKey(date = new Date()) {
  const weekStart = toLocalMidnight(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return getLocalDayKey(weekStart)
}

export function getEntryDayKey(entry) {
  if (typeof entry?.dayKey === 'string') {
    const parsedDayKeyDate = dayKeyToDate(entry.dayKey)
    if (parsedDayKeyDate) {
      return entry.dayKey
    }
  }

  if (typeof entry?.date === 'string') {
    const parsedDate = parseUSDateString(entry.date)
    if (parsedDate) {
      return getLocalDayKey(parsedDate)
    }
  }

  if (entry?.timestamp) {
    const dateFromTimestamp = new Date(entry.timestamp)
    if (!Number.isNaN(dateFromTimestamp.getTime())) {
      return getLocalDayKey(dateFromTimestamp)
    }
  }

  return null
}

export function isEntryOnDay(entry, dayKey) {
  return getEntryDayKey(entry) === dayKey
}

export function getLastNDayKeys(days = 7, endDate = new Date()) {
  const dayKeys = []
  const safeDays = Math.max(1, Math.floor(days))

  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const date = new Date(endDate)
    date.setDate(endDate.getDate() - i)
    dayKeys.push(getLocalDayKey(date))
  }

  return dayKeys
}

export function calculateSleepHours(bedtime, wakeTime) {
  const bedtimeMinutes = parseTimeInput(bedtime)
  const wakeTimeMinutes = parseTimeInput(wakeTime)
  if (bedtimeMinutes === null || wakeTimeMinutes === null) return null

  let totalMinutes = wakeTimeMinutes - bedtimeMinutes
  if (totalMinutes <= 0) {
    totalMinutes += 24 * 60
  }

  return Number((totalMinutes / 60).toFixed(2))
}

export function getUniqueMoodDayKeys(moodEntries = []) {
  const daySet = new Set()

  moodEntries.forEach((entry) => {
    const dayKey = getEntryDayKey(entry)
    if (dayKey) {
      daySet.add(dayKey)
    }
  })

  return [...daySet].sort()
}
