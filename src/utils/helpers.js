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

    if (parsedDate) {
      daySet.add(getLocalDayKey(parsedDate))
    }
  })

  return [...daySet].sort()
}
