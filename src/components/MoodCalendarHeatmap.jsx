import { useEffect, useMemo, useRef } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { buildRollingHeatmapCalendar, getDailyMoodStats } from '../utils/helpers'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VISIBLE_DAY_ROWS = new Set([1, 3, 5])
const HEATMAP_COLORS = {
  outOfRange: '#f9fafb',
  empty: '#e5e7eb',
  1: '#fecaca',
  2: '#fdba74',
  3: '#fde68a',
  4: '#bbf7d0',
  5: '#4ade80',
}

function getMoodIntensityLevel(averageMood) {
  if (!Number.isFinite(averageMood) || averageMood < 1) return 0
  if (averageMood >= 5) return 5
  if (averageMood >= 4) return 4
  if (averageMood >= 3) return 3
  if (averageMood >= 2) return 2
  return 1
}

function buildMonthLabelMap(weeks) {
  const labels = {}

  const firstInRangeDay = weeks[0]?.find((day) => day.inRange)
  if (firstInRangeDay) {
    labels[0] = firstInRangeDay.date.toLocaleDateString('en-US', { month: 'short' })
  }

  weeks.forEach((week, weekIndex) => {
    if (weekIndex === 0) return
    const monthStartDay = week.find((day) => day.inRange && day.date.getDate() === 1)
    if (!monthStartDay) return
    labels[weekIndex] = monthStartDay.date.toLocaleDateString('en-US', { month: 'short' })
  })

  return labels
}

function MoodCalendarHeatmap() {
  const { moodEntries } = useHealthData()
  const scrollContainerRef = useRef(null)
  const autoScrolledRangeRef = useRef('')

  const { weeks, rangeStartKey, rangeEndKey } = useMemo(
    () => buildRollingHeatmapCalendar({ totalDays: 365 }),
    [],
  )

  const dailyMoodStats = useMemo(() => getDailyMoodStats(moodEntries), [moodEntries])
  const monthLabels = useMemo(() => buildMonthLabelMap(weeks), [weeks])

  const loggedDaysInRange = useMemo(
    () => Object.keys(dailyMoodStats).filter((dayKey) => dayKey >= rangeStartKey && dayKey <= rangeEndKey).length,
    [dailyMoodStats, rangeStartKey, rangeEndKey],
  )

  const rangeText = useMemo(() => {
    const firstDay = weeks.flat().find((day) => day.inRange)?.date
    const lastDay = weeks.flat().reverse().find((day) => day.inRange)?.date
    if (!firstDay || !lastDay) return ''
    return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }, [weeks])

  useEffect(() => {
    const rangeSignature = `${rangeStartKey}:${rangeEndKey}`
    if (autoScrolledRangeRef.current === rangeSignature) return

    const container = scrollContainerRef.current
    if (!container) return

    container.scrollLeft = container.scrollWidth
    autoScrolledRangeRef.current = rangeSignature
  }, [rangeStartKey, rangeEndKey])

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
      <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Mood Calendar Heatmap</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
        Daily average mood across the last 12 months ({rangeText}).
      </p>
      <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">
        Showing most recent days first. Scroll left for older dates.
      </p>

      {loggedDaysInRange === 0 && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/40">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            No mood entries in this range yet. Log your mood to start filling the calendar.
          </p>
        </div>
      )}

      <div ref={scrollContainerRef} className="overflow-x-auto pb-1">
        <div className="mx-auto w-fit min-w-max">
          <div className="ml-8 mb-2 flex h-4 gap-1 text-[11px] text-gray-500 dark:text-slate-400">
            {weeks.map((_, weekIndex) => (
              <div key={`month-${weekIndex}`} className="w-3">
                {monthLabels[weekIndex] && (
                  <span className="relative -left-1 whitespace-nowrap">{monthLabels[weekIndex]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex">
            <div className="mr-2 flex flex-col gap-1 text-[11px] text-gray-500 dark:text-slate-400">
              {DAY_LABELS.map((label, rowIndex) => (
                <span key={label} className="h-3 leading-3">
                  {VISIBLE_DAY_ROWS.has(rowIndex) ? label : ''}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const dayStats = day.inRange ? dailyMoodStats[day.dayKey] : null
                    const intensityLevel = dayStats
                      ? getMoodIntensityLevel(dayStats.averageMood)
                      : 0
                    const color = day.inRange
                      ? (dayStats ? HEATMAP_COLORS[intensityLevel] : HEATMAP_COLORS.empty)
                      : HEATMAP_COLORS.outOfRange

                    const tooltip = day.inRange
                      ? dayStats
                        ? `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\nAverage mood: ${dayStats.averageMood}/5\nEntries: ${dayStats.entryCount}`
                        : `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\nNo entries`
                      : 'Outside selected range'

                    return (
                      <div
                        key={day.dayKey}
                        title={tooltip}
                        className="h-3 w-3 rounded-sm border border-gray-200 dark:border-slate-700"
                        style={{ backgroundColor: color }}
                        aria-label={tooltip}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
          <span>Low</span>
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={`legend-${level}`}
              className="h-3 w-3 rounded-sm border border-gray-200 dark:border-slate-700"
              style={{ backgroundColor: HEATMAP_COLORS[level] }}
              aria-hidden="true"
            />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

export default MoodCalendarHeatmap
