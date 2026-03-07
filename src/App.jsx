import { useEffect, useState } from 'react'
import { HealthDataProvider } from './context/HealthDataContext'
import MoodTracker from './modules/MoodTracker'
import DailyGraph from './components/DailyGraph'
import WeeklyGraph from './components/WeeklyGraph'
import StreakStats from './components/StreakStats'
import MoodCalendarHeatmap from './components/MoodCalendarHeatmap'
import HistoryView from './components/HistoryView'
import FileManager from './components/FileManager'

const THEME_STORAGE_KEY = 'themePreference'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.8 6.8 0 1 0 10.2 10.2Z" />
    </svg>
  )
}

function getInitialTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }
  } catch (error) {
    // Ignore storage access errors and fall back to system preference.
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      } catch (error) {
        // Ignore storage access errors and still switch the in-memory theme.
      }
      return nextTheme
    })
  }

  return (
    <HealthDataProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 transition-colors dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-800 dark:text-slate-100">
                Mood Tracking App
              </h1>
              <p className="text-gray-600 dark:text-slate-300">
                Track how you feel over time with a simple 1-5 mood scale
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center self-start rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>
          </header>

          <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === 'data'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200'
                }`}
              >
                Data Management
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MoodTracker />
                <DailyGraph />
                <WeeklyGraph />
                <StreakStats />
              </div>
              <MoodCalendarHeatmap />
            </div>
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'data' && <FileManager />}
        </div>
      </div>
    </HealthDataProvider>
  )
}

export default App
