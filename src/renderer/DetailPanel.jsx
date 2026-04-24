import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, FileText, FolderOpen, HardDrive, Tag, Clock, Calendar, Edit3, Save, StickyNote } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import MarkdownRenderer from './MarkdownRenderer'

export default function DetailPanel({ plugin, onClose, onNoteSaved }) {
  const { note, loading: noteLoading, saving, loadNote, saveNote } = useNotes()
  const [editMode, setEditMode] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const debounceRef = useRef(null)

  // Load note when plugin changes
  useEffect(() => {
    if (plugin?.id) {
      loadNote(plugin.id)
      setEditMode(false)
    }
  }, [plugin?.id, loadNote])

  // Sync note content when loaded
  useEffect(() => {
    setNoteContent(note?.content || '')
  }, [note])

  // Auto-save with debounce (1s after last keystroke)
  const handleNoteChange = useCallback((value) => {
    setNoteContent(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (plugin?.id) {
        saveNote(plugin.id, value)
        if (onNoteSaved) onNoteSaved()
      }
    }, 1000)
  }, [plugin?.id, saveNote, onNoteSaved])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!plugin) return null

  const isOpen = !!plugin

  return (
    <div className={`detail-panel ${isOpen ? 'detail-panel--open' : ''}`}>
      <div className="detail-panel__header">
        <span className="detail-panel__title">Plugin Details</span>
        <button className="detail-panel__close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="detail-panel__body">
        <div className="detail-panel__field">
          <span className="detail-panel__field-label">Name</span>
          <span className="detail-panel__field-value" style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            {plugin.name}
          </span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <FileText size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            File Name
          </span>
          <span className="detail-panel__field-value">{plugin.fileName}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <Tag size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Type
          </span>
          <span className="detail-panel__field-value">{plugin.type}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <Tag size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Category
          </span>
          <span className="detail-panel__field-value">{plugin.category}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <HardDrive size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            File Size
          </span>
          <span className="detail-panel__field-value">{plugin.size}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <FolderOpen size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Full Path
          </span>
          <span className="detail-panel__field-value">{plugin.path}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <FolderOpen size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Directory
          </span>
          <span className="detail-panel__field-value">{plugin.directory}</span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Created
          </span>
          <span className="detail-panel__field-value">
            {new Date(plugin.createdDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>

        <div className="detail-panel__field">
          <span className="detail-panel__field-label">
            <Clock size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
            Last Modified
          </span>
          <span className="detail-panel__field-value">
            {new Date(plugin.modifiedDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>

        {/* ── Pro Notes Section ── */}
        <div className="pro-notes">
          <div className="pro-notes__header">
            <span className="pro-notes__title">
              <StickyNote size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
              PRO NOTES
            </span>
            <div className="pro-notes__actions">
              {saving && <span className="pro-notes__saving">Saving…</span>}
              {note?.updatedAt && !saving && (
                <span className="pro-notes__timestamp">
                  {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                className={`pro-notes__toggle ${editMode ? 'pro-notes__toggle--active' : ''}`}
                onClick={() => setEditMode(!editMode)}
                title={editMode ? 'Preview' : 'Edit'}
              >
                {editMode ? <Save size={13} /> : <Edit3 size={13} />}
              </button>
            </div>
          </div>

          <div className="pro-notes__content">
            {editMode ? (
              <textarea
                className="pro-notes__editor"
                placeholder="Write your notes in Markdown…&#10;&#10;# Tips&#10;- Use **bold** for emphasis&#10;- Add `code` snippets&#10;- Paste links and references"
                value={noteContent}
                onChange={(e) => handleNoteChange(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <div className="pro-notes__rendered">
                {noteContent.trim() ? (
                  <MarkdownRenderer content={noteContent} />
                ) : (
                  <p className="pro-notes__empty">
                    No notes yet. Click <Edit3 size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> to start writing.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
