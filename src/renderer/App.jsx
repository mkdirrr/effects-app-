import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { usePlugins } from '../hooks/usePlugins'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import PluginGrid from './PluginGrid'
import SplashScreen from './SplashScreen'
import DetailPanel from './DetailPanel'
import GeminiAgent from './GeminiAgent'
import CommandPalette from './CommandPalette'

export default function App() {
  const {
    plugins,
    categories,
    totalCount,
    scannedPaths,
    scanDate,
    loading,
    scanning,
    rescan
  } = usePlugins()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [selectedPlugin, setSelectedPlugin] = useState(null)

  // V6 state
  const [chatOpen, setChatOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [noteIds, setNoteIds] = useState(new Set())
  const [eliteMode, setEliteMode] = useState(false)
  const [activeModel, setActiveModel] = useState('Initializing…')

  // Load note IDs on mount and after any note change
  const refreshNoteIds = useCallback(async () => {
    try {
      const result = await window.antiGravity.getAllNoteIds()
      if (result.success) {
        setNoteIds(new Set(result.data))
      }
    } catch {
      // Silently fail
    }
  }, [])

  // Poll active model on mount
  useEffect(() => {
    const fetchModel = async () => {
      try {
        const result = await window.antiGravity.getActiveModel()
        if (result.success) {
          setActiveModel(result.data)
        }
      } catch {
        // Silently fail
      }
    }
    if (!loading) {
      fetchModel()
    }
  }, [loading])

  useEffect(() => {
    if (!loading) {
      refreshNoteIds()
    }
  }, [loading, refreshNoteIds])

  // Global Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [paletteOpen])

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    let result = plugins

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q)
      )
    }

    return result
  }, [plugins, activeCategory, search])

  // Handle "Ask AI" from Command Palette
  const handleAskAI = useCallback(() => {
    setChatOpen(true)
  }, [])

  // Callback to update active model from chat responses
  const handleModelChange = useCallback((model) => {
    if (model && model !== 'Error' && model !== 'Not configured') {
      setActiveModel(model)
    }
  }, [])

  // Show splash during initial load
  if (loading) {
    return <SplashScreen />
  }

  return (
    <>
      <TitleBar
        onToggleChat={() => setChatOpen(prev => !prev)}
        chatOpen={chatOpen}
        onOpenPalette={() => setPaletteOpen(true)}
        activeModel={activeModel}
      />
      <div className="app-layout">
        <Sidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={setActiveCategory}
          search={search}
          onSearchChange={setSearch}
          totalCount={totalCount}
          scannedPaths={scannedPaths}
          scanDate={scanDate}
        />
        <PluginGrid
          plugins={filteredPlugins}
          totalCount={totalCount}
          filteredCount={filteredPlugins.length}
          activeCategory={activeCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          scanning={scanning}
          onRescan={rescan}
          onPluginSelect={setSelectedPlugin}
          noteIds={noteIds}
        />
        <DetailPanel
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onNoteSaved={refreshNoteIds}
        />
        <GeminiAgent
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          eliteMode={eliteMode}
          onToggleElite={() => setEliteMode(prev => !prev)}
        />
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          plugins={plugins}
          onPluginSelect={(plugin) => {
            setSelectedPlugin(plugin)
            setPaletteOpen(false)
          }}
          onAskAI={handleAskAI}
        />
      </div>
    </>
  )
}
