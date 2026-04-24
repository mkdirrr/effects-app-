import React from 'react'
import { Minus, Square, X, Sparkles, Command } from 'lucide-react'

export default function TitleBar({ onToggleChat, chatOpen, onOpenPalette, activeModel }) {
  return (
    <div className="titlebar">
      <div className="titlebar__brand">
        <div className="titlebar__logo">AG</div>
        <span className="titlebar__name">Anti-Gravity</span>
        <span className="titlebar__version">V6</span>
      </div>

      <div className="titlebar__center">
        <button
          className="titlebar__palette-trigger"
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
        >
          <Command size={13} />
          <span>Search plugins or ask AI…</span>
          <kbd className="titlebar__kbd">Ctrl+K</kbd>
        </button>
      </div>

      <div className="titlebar__controls">
        {/* Active Model Indicator */}
        <div className="titlebar__model-indicator" title={`Active AI: ${activeModel}`}>
          <span className="titlebar__model-dot" />
          <span className="titlebar__model-label">{activeModel}</span>
        </div>
        <button
          className={`titlebar__btn titlebar__btn--ai ${chatOpen ? 'titlebar__btn--ai-active' : ''}`}
          onClick={onToggleChat}
          title="AI Assistant"
        >
          <Sparkles size={14} />
        </button>
        <div className="titlebar__divider" />
        <button
          className="titlebar__btn"
          onClick={() => window.antiGravity.minimize()}
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar__btn"
          onClick={() => window.antiGravity.maximize()}
          title="Maximize"
        >
          <Square size={11} />
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => window.antiGravity.close()}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
