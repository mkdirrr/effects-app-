import React from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, HardDrive, Tag } from 'lucide-react'

function getIconClass(ext) {
  switch (ext) {
    case '.aex': return 'plugin-card__icon--aex'
    case '.ffx': return 'plugin-card__icon--ffx'
    case '.fxml': return 'plugin-card__icon--fxml'
    default: return 'plugin-card__icon--default'
  }
}

function getExtLabel(ext) {
  return ext.replace('.', '').toUpperCase()
}

/**
 * PluginCard — Enhanced with Framer Motion parallax gravity effect.
 * Cards float at different speeds based on their index, creating
 * the signature "Anti-Gravity" visual.
 */
export default function PluginCard({ plugin, viewMode, index, onClick, hasNote, scrollY }) {
  const isList = viewMode === 'list'

  // Parallax: cards at different positions float at different speeds
  // This creates the "gravity" effect where some cards move faster
  const parallaxSpeed = 0.02 + (index % 5) * 0.008 // Vary speed 0.02–0.052
  const parallaxOffset = scrollY * parallaxSpeed
  const floatDelay = (index % 7) * 0.15 // Stagger float animation

  return (
    <motion.div
      className={`plugin-card ${isList ? 'plugin-card--list' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.04, 0.8),
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      style={{
        transform: !isList ? `translateY(${-parallaxOffset}px)` : undefined
      }}
    >
      {/* Notes indicator */}
      {hasNote && (
        <motion.div
          className="notes-indicator"
          title="Has notes"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="plugin-card__header">
        <motion.div
          className={`plugin-card__icon ${getIconClass(plugin.extension)}`}
          whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
        >
          {getExtLabel(plugin.extension)}
        </motion.div>
        <div>
          <div className="plugin-card__name">{plugin.name}</div>
          <div className="plugin-card__type-badge">{plugin.type}</div>
        </div>
      </div>

      <div className="plugin-card__meta">
        <div className="plugin-card__meta-row">
          <Tag className="plugin-card__meta-icon" />
          <span className="plugin-card__meta-label">Category</span>
          <span className="plugin-card__meta-value">{plugin.category}</span>
        </div>
        <div className="plugin-card__meta-row">
          <HardDrive className="plugin-card__meta-icon" />
          <span className="plugin-card__meta-label">Size</span>
          <span className="plugin-card__meta-value">{plugin.size}</span>
        </div>
        {!isList && (
          <div className="plugin-card__meta-row path-tooltip" data-tooltip={plugin.path}>
            <FolderOpen className="plugin-card__meta-icon" />
            <span className="plugin-card__meta-label">Path</span>
            <span className="plugin-card__meta-value">
              …{plugin.directory.split('\\').slice(-2).join('\\')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
