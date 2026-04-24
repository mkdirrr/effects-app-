// ══════════════════════════════════════════════════
// Anti-Gravity V6 — Main Process
// Multi-Model Failover Engine + Google Search
// ══════════════════════════════════════════════════

// Load environment variables FIRST
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { scanPlugins } = require('./scanner')
const { initAgent, chat, quickSearch, getActiveModel } = require('./ai-agent')
const { getNote, setNote, getAllNoteIds, deleteNote } = require('./notes-store')

let mainWindow = null
let cachedPlugins = [] // Local manifest cache

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#06060c',
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  })

  // Dev or production URL
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Window Controls IPC ──
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())

// ── Plugin Scanning IPC ──
ipcMain.handle('plugins:scan', async () => {
  try {
    const result = await scanPlugins()
    cachedPlugins = result.plugins || []
    // Re-init Gemini with fresh full manifest
    initAgent(cachedPlugins)
    return { success: true, data: result }
  } catch (error) {
    console.error('Scan error:', error)
    return { success: false, error: error.message }
  }
})

// ── Gemini AI Chat IPC (V6: passes eliteMode for model routing) ──
ipcMain.handle('ai:chat', async (_event, userMessage, conversationHistory, eliteMode) => {
  try {
    const response = await chat(userMessage, conversationHistory, eliteMode)
    return { success: true, data: response }
  } catch (error) {
    console.error('[Gemini] Chat error:', error)
    return { success: false, error: error.message }
  }
})

// ── Active Model Status IPC ──
ipcMain.handle('ai:get-active-model', async () => {
  return { success: true, data: getActiveModel() }
})

// ── Gemini Quick Search IPC (for Command Palette) ──
ipcMain.handle('ai:search-web', async (_event, query) => {
  try {
    const result = await quickSearch(query)
    return { success: true, data: result }
  } catch (error) {
    console.error('[Gemini] Search error:', error)
    return { success: false, error: error.message }
  }
})

// ── Pro Notes IPC ──
ipcMain.handle('notes:get', async (_event, pluginId) => {
  try {
    const note = getNote(pluginId)
    return { success: true, data: note }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('notes:set', async (_event, pluginId, content) => {
  try {
    setNote(pluginId, content)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('notes:get-all', async () => {
  try {
    const ids = getAllNoteIds()
    return { success: true, data: ids }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('notes:delete', async (_event, pluginId) => {
  try {
    deleteNote(pluginId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ── Open External Links ──
ipcMain.on('shell:open-external', (_event, url) => {
  shell.openExternal(url)
})

// ── App Lifecycle ──
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Pre-scan plugins and initialize Gemini with full manifest on startup
  scanPlugins()
    .then(result => {
      cachedPlugins = result.plugins || []
      initAgent(cachedPlugins)
      console.log(`[Anti-Gravity V6] Failover Agent ready with ${cachedPlugins.length} plugins`)
    })
    .catch(err => {
      console.error('[Anti-Gravity] Initial scan failed:', err.message)
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
