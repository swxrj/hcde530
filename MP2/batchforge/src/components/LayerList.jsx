import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

const INDENT = 12
const ROW_BASE_LEFT = 9

function selectedStyle(isSelected) {
  return isSelected
    ? {
        background: 'rgba(14,165,233,0.1)',
        border: '1px solid rgba(14,165,233,0.22)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.55) inset, 0 3px 10px rgba(14,165,233,0.15), 0 1px 3px rgba(14,165,233,0.1)',
      }
    : {}
}

function nodeNameMatches(node, q) {
  if (!q) return false
  return `${node.name ?? ''} ${node.rawId ?? ''}`.toLowerCase().includes(q)
}

function hasVisibilityRule(node, visibilityRules) {
  const rule = node.rawId ? visibilityRules[node.rawId] : null
  return Boolean(rule && rule.mode !== 'always')
}

function elementTypeBadgeStyle(elementType) {
  if (elementType === 'text') {
    return { background: 'rgba(14,165,233,0.1)', color: 'rgba(14,165,233,0.8)' }
  }
  if (elementType === 'image') {
    return { background: 'var(--image-bg)', color: 'var(--image-strong)' }
  }
  return { background: 'rgba(249,115,22,0.1)', color: 'rgba(234,88,12,0.8)' }
}

function layerIsMapped(node, mapping, visibilityRules) {
  const m = node.rawId ? mapping[node.rawId] : null
  return m?.source === 'csv' || m?.source === 'manual' || hasVisibilityRule(node, visibilityRules)
}

function layerMatches(node, mapping, visibilityRules, filter, q) {
  if (node.kind !== 'layer') return false

  const searchable = `${node.name ?? ''} ${node.rawId ?? ''}`.toLowerCase()
  const isMapped = layerIsMapped(node, mapping, visibilityRules)

  if (filter === 'all' && q && !searchable.includes(q)) return false
  if (filter === 'text' && node.elementType !== 'text') return false
  if (filter === 'color' && node.elementType !== 'color') return false
  if (filter === 'image' && node.elementType !== 'image') return false
  if (filter === 'mapped' && !isMapped) return false
  if (filter !== 'all' && q && !searchable.includes(q)) return false

  return true
}

function filterForNode(node, mapping, visibilityRules) {
  if (!node || node.kind !== 'layer') return 'all'
  if (node.elementType === 'image') return 'image'
  if (node.elementType === 'text') return 'text'
  if (node.elementType === 'color') return 'color'
  if (layerIsMapped(node, mapping, visibilityRules)) return 'mapped'
  return 'all'
}

function filterTree(nodes, mapping, visibilityRules, filter, q) {
  return nodes.reduce((acc, node) => {
    if (node.kind === 'layer') {
      const matches = layerMatches(node, mapping, visibilityRules, filter, q)
      const filteredChildren = filterTree(node.children ?? [], mapping, visibilityRules, filter, q)

      if (matches || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren })
      }
      return acc
    }

    const searchable = `${node.name ?? ''} ${node.rawId ?? ''}`.toLowerCase()
    const groupMatches = q && searchable.includes(q)
    const groupHasRule = hasVisibilityRule(node, visibilityRules)
    const mappedGroupMatches = filter === 'mapped' && groupHasRule && (!q || groupMatches)
    const filteredChildren = filterTree(node.children ?? [], mapping, visibilityRules, filter, q)

    if (mappedGroupMatches || filteredChildren.length > 0 || (filter === 'all' && (!q || groupMatches))) {
      acc.push({ ...node, children: filteredChildren })
    }

    return acc
  }, [])
}

function countNodes(node) {
  if (!node.children?.length) return 0
  return node.children.reduce((total, child) => total + 1 + countNodes(child), 0)
}

function findAncestorIds(nodes, targetNodeId, path = []) {
  for (const node of nodes) {
    if (node.nodeId === targetNodeId) return path

    const match = findAncestorIds(node.children ?? [], targetNodeId, [...path, node.nodeId])
    if (match) return match
  }

  return null
}

function findNode(nodes, targetNodeId) {
  for (const node of nodes) {
    if (node.nodeId === targetNodeId) return node

    const match = findNode(node.children ?? [], targetNodeId)
    if (match) return match
  }

  return null
}

