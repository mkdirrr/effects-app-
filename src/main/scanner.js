const fs = require('fs')
const path = require('path')

// ── Target Directories ──
const SCAN_ROOTS = [
  'C:\\Program Files\\Adobe\\Common\\Plug-ins\\7.0\\MediaCore',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\Plug-ins',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\Plug-ins',
  'C:\\Program Files\\Adobe\\Adobe After Effects CC 2024\\Support Files\\Plug-ins',
  'C:\\Program Files\\Adobe\\Adobe After Effects CC 2025\\Support Files\\Plug-ins',
  'C:\\Program Files\\Adobe\\Adobe After Effects CC\\Support Files\\Plug-ins'
]

// ── Supported Extensions ──
const PLUGIN_EXTENSIONS = new Set(['.aex', '.ffx', '.fxml', '.plugin'])

// ── Category inference from path/folder name ──
function inferCategory(filePath) {
  const normalized = filePath.toLowerCase()
  const categories = {
    'effect': 'Effects',
    'transition': 'Transitions',
    'keying': 'Keying',
    'color': 'Color Correction',
    'audio': 'Audio',
    'text': 'Text & Titles',
    'generate': 'Generate',
    'blur': 'Blur & Sharpen',
    'distort': 'Distortion',
    'stylize': 'Stylize',
    'noise': 'Noise & Grain',
    'matte': 'Matte Tools',
    'channel': 'Channel',
    'utility': 'Utility',
    'simulation': 'Simulation',
    'perspective': 'Perspective',
    'time': 'Time',
    '3d': '3D & Camera',
    'particle': 'Simulation',
    'tracker': 'Motion Tracking',
    'expression': 'Expressions',
    'obsolete': 'Obsolete / Legacy',
    'mediacore': 'MediaCore Shared',
    'preset': 'Presets'
  }

  for (const [keyword, category] of Object.entries(categories)) {
    if (normalized.includes(keyword)) return category
  }

  // Use parent folder name as fallback
  const parentDir = path.basename(path.dirname(filePath))
  return parentDir || 'Uncategorized'
}

// ── Get plugin type label ──
function getPluginType(ext) {
  switch (ext) {
    case '.aex': return 'Plugin (AEX)'
    case '.ffx': return 'Preset (FFX)'
    case '.fxml': return 'Preset (FXML)'
    case '.plugin': return 'Plugin (macOS bundle)'
    default: return 'Unknown'
  }
}

// ── Format file size ──
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

// ── Recursive directory walker ──
async function walkDirectory(dirPath, results = []) {
  let entries
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  } catch {
    // Directory doesn't exist or no permission — skip silently
    return results
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, results)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (PLUGIN_EXTENSIONS.has(ext)) {
        try {
          const stats = await fs.promises.stat(fullPath)
          results.push({
            id: Buffer.from(fullPath).toString('base64url'),
            name: path.basename(entry.name, ext),
            fileName: entry.name,
            extension: ext,
            type: getPluginType(ext),
            category: inferCategory(fullPath),
            size: formatFileSize(stats.size),
            sizeBytes: stats.size,
            path: fullPath,
            directory: path.dirname(fullPath),
            modifiedDate: stats.mtime.toISOString(),
            createdDate: stats.birthtime.toISOString()
          })
        } catch {
          // stat failed — skip
        }
      }
    }
  }

  return results
}

// ── Main scan export ──
async function scanPlugins() {
  const allPlugins = []
  const scannedPaths = []
  const errors = []

  for (const root of SCAN_ROOTS) {
    try {
      await fs.promises.access(root)
      scannedPaths.push(root)
      await walkDirectory(root, allPlugins)
    } catch {
      // Path doesn't exist or inaccessible
      errors.push(`Skipped: ${root}`)
    }
  }

  // Deduplicate by full path
  const seen = new Set()
  const unique = allPlugins.filter(p => {
    if (seen.has(p.path)) return false
    seen.add(p.path)
    return true
  })

  // Sort alphabetically
  unique.sort((a, b) => a.name.localeCompare(b.name))

  // Build category summary
  const categoryCounts = {}
  for (const plugin of unique) {
    categoryCounts[plugin.category] = (categoryCounts[plugin.category] || 0) + 1
  }

  return {
    plugins: unique,
    totalCount: unique.length,
    categories: categoryCounts,
    scannedPaths,
    errors,
    scanDate: new Date().toISOString()
  }
}

module.exports = { scanPlugins }
