import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { getTodayFormatted } from '../utils/helpers'

function DailyGraph() {
  const { moodEntries } = useHealthData()
  const rootStyles = getComputedStyle(document.documentElement)
  const chartGridColor = rootStyles.getPropertyValue('--chart-grid-color').trim()
  const chartAxisColor = rootStyles.getPropertyValue('--chart-axis-color').trim()
  const chartTooltipBackground = rootStyles.getPropertyValue('--chart-tooltip-bg').trim()
  const chartTooltipBorder = rootStyles.getPropertyValue('--chart-tooltip-border').trim()
  const chartTooltipText = rootStyles.getPropertyValue('--chart-tooltip-text').trim()
  const chartLineColor = rootStyles.getPropertyValue('--chart-line-color').trim()

  const dailyData = useMemo(() => {
    const todayStr = getTodayFormatted()

    const todayMoods = moodEntries
      .filter(entry => entry.date === todayStr)
      .map(entry => ({
        time: entry.time,
        mood: entry.mood,
      }))

    if (todayMoods.length === 0) {
      return []
    }

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours, 10)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      return hour * 60 + parseInt(minutes || 0, 10)
    }

    return [...todayMoods].sort((a, b) => parseTime(a.time) - parseTime(b.time))
  }, [moodEntries])

  const todayStr = getTodayFormatted()
  const hasTodayData = dailyData.length > 0

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Today&apos;s Mood</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">{todayStr}</p>
      {!hasTodayData && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-yellow-700 dark:text-amber-300">
            No moods logged for today yet. Record how you feel to see it here.
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dailyData}>
          <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: chartTooltipBackground,
              borderColor: chartTooltipBorder,
              color: chartTooltipText,
            }}
            labelStyle={{ color: chartTooltipText }}
            itemStyle={{ color: chartTooltipText }}
          />
          <Line type="monotone" dataKey="mood" stroke={chartLineColor} strokeWidth={2} name="Mood (1–5)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyGraph
