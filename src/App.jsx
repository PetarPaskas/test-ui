import React, { useState, useCallback } from 'react'
import MapView from './MapView.jsx'
import Drawer from './Drawer.jsx'
import { fetchLandAnalysis } from './services/api.js'

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState(null)

  const [landResult, setLandResult] = useState(null)
  const [landLoading, setLandLoading] = useState(false)
  const [landError, setLandError] = useState(null)

  const handleAreaSelected = useCallback(async (polygon) => {
    setCurrentPolygon(polygon)
    setDrawerOpen(true)
    setLandLoading(true)
    setLandError(null)

    try {
      const data = await fetchLandAnalysis(polygon)
      setLandResult(data)
    } catch (err) {
      setLandError(err.message || 'Failed to analyze land selection')
    } finally {
      setLandLoading(false)
    }
  }, [])

  const hasResults = landResult || landLoading

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__brand">
          <div className="top-bar__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <div className="top-bar__title">Land Analyzer</div>
            <div className="top-bar__subtitle">Sentinel-2 &amp; Sentinel-3 · Serbia</div>
          </div>
        </div>
        <div className="top-bar__actions">
          <div className="top-bar__status">
            <span className="status-dot"></span>
            S-2 L2A &middot; S-3 SLSTR &middot; DEM
          </div>
        </div>
      </header>

      <div className="map-container">
        <MapView onAreaSelected={handleAreaSelected} />
      </div>

      <div className={`instruction-badge ${hasResults ? 'hidden' : ''}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
        Click points on the map to draw a polygon selection
      </div>

      {hasResults && (
        <button
          className={`drawer-toggle ${drawerOpen ? 'shifted' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {drawerOpen ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        landResult={landResult}
        landLoading={landLoading}
        landError={landError}
        currentPolygon={currentPolygon}
      />
    </>
  )
}