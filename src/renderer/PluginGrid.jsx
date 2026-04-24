import React, { useRef, useState, useCallback } from 'react'
import { LayoutGrid, List, RefreshCw, FolderSearch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PluginCard from './PluginCard'

export default function PluginGrid({
  plugins,
  totalCount,
  filteredCount,
  activeCategory,
  viewMode,
  onViewModeChange,
  scanning,
  onRescan,
  onPluginSelect,
  noteIds
}) {
  const scrollRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  // Track scroll position for 3D parallax
  const handleScroll = useCallback((e) => {
    setScrollY(e.target.scrollTop)
  }, [])

  return (
    <main className="content">
      {/* Header */}
      <div className="content__header">
        <div className="content__title-group">
          <h1 className="content__title">
            {activeCategory === 'All' ? 'All Plugins' : activeCategory}
          </h1>
          <span className="content__subtitle">
            {filteredCount === totalCount
              ? `${totalCount} items`
              : `${filteredCount} of ${totalCount} items`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            className={`btn-rescan ${scanning ? 'btn-rescan--spinning' : ''}`}
            onClick={onRescan}
            disabled={scanning}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={14} />
            {scanning ? 'Scanning…' : 'Rescan'}
          </motion.button>

          <div className="content__view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'view-btn--active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'view-btn--active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid with scroll tracking */}
      <div
        ref={scrollRef}
        className="content__grid"
        onScroll={handleScroll}
      >
        {plugins.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FolderSearch className="empty-state__icon" />
            <h2 className="empty-state__title">No plugins found</h2>
            <p className="empty-state__text">
              {totalCount === 0
                ? 'No .aex or .ffx files were found in the standard Adobe plugin directories. Make sure After Effects is installed.'
                : 'No plugins match your current search or filter. Try adjusting your criteria.'}
            </p>
          </motion.div>
        ) : (
          <div
            className={`plugin-grid ${viewMode === 'list' ? 'plugin-grid--list' : ''}`}
          >
            <AnimatePresence mode="popLayout">
              {plugins.map((plugin, index) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  viewMode={viewMode}
                  index={index}
                  onClick={() => onPluginSelect(plugin)}
                  hasNote={noteIds && noteIds.has(plugin.id)}
                  scrollY={scrollY}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
