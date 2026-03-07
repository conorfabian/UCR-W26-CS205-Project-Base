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
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">Streaks &amp; Goals</h3>

      {stats.totalLoggedDays === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-100">No streak yet</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">
            Log your first mood entry to start tracking streaks and weekly goals.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/40">
              <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Current streak</p>
              <p className="mt-1 text-3xl font-bold text-indigo-800 dark:text-indigo-200">{stats.currentStreak}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">day{stats.currentStreak === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/40">
              <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">Longest streak</p>
              <p className="mt-1 text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.longestStreak}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">day{stats.longestStreak === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-slate-200">Weekly goal</span>
              <span className="text-gray-600 dark:text-slate-300">{stats.loggedDaysThisWeek}/{GOAL_DAYS_PER_WEEK} days</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <div
                className="h-full bg-green-500 transition-all dark:bg-emerald-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-slate-300">
              {remainingDays === 0
                ? 'Goal met for this week.'
                : `Need ${remainingDays} more day${remainingDays === 1 ? '' : 's'} this week.`}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-600 dark:bg-slate-700/40">
            {stats.hasLoggedToday && (
              <p className="text-sm font-medium text-green-700 dark:text-emerald-300">Logged today. Streak extended.</p>
            )}
            {!stats.hasLoggedToday && stats.isStreakAlive && (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Streak is alive. Log today to keep it going.
              </p>
            )}
            {!stats.hasLoggedToday && !stats.isStreakAlive && (
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
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
