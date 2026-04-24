import React from 'react'
import { Search, Layers } from 'lucide-react'

export default function Sidebar({
  categories,
  activeCategory,
  onCategorySelect,
  search,
  onSearchChange,
  totalCount,
  scannedPaths,
  scanDate
}) {
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1])

  return (
    <aside className="sidebar">
      {/* Search */}
      <div className="sidebar__header">
        <div className="sidebar__search">
          <Search className="sidebar__search-icon" />
          <input
            id="plugin-search"
            className="sidebar__search-input"
            type="text"
            placeholder="Search plugins & presets…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Categories */}
      <div className="sidebar__categories">
        <div className="sidebar__section-title">Categories</div>

        {/* All category */}
        <div
          className={`category-item ${activeCategory === 'All' ? 'category-item--active' : ''}`}
          onClick={() => onCategorySelect('All')}
        >
          <span className="category-item__label">
            <Layers size={13} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px', opacity: 0.6 }} />
            All Plugins
          </span>
          <span className="category-item__count">{totalCount}</span>
        </div>

        {sortedCategories.map(([name, count]) => (
          <div
            key={name}
            className={`category-item ${activeCategory === name ? 'category-item--active' : ''}`}
            onClick={() => onCategorySelect(name)}
          >
            <span className="category-item__label">{name}</span>
            <span className="category-item__count">{count}</span>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="sidebar__footer">
        <div className="sidebar__stat">
          <span className="sidebar__stat-label">Total found</span>
          <span className="sidebar__stat-value">{totalCount}</span>
        </div>
        <div className="sidebar__stat">
          <span className="sidebar__stat-label">Paths scanned</span>
          <span className="sidebar__stat-value">{scannedPaths?.length || 0}</span>
        </div>
        {scanDate && (
          <div className="sidebar__stat">
            <span className="sidebar__stat-label">Last scan</span>
            <span className="sidebar__stat-value">
              {new Date(scanDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
