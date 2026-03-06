import { useState } from 'react'
import { HealthDataProvider } from './context/HealthDataContext'
import MoodTracker from './modules/MoodTracker'
import DailyGraph from './components/DailyGraph'
import WeeklyGraph from './components/WeeklyGraph'
import StreakStats from './components/StreakStats'
import HistoryView from './components/HistoryView'
import FileManager from './components/FileManager'
import SleepTracker from './modules/SleepTracker'
import WaterTracker from './modules/WaterTracker'
import ExerciseTracker from './modules/ExerciseTracker'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <HealthDataProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Health &amp; Wellness Tracker
            </h1>
            <p className="text-gray-600">
              Track mood, sleep, hydration, and workouts in one place
            </p>
          </header>

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Data Management
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MoodTracker />
                <DailyGraph />
                <WeeklyGraph />
                <StreakStats />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SleepTracker />
                <WaterTracker />
                <ExerciseTracker />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView />
          )}

          {activeTab === 'data' && (
            <FileManager />
          )}
        </div>
      </div>
    </HealthDataProvider>
  )
}

export default App
