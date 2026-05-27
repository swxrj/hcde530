import { useStore } from '../store/useStore'

export default function LayerList({ search = '', filter = 'all' }) {
  const layers = useStore((s) => s.layers)
  const selectedRawId = useStore((s) => s.selectedRawId)
  const selectLayer = useStore((s) => s.selectLayer)
  const mapping = useStore((s) => s.mapping)

  if (layers.length === 0) return null

  const q = search.toLowerCase().trim()
  const visible = layers.filter((layer) => {
    const m = mapping[layer.rawId]
    const isMapped = m?.source === 'csv' || m?.source === 'manual'

    if (filter === 'text' && layer.elementType !== 'text') return false
    if (filter === 'color' && layer.elementType !== 'color') return false
    if (filter === 'mapped' && !isMapped) return false
    if (q && !layer.rawId.toLowerCase().includes(q)) return false
    return true
  })

  if (visible.length === 0) {
    return <p className="text-xs text-base-content/30 text-center py-8">No layers match</p>
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {visible.map((layer) => {
        const m = mapping[layer.rawId]
        const isMapped = m?.source === 'csv' || m?.source === 'manual'
        const isSelected = selectedRawId === layer.rawId

        return (
          <li
            key={layer.rawId}
            onClick={() => selectLayer(layer.rawId)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm select-none transition-colors ${
              isSelected
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'hover:bg-base-200 text-base-content/70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMapped ? 'bg-success' : 'bg-base-300'}`} />
            <span className="truncate flex-1 text-[13px]">{layer.rawId}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-lg font-mono font-medium ${
              layer.elementType === 'text'
                ? 'bg-blue-50 text-blue-400'
                : 'bg-orange-50 text-orange-400'
            }`}>
              {layer.elementType}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
