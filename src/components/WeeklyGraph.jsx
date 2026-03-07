import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'

function WeeklyGraph() {
  const { moodEntries } = useHealthData()
  const rootStyles = getComputedStyle(document.documentElement)
  const chartGridColor = rootStyles.getPropertyValue('--chart-grid-color').trim()
  const chartAxisColor = rootStyles.getPropertyValue('--chart-axis-color').trim()
  const chartTooltipBackground = rootStyles.getPropertyValue('--chart-tooltip-bg').trim()
  const chartTooltipBorder = rootStyles.getPropertyValue('--chart-tooltip-border').trim()
  const chartTooltipText = rootStyles.getPropertyValue('--chart-tooltip-text').trim()
  const chartBarColor = rootStyles.getPropertyValue('--chart-bar-color').trim()

  const weeklyData = useMemo(() => {
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

      const dayMoods = moodEntries.filter(entry => entry.date === dateStr)
      const avgMood =
        dayMoods.length === 0
          ? 0
          : dayMoods.reduce((sum, entry) => sum + entry.mood, 0) / dayMoods.length

      days.push({
        day: dayName,
        averageMood: Number(avgMood.toFixed(2)),
      })
    }

    return days
  }, [moodEntries])

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">Last 7 Days - Average Mood</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyData}>
          <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: chartTooltipBackground,
              borderColor: chartTooltipBorder,
              color: chartTooltipText,
            }}
            labelStyle={{ color: chartTooltipText }}
            itemStyle={{ color: chartTooltipText }}
          />
          <Bar dataKey="averageMood" fill={chartBarColor} name="Average Mood (1-5)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyGraph
