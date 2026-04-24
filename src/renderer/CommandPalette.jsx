import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Search, Command, ArrowRight, Globe, Sparkles, Loader, FileText, X } from 'lucide-react'

/**
 * CommandPalette — Global search overlay (Ctrl+K).
 * Searches both local plugins and the web simultaneously.
 */
export default function CommandPalette({ isOpen, onClose, plugins, onPluginSelect, onAskAI }) {
  const [query, setQuery] = useState('')
  const [webResults, setWebResults] = useState([])
  const [webLoading, setWebLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setWebResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Filter local plugins instantly
  const localResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return plugins
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fileName.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, plugins])

  // Debounced web search
  const triggerWebSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setWebResults([])
      return
    }
    setWebLoading(true)
    try {
      const result = await window.antiGravity.searchWeb(
        `After Effects ${searchQuery}`
      )
      if (result.success && result.data.results) {
        setWebResults(result.data.results.slice(0, 4))
      }
    } catch {
      setWebResults([])
    } finally {
      setWebLoading(false)
    }
  }, [])

  // Handle query changes with debounce for web search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        triggerWebSearch(query)
      }, 600)
    } else {
      setWebResults([])
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, triggerWebSearch])

  // Total items for keyboard navigation
  const totalItems = localResults.length + (query.trim() ? 1 : 0) + webResults.length // +1 for "Ask AI"

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(selectedIndex)
    }
  }

  const handleSelect = (index) => {
    // Local results come first
    if (index < localResults.length) {
      onPluginSelect(localResults[index])
      onClose()
      return
    }

    // "Ask AI" item
    const askAIIndex = localResults.length
    if (index === askAIIndex && query.trim()) {
      onAskAI(query)
      onClose()
      return
    }

    // Web results
    const webIndex = index - localResults.length - 1
    if (webIndex >= 0 && webIndex < webResults.length) {
      window.antiGravity.openExternal(webResults[webIndex].url)
      onClose()
    }
  }

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [localResults.length, webResults.length])

  if (!isOpen) return null

  return (
    <div className="command-palette__overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>

        {/* Search Input */}
        <div className="command-palette__input-area">
          <Search size={18} className="command-palette__search-icon" />
          <input
            ref={inputRef}
            className="command-palette__input"
            type="text"
            placeholder="Search plugins or ask AI…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="command-palette__shortcut">
            <kbd>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="command-palette__results">

          {/* Local Plugin Results */}
          {localResults.length > 0 && (
            <div className="command-palette__section">
              <div className="command-palette__section-title">
                <FileText size={12} />
                Installed Plugins
              </div>
              {localResults.map((plugin, i) => (
                <div
                  key={plugin.id}
                  className={`command-palette__item ${selectedIndex === i ? 'command-palette__item--selected' : ''}`}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className={`command-palette__item-icon command-palette__item-icon--${plugin.extension.replace('.', '')}`}>
                    {plugin.extension.replace('.', '').toUpperCase()}
                  </div>
                  <div className="command-palette__item-info">
                    <span className="command-palette__item-name">{plugin.name}</span>
                    <span className="command-palette__item-meta">{plugin.category} · {plugin.type}</span>
                  </div>
                  <ArrowRight size={14} className="command-palette__item-arrow" />
                </div>
              ))}
            </div>
          )}

          {/* Ask AI Action */}
          {query.trim() && (
            <div className="command-palette__section">
              <div className="command-palette__section-title">
                <Sparkles size={12} />
                AI Assistant
              </div>
              <div
                className={`command-palette__item command-palette__item--ai ${
                  selectedIndex === localResults.length ? 'command-palette__item--selected' : ''
                }`}
                onClick={() => handleSelect(localResults.length)}
                onMouseEnter={() => setSelectedIndex(localResults.length)}
              >
                <div className="command-palette__item-icon command-palette__item-icon--ai">
                  <Sparkles size={16} />
                </div>
                <div className="command-palette__item-info">
                  <span className="command-palette__item-name">
                    Ask AI: "{query.length > 40 ? query.substring(0, 40) + '…' : query}"
                  </span>
                  <span className="command-palette__item-meta">Get an intelligent answer with web search</span>
                </div>
                <ArrowRight size={14} className="command-palette__item-arrow" />
              </div>
            </div>
          )}

          {/* Web Results */}
          {(webResults.length > 0 || webLoading) && (
            <div className="command-palette__section">
              <div className="command-palette__section-title">
                <Globe size={12} />
                Web Results
                {webLoading && <Loader size={12} className="command-palette__spin" />}
              </div>
              {webResults.map((result, i) => {
                const itemIndex = localResults.length + 1 + i
                return (
                  <div
                    key={i}
                    className={`command-palette__item command-palette__item--web ${
                      selectedIndex === itemIndex ? 'command-palette__item--selected' : ''
                    }`}
                    onClick={() => handleSelect(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div className="command-palette__item-icon command-palette__item-icon--web">
                      <Globe size={14} />
                    </div>
                    <div className="command-palette__item-info">
                      <span className="command-palette__item-name">{result.title}</span>
                      <span className="command-palette__item-meta">
                        {new URL(result.url).hostname.replace('www.', '')}
                      </span>
                    </div>
                    <ArrowRight size={14} className="command-palette__item-arrow" />
                  </div>
                )
              })}
              {webLoading && webResults.length === 0 && (
                <div className="command-palette__loading">
                  <Loader size={16} className="command-palette__spin" />
                  <span>Searching the web…</span>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!query.trim() && (
            <div className="command-palette__empty">
              <Command size={24} />
              <p>Type to search your plugin library or ask a question</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
