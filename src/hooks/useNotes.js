import { useState, useCallback } from 'react'

/**
 * useNotes — Manages per-plugin Pro Notes via IPC.
 */
export function useNotes() {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  /**
   * Load a note for a specific plugin.
   * @param {string} pluginId
   */
  const loadNote = useCallback(async (pluginId) => {
    if (!pluginId) return
    setLoading(true)
    try {
      const result = await window.antiGravity.getNote(pluginId)
      if (result.success) {
        setNote(result.data)
      } else {
        setNote(null)
      }
    } catch {
      setNote(null)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Save a note for a plugin.
   * @param {string} pluginId
   * @param {string} content - Markdown content
   */
  const saveNote = useCallback(async (pluginId, content) => {
    if (!pluginId) return
    setSaving(true)
    try {
      await window.antiGravity.setNote(pluginId, content)
      setNote({ content, updatedAt: new Date().toISOString() })
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Delete a note for a plugin.
   * @param {string} pluginId
   */
  const removeNote = useCallback(async (pluginId) => {
    if (!pluginId) return
    try {
      await window.antiGravity.deleteNote(pluginId)
      setNote(null)
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }, [])

  return {
    note,
    loading,
    saving,
    loadNote,
    saveNote,
    removeNote
  }
}
