import { useState, useEffect, useCallback } from 'react'

export function usePlugins() {
  const [plugins, setPlugins] = useState([])
  const [categories, setCategories] = useState({})
  const [totalCount, setTotalCount] = useState(0)
  const [scannedPaths, setScannedPaths] = useState([])
  const [scanDate, setScanDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  const scan = useCallback(async () => {
    setScanning(true)
    setError(null)
    try {
      const result = await window.antiGravity.scanPlugins()
      if (result.success) {
        setPlugins(result.data.plugins)
        setCategories(result.data.categories)
        setTotalCount(result.data.totalCount)
        setScannedPaths(result.data.scannedPaths)
        setScanDate(result.data.scanDate)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message || 'Failed to scan plugins')
    } finally {
      setLoading(false)
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    // Initial scan on mount with slight delay for splash effect
    const timer = setTimeout(() => scan(), 1800)
    return () => clearTimeout(timer)
  }, [scan])

  return {
    plugins,
    categories,
    totalCount,
    scannedPaths,
    scanDate,
    loading,
    error,
    scanning,
    rescan: scan
  }
}
