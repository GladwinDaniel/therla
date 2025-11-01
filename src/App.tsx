import { FFCSTimeTableGenerator } from './FFCSTimeTableGenerator'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="container mx-auto py-6">
        <h1 className="text-3xl font-bold text-center text-cyan-400">FFCS Timetable Generator</h1>
        <p className="text-center text-gray-400 mt-2">Upload your course data and generate conflict-free timetables</p>
      </header>
      <main className="container mx-auto py-6">
        <FFCSTimeTableGenerator />
      </main>
      <footer className="container mx-auto py-6 mt-8 border-t border-gray-800">
        <p className="text-center text-gray-500 text-sm">© 2023 FFCS Timetable Generator</p>
      </footer>
    </div>
  )
}

export default App