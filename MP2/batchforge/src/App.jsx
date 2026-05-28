import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import RightPanel from './components/RightPanel'
import Toasts from './components/Toasts'
import ResultsModal from './components/ResultsModal'

export default function App() {
  return (
    <div
      className="h-screen flex text-base-content overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #d6e7f5 0%, #e4eef9 45%, #d2e6f4 100%)' }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <Canvas />
        <StatusBar />
      </main>
      <RightPanel />
      <Toasts />
      <ResultsModal />
    </div>
  )
}
