import { useMemo } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import {
  differenceInDayKeys,
  getLocalDayKey,
  getUniqueMoodDayKeys,
  getWeekStartSundayKey,
} from '../utils/helpers'

const GOAL_DAYS_PER_WEEK = 5

function StreakStats() {
  const { moodEntries } = useHealthData()

  const stats = useMemo(() => {
    const uniqueDayKeys = getUniqueMoodDayKeys(moodEntries)
    const todayKey = getLocalDayKey()
    const weekStartKey = getWeekStartSundayKey()

    if (uniqueDayKeys.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        loggedDaysThisWeek: 0,
        hasLoggedToday: false,
        isStreakAlive: false,
        totalLoggedDays: 0,
      }
    }

    const latestDayKey = uniqueDayKeys[uniqueDayKeys.length - 1]
    const daysSinceLatest = differenceInDayKeys(todayKey, latestDayKey)
    const isStreakAlive = Number.isFinite(daysSinceLatest) && daysSinceLatest <= 1
    const hasLoggedToday = uniqueDayKeys.includes(todayKey)

    let currentStreak = 0
    if (isStreakAlive) {
      currentStreak = 1
      for (let i = uniqueDayKeys.length - 1; i > 0; i -= 1) {
        const gap = differenceInDayKeys(uniqueDayKeys[i], uniqueDayKeys[i - 1])
        if (gap === 1) {
          currentStreak += 1
        } else {
          break
        }
      }
    }

    let longestStreak = 1
    let runningStreak = 1
    for (let i = 1; i < uniqueDayKeys.length; i += 1) {
      const gap = differenceInDayKeys(uniqueDayKeys[i], uniqueDayKeys[i - 1])
      if (gap === 1) {
        runningStreak += 1
      } else {
        runningStreak = 1
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak
      }
    }

    const loggedDaysThisWeek = uniqueDayKeys.filter(
      (dayKey) => dayKey >= weekStartKey && dayKey <= todayKey,
    ).length

    return {
      currentStreak,
      longestStreak,
      loggedDaysThisWeek,
      hasLoggedToday,
      isStreakAlive,
      totalLoggedDays: uniqueDayKeys.length,
    }
  }, [moodEntries])

  const progressPercent = Math.min(
    100,
    Math.round((stats.loggedDaysThisWeek / GOAL_DAYS_PER_WEEK) * 100),
  )
  const remainingDays = Math.max(0, GOAL_DAYS_PER_WEEK - stats.loggedDaysThisWeek)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Streaks &amp; Goals</h3>

      {stats.totalLoggedDays === 0 ? (
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-700 font-medium">No streak yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Log your first mood entry to start tracking streaks and weekly goals.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs text-indigo-700 uppercase tracking-wide">Current streak</p>
              <p className="text-3xl font-bold text-indigo-800 mt-1">{stats.currentStreak}</p>
              <p className="text-xs text-indigo-700">day{stats.currentStreak === 1 ? '' : 's'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-700 uppercase tracking-wide">Longest streak</p>
              <p className="text-3xl font-bold text-blue-800 mt-1">{stats.longestStreak}</p>
              <p className="text-xs text-blue-700">day{stats.longestStreak === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Weekly goal</span>
              <span className="text-gray-600">{stats.loggedDaysThisWeek}/{GOAL_DAYS_PER_WEEK} days</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {remainingDays === 0
                ? 'Goal met for this week.'
                : `Need ${remainingDays} more day${remainingDays === 1 ? '' : 's'} this week.`}
            </p>
          </div>

          <div className="p-3 rounded-lg border">
            {stats.hasLoggedToday && (
              <p className="text-sm font-medium text-green-700">Logged today. Streak extended.</p>
            )}
            {!stats.hasLoggedToday && stats.isStreakAlive && (
              <p className="text-sm font-medium text-amber-700">
                Streak is alive. Log today to keep it going.
              </p>
            )}
            {!stats.hasLoggedToday && !stats.isStreakAlive && (
              <p className="text-sm font-medium text-red-700">
                Streak was broken. Log today to start a new streak.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default StreakStats
