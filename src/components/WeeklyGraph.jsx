import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'

function getChartColors() {
  const rootStyles = getComputedStyle(document.documentElement)

  return {
    gridColor: rootStyles.getPropertyValue('--chart-grid-color').trim(),
    axisColor: rootStyles.getPropertyValue('--chart-axis-color').trim(),
    tooltipBackground: rootStyles.getPropertyValue('--chart-tooltip-bg').trim(),
    tooltipBorder: rootStyles.getPropertyValue('--chart-tooltip-border').trim(),
    tooltipText: rootStyles.getPropertyValue('--chart-tooltip-text').trim(),
    barColor: rootStyles.getPropertyValue('--chart-bar-color').trim(),
  }
}

function WeeklyGraph() {
  const { moodEntries } = useHealthData()
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
          <CartesianGrid stroke={chartColors.gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke={chartColors.axisColor} tick={{ fill: chartColors.axisColor }} />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
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
          />
          <Bar dataKey="averageMood" fill={chartColors.barColor} name="Average Mood (1-5)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyGraph
