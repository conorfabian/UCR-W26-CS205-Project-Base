import { useState, useRef, useEffect } from 'react'
import { useHealthData } from '../context/HealthDataContext'

function FileManager() {
  const { exportData, importData, setupFileHandle, loadFromFile, fileHandle, fileStatus } = useHealthData()
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (fileStatus === 'saved') {
      setTimeout(() => setImportSuccess(false), 2000)
    }
  }, [fileStatus])

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-tracking-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        setImportText(content)
        handleImport(content)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = (jsonString = importText) => {
    setImportError('')
    setImportSuccess(false)
    
    if (!jsonString.trim()) {
      setImportError('Please provide JSON data')
      return
    }

    const success = importData(jsonString)
    if (success) {
      setImportSuccess(true)
      setImportText('')
      setTimeout(() => setImportSuccess(false), 3000)
    } else {
      setImportError('Invalid data format. Please check your JSON structure.')
    }
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      importData(JSON.stringify({ moodEntries: [] }))
      setImportText('')
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 3000)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
      <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">
        Data Management
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-slate-200">Auto-Save Status</h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-slate-300">
            Data is automatically saved to a file whenever you make changes.
          </p>
          {fileHandle ? (
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="text-sm text-green-700 dark:text-emerald-300">
                <strong>Auto-save enabled:</strong> {fileHandle.name || 'File selected'}
              </p>
              {fileStatus === 'saving' && (
                <p className="mt-1 text-xs text-green-600 dark:text-emerald-300">Saving...</p>
              )}
              {fileStatus === 'saved' && (
                <p className="mt-1 text-xs text-green-600 dark:text-emerald-300">Saved successfully!</p>
              )}
              {fileStatus === 'error' && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-300">Error saving to file</p>
              )}
            </div>
          ) : (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                File will be set up automatically on first use. Your data is saved to browser storage.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const success = await setupFileHandle()
                if (success) {
                  setImportSuccess(true)
                  setTimeout(() => setImportSuccess(false), 3000)
                }
              }}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {fileHandle ? 'Change File Location' : 'Set Up File Now'}
            </button>
            <button
              onClick={async () => {
                const success = await loadFromFile()
                if (success) {
                  setImportSuccess(true)
                  setTimeout(() => setImportSuccess(false), 3000)
                }
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load from File
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
          <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-slate-200">Manual Export</h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-slate-300">
            Download your data (including mood notes) as a JSON file that you can edit directly
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Export to JSON File
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
          <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-slate-200">Import Data</h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-slate-300">
            Load data from a JSON file or paste JSON directly
          </p>
          
          <div className="mb-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              Select JSON File
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="importText" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Or paste JSON data here:
            </label>
            <textarea
              id="importText"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"moodEntries": [{"mood": 4, "note": "..." }] }'
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              rows="8"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleImport()}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Import Data
            </button>
            <button
              onClick={handleClear}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Clear All Data
            </button>
          </div>

          {importError && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
              <p className="text-sm text-red-600 dark:text-red-300">{importError}</p>
            </div>
          )}

          {importSuccess && (
            <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="text-sm text-green-600 dark:text-emerald-300">Data imported successfully!</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
          <h3 className="mb-2 text-lg font-medium text-gray-700 dark:text-slate-200">Data Format</h3>
          <p className="mb-2 text-xs text-gray-600 dark:text-slate-300">
            Your JSON file should follow this structure:
          </p>
          <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs dark:bg-slate-900 dark:text-slate-200">
{`{
  "moodEntries": [
    {
      "id": 1234567890,
      "mood": 4,
      "timestamp": "2024-01-15T12:00:00.000Z",
      "time": "12:00 PM",
      "date": "1/15/2024",
      "note": "Optional free-form journal note"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default FileManager
