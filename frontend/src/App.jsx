import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-center gap-8 mb-6">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo w-20 h-20" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react w-20 h-20" alt="React logo" />
          </a>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Vite + React + Tailwind
        </h1>
        <div className="card bg-gray-50 p-4 rounded-lg mb-6">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            count is {count}
          </button>
          <p className="text-gray-600 mt-4 text-center">
            Edit <code className="bg-gray-200 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="text-center text-gray-500 hover:text-blue-600 transition-colors">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App

