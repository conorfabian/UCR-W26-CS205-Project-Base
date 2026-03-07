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

export function getMoodEntryDate(entry) {
  let parsedDate = null

  // Use the persisted display date as the canonical bucket to stay
  // consistent with DailyGraph/WeeklyGraph day grouping.
  if (typeof entry?.date === 'string') {
    parsedDate = parseUSDateString(entry.date)
  }

  if (!parsedDate && entry?.timestamp) {
    const dateFromTimestamp = new Date(entry.timestamp)
    if (!Number.isNaN(dateFromTimestamp.getTime())) {
      parsedDate = dateFromTimestamp
    }
  }

  return parsedDate
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

export function getUniqueMoodDayKeys(moodEntries = []) {
  const daySet = new Set()

  moodEntries.forEach((entry) => {
    const parsedDate = getMoodEntryDate(entry)

    if (parsedDate) {
      daySet.add(getLocalDayKey(parsedDate))
    }
  })

  return [...daySet].sort()
}

export function getDailyMoodStats(moodEntries = []) {
  const totalsByDay = {}

  moodEntries.forEach((entry) => {
    const parsedDate = getMoodEntryDate(entry)
    const mood = Number(entry?.mood)
    if (!parsedDate || !Number.isFinite(mood)) return

    const dayKey = getLocalDayKey(parsedDate)
    if (!totalsByDay[dayKey]) {
      totalsByDay[dayKey] = {
        totalMood: 0,
        entryCount: 0,
      }
    }

    const normalizedMood = Math.min(5, Math.max(1, mood))
    totalsByDay[dayKey].totalMood += normalizedMood
    totalsByDay[dayKey].entryCount += 1
  })

  const dailyStats = {}
  Object.entries(totalsByDay).forEach(([dayKey, dayTotals]) => {
    dailyStats[dayKey] = {
      entryCount: dayTotals.entryCount,
      averageMood: Number((dayTotals.totalMood / dayTotals.entryCount).toFixed(2)),
    }
  })

  return dailyStats
}

export function buildRollingHeatmapCalendar({ totalDays = 365, endDate = new Date() } = {}) {
  const safeTotalDays = Number.isFinite(totalDays) && totalDays > 0
    ? Math.floor(totalDays)
    : 365

  const rangeEndDate = toLocalMidnight(endDate)
  const rangeStartDate = toLocalMidnight(new Date(rangeEndDate))
  rangeStartDate.setDate(rangeStartDate.getDate() - (safeTotalDays - 1))

  const gridStartDate = toLocalMidnight(new Date(rangeStartDate))
  gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay())

  const gridEndDate = toLocalMidnight(new Date(rangeEndDate))
  gridEndDate.setDate(gridEndDate.getDate() + (6 - gridEndDate.getDay()))

  const days = []
  let cursor = new Date(gridStartDate)
  while (cursor <= gridEndDate) {
    const dayDate = new Date(cursor)
    const dayKey = getLocalDayKey(dayDate)
    days.push({
      dayKey,
      date: dayDate,
      inRange: dayDate >= rangeStartDate && dayDate <= rangeEndDate,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return {
    weeks,
    rangeStartKey: getLocalDayKey(rangeStartDate),
    rangeEndKey: getLocalDayKey(rangeEndDate),
  }
}
