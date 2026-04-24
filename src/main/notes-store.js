const Store = require('electron-store')

const store = new Store({
  name: 'anti-gravity-notes',
  defaults: {
    notes: {}
  }
})

/**
 * Get a note for a specific plugin.
 * @param {string} pluginId - Base64url-encoded plugin path
 * @returns {{ content: string, updatedAt: string } | null}
 */
function getNote(pluginId) {
  return store.get(`notes.${pluginId}`, null)
}

/**
 * Save or update a note for a plugin.
 * @param {string} pluginId
 * @param {string} content - Markdown content
 */
function setNote(pluginId, content) {
  store.set(`notes.${pluginId}`, {
    content,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Get all plugin IDs that have notes saved.
 * @returns {string[]}
 */
function getAllNoteIds() {
  const notes = store.get('notes', {})
  return Object.keys(notes).filter(id => {
    const note = notes[id]
    return note && note.content && note.content.trim().length > 0
  })
}

/**
 * Delete a note for a plugin.
 * @param {string} pluginId
 */
function deleteNote(pluginId) {
  store.delete(`notes.${pluginId}`)
}

module.exports = { getNote, setNote, getAllNoteIds, deleteNote }
