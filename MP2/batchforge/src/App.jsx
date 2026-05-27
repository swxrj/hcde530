import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import RightPanel from './components/RightPanel'
import Toasts from './components/Toasts'
import ResultsModal from './components/ResultsModal'

export default function App() {
  return (
    <div className="h-screen flex bg-base-200 text-base-content overflow-hidden">
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
