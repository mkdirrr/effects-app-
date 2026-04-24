const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('antiGravity', {
  // ── Plugin Scanning ──
  scanPlugins: () => ipcRenderer.invoke('plugins:scan'),

  // ── Window Controls ──
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // ── AI Agent ──
  chatWithAI: (message, history, eliteMode) => ipcRenderer.invoke('ai:chat', message, history, eliteMode),
  searchWeb: (query) => ipcRenderer.invoke('ai:search-web', query),
  getActiveModel: () => ipcRenderer.invoke('ai:get-active-model'),

  // ── Pro Notes ──
  getNote: (pluginId) => ipcRenderer.invoke('notes:get', pluginId),
  setNote: (pluginId, content) => ipcRenderer.invoke('notes:set', pluginId, content),
  getAllNoteIds: () => ipcRenderer.invoke('notes:get-all'),
  deleteNote: (pluginId) => ipcRenderer.invoke('notes:delete', pluginId),

  // ── External Links ──
  openExternal: (url) => ipcRenderer.send('shell:open-external', url)
})
