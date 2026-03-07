import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'

function getChartColors() {
  const rootStyles = getComputedStyle(document.documentElement)

  return {
    gridColor: rootStyles.getPropertyValue('--chart-grid-color').trim(),
    axisColor: rootStyles.getPropertyValue('--chart-axis-color').trim(),
    tooltipBackground: rootStyles.getPropertyValue('--chart-tooltip-bg').trim(),
    tooltipBorder: rootStyles.getPropertyValue('--chart-tooltip-border').trim(),
    tooltipText: rootStyles.getPropertyValue('--chart-tooltip-text').trim(),
    lineColor: rootStyles.getPropertyValue('--chart-line-color').trim(),
  }
}

function SleepStats() {
  const { sleepEntries } = useHealthData()
  const [chartColors, setChartColors] = useState(getChartColors)

  useEffect(() => {
    const root = document.documentElement
    const syncChartColors = () => setChartColors(getChartColors())

    syncChartColors()

    const observer = new MutationObserver((mutations) => {
      const hasClassChange = mutations.some(
        (mutation) => mutation.type === 'attributes' && mutation.attributeName === 'class'
      )

      if (hasClassChange) {
        syncChartColors()
      }
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const latestEntry = useMemo(() => {
    if (sleepEntries.length === 0) return null
    return [...sleepEntries].sort((a, b) => b.id - a.id)[0]
  }, [sleepEntries])

  const { dailyData, avgHoursLast7Days, avgQualityLast7Days, loggedDays } = useMemo(() => {
    const totalsByDate = {}

    sleepEntries.forEach((entry) => {
      if (!entry?.date) return

      if (!totalsByDate[entry.date]) {
        totalsByDate[entry.date] = {
          totalHours: 0,
          totalQuality: 0,
          entryCount: 0,
        }
      }

      totalsByDate[entry.date].totalHours += Number(entry.hoursSlept) || 0
      totalsByDate[entry.date].totalQuality += Number(entry.quality) || 0
      totalsByDate[entry.date].entryCount += 1
    })

    const last7Days = []
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const dateStr = date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayTotals = totalsByDate[dateStr]

      if (!dayTotals || dayTotals.entryCount === 0) {
        last7Days.push({ day: dayName, hours: 0, quality: 0, hasData: false })
      } else {
        last7Days.push({
          day: dayName,
          hours: Number((dayTotals.totalHours / dayTotals.entryCount).toFixed(2)),
          quality: Number((dayTotals.totalQuality / dayTotals.entryCount).toFixed(2)),
          hasData: true,
        })
      }
    }

    const daysWithData = last7Days.filter((day) => day.hasData)
    const averageHours = daysWithData.length > 0
      ? Number((daysWithData.reduce((sum, day) => sum + day.hours, 0) / daysWithData.length).toFixed(2))
      : 0
    const averageQuality = daysWithData.length > 0
      ? Number((daysWithData.reduce((sum, day) => sum + day.quality, 0) / daysWithData.length).toFixed(2))
      : 0

    return {
      dailyData: last7Days,
      avgHoursLast7Days: averageHours,
      avgQualityLast7Days: averageQuality,
      loggedDays: daysWithData.length,
    }
  }, [sleepEntries])

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Sleep Insights</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">Last 7 days of sleep duration and quality.</p>

      {latestEntry ? (
        <div className="mb-4 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/40">
          <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Latest night</p>
          <p className="mt-1 text-lg font-semibold text-indigo-800 dark:text-indigo-200">
            {latestEntry.hoursSlept}h • quality {latestEntry.quality}/5
          </p>
          <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
            {latestEntry.date} ({latestEntry.bedtime} - {latestEntry.wakeTime})
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-yellow-700 dark:text-amber-300">
            No sleep entries yet. Add one to start seeing weekly insights.
          </p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
          <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">Avg sleep (7 days)</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">{avgHoursLast7Days}h</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Across {loggedDays} logged day{loggedDays === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Avg quality (7 days)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{avgQualityLast7Days}/5</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Based on logged days only</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={dailyData}>
          <CartesianGrid stroke={chartColors.gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke={chartColors.axisColor} tick={{ fill: chartColors.axisColor }} />
          <YAxis
            domain={[0, 12]}
            ticks={[0, 2, 4, 6, 8, 10, 12]}
            stroke={chartColors.axisColor}
            tick={{ fill: chartColors.axisColor }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartColors.tooltipBackground,
              borderColor: chartColors.tooltipBorder,
              color: chartColors.tooltipText,
            }}
            labelStyle={{ color: chartColors.tooltipText }}
            itemStyle={{ color: chartColors.tooltipText }}
            formatter={(value, name) => {
              if (name === 'hours') {
                return [`${value} h`, 'Average sleep']
              }
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke={chartColors.lineColor}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="hours"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SleepStats