function BranchGuides({ depth, ancestorLast = [], isLast }) {
  if (depth === 0) return null

  return (
    <div className="absolute inset-y-0 left-0 pointer-events-none">
      {ancestorLast.map((last, index) => (
        !last && (
          <span
            key={index}
            className="absolute top-0 bottom-0 w-px bf-tree-line"
            style={{ left: ROW_BASE_LEFT + index * INDENT }}
          />
        )
      ))}
      <span
        className="absolute top-0 w-px bf-tree-line"
        style={{
          left: ROW_BASE_LEFT + (depth - 1) * INDENT,
          height: isLast ? '50%' : '100%',
        }}
      />
      <span
        className="absolute h-px bf-tree-line"
        style={{
          left: ROW_BASE_LEFT + (depth - 1) * INDENT,
          top: '50%',
          width: 11,
        }}
      />
    </div>
  )
}

function GroupRow({ node, depth, expanded, onToggle, ancestorLast, isLast, registerNode, query }) {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectNode = useStore((s) => s.selectNode)

  const isOpen = expanded[node.nodeId] === true
  const selectionVisible = !query
  const isSelected = selectionVisible && selectedNodeId === node.nodeId
  const isSearchMatch = nodeNameMatches(node, query)
  const left = depth * INDENT

  return (
    <div ref={(el) => registerNode(node.nodeId, el)} className="relative">
      <BranchGuides depth={depth} ancestorLast={ancestorLast} isLast={isLast} />
      <button
        type="button"
        onClick={() => selectNode(node.nodeId, null)}
        title={node.rawId || node.name}
        className="w-full flex items-center gap-1.5 py-0.5 cursor-pointer select-none"
        style={{ paddingLeft: left, color: isSelected ? 'rgb(14,165,233)' : 'rgba(26,43,74,0.62)' }}
      >
        <svg
          className="w-4 h-7 shrink-0 transition-transform"
          onClick={(e) => {
            e.stopPropagation()
            onToggle(node.nodeId)
          }}
          style={{
            color: 'rgba(26,43,74,0.35)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span
          className="min-w-0 flex-1 flex items-center gap-2 px-2 py-2 rounded-xl bf-layer-item"
          style={selectedStyle(isSelected || isSearchMatch)}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: 'rgba(26,43,74,0.34)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
          </svg>

          <span className="truncate flex-1 text-[13px] font-semibold text-left">
            {node.name}
          </span>

          <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--ink-35)' }}>
            {countNodes(node)}
          </span>
        </span>
      </button>
    </div>
  )
}

function LayerRow({ node, depth, expanded, onToggle, ancestorLast, isLast, registerNode, query }) {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectNode = useStore((s) => s.selectNode)
  const mapping = useStore((s) => s.mapping)

  const m = node.rawId ? mapping[node.rawId] : null
  const isMapped = m?.source === 'csv' || m?.source === 'manual'
  const selectionVisible = !query
  const isSelected = selectionVisible && selectedNodeId === node.nodeId
  const isSearchMatch = nodeNameMatches(node, query)
  const label = node.name ?? node.rawId ?? node.tag
  const hasChildren = node.children?.length > 0
  const isOpen = expanded[node.nodeId] === true
  const left = depth * INDENT

  return (
    <div ref={(el) => registerNode(node.nodeId, el)} className="relative">
      <BranchGuides depth={depth} ancestorLast={ancestorLast} isLast={isLast} />
      <div
        onClick={() => selectNode(
          node.nodeId,
          node.rawId && (node.editable || node.elementType === 'image') ? node.rawId : null,
        )}
        title={node.rawId || label}
        className="flex items-center gap-1.5 py-0.5 cursor-pointer select-none"
        style={{ paddingLeft: left, color: 'rgba(26,43,74,0.65)' }}
      >
        {hasChildren ? (
          <svg
            className="w-4 h-7 shrink-0 transition-transform"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.nodeId)
            }}
            style={{
              color: 'rgba(26,43,74,0.35)',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span
          className="min-w-0 flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-xl bf-layer-item"
          style={selectedStyle(isSelected || isSearchMatch)}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
            style={{
              background: isMapped
                ? 'rgb(34,197,94)'
                : node.elementType === 'image'
                  ? 'var(--image)'
                  : 'rgba(26,43,74,0.15)',
            }}
          />

          <span
            className="truncate flex-1 text-[13px] font-medium"
            style={{ color: (isSelected || isSearchMatch) ? 'rgb(14,165,233)' : undefined }}
          >
            {label}
          </span>

          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold shrink-0"
            style={elementTypeBadgeStyle(node.elementType)}
          >
            {node.elementType === 'image' ? 'image' : node.elementType}
          </span>
        </span>
      </div>
    </div>
  )
}

function TreeNodes({ nodes, depth, expanded, onToggle, registerNode, forceOpen, query, ancestorLast = [] }) {
  return nodes.map((node, index) => {
    const isLast = index === nodes.length - 1

    if (node.kind === 'layer') {
      const isOpen = forceOpen || expanded[node.nodeId] === true

      return (
        <div key={node.nodeId}>
          <LayerRow
            node={node}
            depth={depth}
            expanded={expanded}
            onToggle={onToggle}
            ancestorLast={ancestorLast}
            isLast={isLast}
            registerNode={registerNode}
            query={query}
          />
          {isOpen && node.children?.length > 0 && (
            <TreeNodes
              nodes={node.children}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              registerNode={registerNode}
              forceOpen={forceOpen}
              query={query}
              ancestorLast={[...ancestorLast, isLast]}
            />
          )}
        </div>
      )
    }

    const isOpen = forceOpen || expanded[node.nodeId] === true

    return (
      <div key={node.nodeId}>
        <GroupRow
          node={node}
          depth={depth}
          expanded={expanded}
          onToggle={onToggle}
          ancestorLast={ancestorLast}
          isLast={isLast}
          registerNode={registerNode}
          query={query}
        />
        {isOpen && node.children.length > 0 && (
          <TreeNodes
            nodes={node.children}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            registerNode={registerNode}
            forceOpen={forceOpen}
            query={query}
            ancestorLast={[...ancestorLast, isLast]}
          />
        )}
      </div>
    )
  })
}

export default function LayerList({ search = '', filter = 'all', onFilterChange }) {
  const layerTree = useStore((s) => s.layerTree)
  const mapping = useStore((s) => s.mapping)
  const visibilityRules = useStore((s) => s.visibilityRules)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectionTick = useStore((s) => s.selectionTick)
  const [expanded, setExpanded] = useState({})
  const rowRefs = useRef(new Map())

  const q = search.toLowerCase().trim()
  const forceOpen = q.length > 0
  const filterRef = useRef(filter)
  filterRef.current = filter
  const visible = useMemo(
    () => filterTree(layerTree, mapping, visibilityRules, filter, q),
    [layerTree, mapping, visibilityRules, filter, q],
  )

  useLayoutEffect(() => {
    if (!selectedNodeId || !onFilterChange) return

    const node = findNode(layerTree, selectedNodeId)
    if (!node || node.kind !== 'layer') return
    if (layerMatches(node, mapping, visibilityRules, filterRef.current, q)) return

    onFilterChange(filterForNode(node, mapping, visibilityRules))
  }, [selectedNodeId, selectionTick, layerTree, mapping, visibilityRules, q, onFilterChange])

  useEffect(() => {
    if (!selectedNodeId) return

    const ancestors = findAncestorIds(layerTree, selectedNodeId)
    if (!ancestors?.length) return

    setExpanded((current) => {
      let changed = false
      const next = { ...current }

      ancestors.forEach((nodeId) => {
        if (next[nodeId] !== true) {
          next[nodeId] = true
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [layerTree, selectedNodeId, selectionTick])

  useEffect(() => {
    if (!selectedNodeId) return

    const frame = requestAnimationFrame(() => {
      rowRefs.current.get(selectedNodeId)?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [expanded, selectedNodeId, selectionTick, visible])

  if (layerTree.length === 0) return null

  if (visible.length === 0) {
    return (
      <p className="text-[12px] text-center py-8" style={{ color: 'var(--ink-35)' }}>
        No layers match
      </p>
    )
  }

  const handleToggle = (nodeId) => {
    setExpanded((current) => ({ ...current, [nodeId]: current[nodeId] !== true }))
  }

  const registerNode = (nodeId, el) => {
    if (el) {
      rowRefs.current.set(nodeId, el)
    } else {
      rowRefs.current.delete(nodeId)
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <TreeNodes
        nodes={visible}
        depth={0}
        expanded={expanded}
        onToggle={handleToggle}
        registerNode={registerNode}
        forceOpen={forceOpen}
        query={q}
      />
    </div>
  )
}
