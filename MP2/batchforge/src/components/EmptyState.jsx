export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(26,43,74,0.04)',
          boxShadow: 'inset 0 2px 8px rgba(26,43,74,0.08), inset 0 1px 2px rgba(26,43,74,0.05)',
          border: '1px solid rgba(26,43,74,0.07)',
        }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: 'rgba(26,43,74,0.22)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </div>
      <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: 'rgba(26,43,74,0.38)' }}>
        {message}
      </p>
    </div>
  )
}
