export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div
      className="w-full rounded-full h-1.5 overflow-hidden"
      style={{
        background: 'rgba(26,43,74,0.1)',
        boxShadow: 'inset 0 1px 3px rgba(26,43,74,0.08)',
      }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          transition: 'width 0.15s linear',
          background: 'linear-gradient(90deg, rgba(56,189,248,0.85), rgba(14,165,233,0.9))',
          boxShadow: '0 0 6px rgba(14,165,233,0.4)',
        }}
      />
    </div>
  )
}
