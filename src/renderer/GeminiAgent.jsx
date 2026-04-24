import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Trash2, Globe, ExternalLink, Loader, Zap, ShieldCheck } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import MarkdownRenderer from './MarkdownRenderer'

/**
 * GeminiAgent — AI-powered chat panel with multi-model failover.
 * V6: Shows Active Model Badge + Elite Mode toggle.
 */
export default function GeminiAgent({ isOpen, onClose, eliteMode, onToggleElite }) {
  const { messages, isLoading, activeModel, sendMessage, clearChat } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input, eliteMode)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSourceClick = (url) => {
    window.antiGravity.openExternal(url)
  }

  return (
    <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
      {/* ── Header ── */}
      <div className="chat-panel__header">
        <div className="chat-panel__title-group">
          <Zap size={18} className="chat-panel__icon" />
          <span className="chat-panel__title">Anti-Gravity AI</span>
          <span className="active-model-badge" title={`Active Model: ${activeModel}`}>
            {activeModel}
          </span>
        </div>
        <div className="chat-panel__actions">
          {/* Elite Mode Toggle */}
          <button
            className={`chat-panel__action-btn elite-toggle ${eliteMode ? 'elite-toggle--active' : ''}`}
            onClick={onToggleElite}
            title={eliteMode ? 'Elite Mode ON (Gemini 3.1 Pro)' : 'Enable Elite Mode'}
          >
            <ShieldCheck size={14} />
          </button>
          {messages.length > 0 && (
            <button
              className="chat-panel__action-btn"
              onClick={clearChat}
              title="Clear conversation"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            className="chat-panel__action-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="chat-panel__messages">
        {messages.length === 0 && !isLoading && (
          <div className="chat-panel__welcome">
            <div className="chat-panel__welcome-icon">
              <Zap size={32} />
            </div>
            <h3 className="chat-panel__welcome-title">Anti-Gravity AI</h3>
            <p className="chat-panel__welcome-sub">Powered by Gemini 3 Flash + Auto-Failover</p>
            <p className="chat-panel__welcome-text">
              I know every plugin on your machine and can search the web in real-time.
              If a model goes down, I automatically switch to the next one.
            </p>
            <div className="chat-panel__suggestions">
              {[
                'What color correction plugins do I have?',
                'Find the latest Particular tutorials on YouTube',
                'Best free plugins for motion graphics 2026',
                'How do I create a cinematic look with my installed plugins?'
              ].map((q, i) => (
                <button
                  key={i}
                  className="chat-panel__suggestion"
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chat-message__avatar">
                <Zap size={14} />
              </div>
            )}
            <div className="chat-message__bubble">
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p className="chat-message__text">{msg.content}</p>
              )}

              {/* Model tag on AI messages */}
              {msg.role === 'assistant' && msg.activeModel && (
                <div className="chat-message__model-tag">
                  via {msg.activeModel}
                </div>
              )}

              {/* Web Sources from Google Search grounding */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="chat-sources">
                  <div className="chat-sources__label">
                    <Globe size={12} />
                    Google Search Sources
                  </div>
                  {msg.sources.map((source, i) => {
                    let domain = ''
                    try { domain = new URL(source.url).hostname.replace('www.', '') } catch { domain = source.url }
                    return (
                      <button
                        key={i}
                        className="chat-source-card"
                        onClick={() => handleSourceClick(source.url)}
                        title={source.url}
                      >
                        <span className="chat-source-card__title">{source.title}</span>
                        <span className="chat-source-card__domain">
                          <ExternalLink size={10} />
                          {domain}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__avatar chat-message__avatar--searching">
              <Zap size={14} />
            </div>
            <div className="chat-message__bubble">
              <div className="chat-typing">
                <div className="chat-typing__dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="chat-typing__label">
                  <Globe size={12} className="chat-typing__globe" />
                  {eliteMode ? 'Elite analysis in progress…' : 'Searching Google & analyzing your plugins…'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-panel__input-area">
        <div className="chat-panel__input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-panel__input"
            placeholder="Ask about plugins, workflows, tutorials…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`chat-panel__send ${input.trim() && !isLoading ? 'chat-panel__send--active' : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader size={16} className="chat-panel__send-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="chat-panel__input-hint">
          Enter to send · Shift+Enter for new line{eliteMode ? ' · ⚡ Elite Mode' : ` · ${activeModel}`}
        </div>
      </div>
    </div>
  )
}
