export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-primary rounded-full"
        style={{ width: `${pct}%`, transition: 'width 0.15s linear' }}
      />
    </div>
  )
}
