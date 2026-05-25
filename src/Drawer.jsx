import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import LandTab from './components/Landtab.jsx'
import ThermalTab from './components/Thermaltab.jsx'
import TerrainTab from './components/Terraintab.jsx'
import { fetchThermalAnalysis, fetchTerrainAnalysis } from './services/Api.js'

const TABS = [
  { id: 'land', label: 'Land Cover', icon: 'M3 3h18v18H3zM3 9h18M9 3v18' },
  { id: 'thermal', label: 'Thermal', icon: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z' },
  { id: 'terrain', label: 'Terrain', icon: 'M3 20L9 8l4 6 3-3 5 9H3z' }
]

function getClassArea(landResult, keyword) {
  if (!landResult?.classifications) return 0
  const cls = landResult.classifications.find(c => c.type.toLowerCase().includes(keyword))
  return cls?.areaSquareMeters || 0
}

export default function Drawer({
  open, onClose,
  landResult, landLoading, landError,
  currentPolygon
}) {
  const [activeTab, setActiveTab] = useState('land')

  // ── Rooftop toggle state ───────────────────────────────────────────
  const [treatUnknownAsRooftop, setTreatUnknownAsRooftop] = useState(false)
  const [unknownAreaM2, setUnknownAreaM2] = useState(0)

  // Extract building area from land result (always available once land loads)
  const buildingAreaM2 = useMemo(() => getClassArea(landResult, 'concrete'), [landResult])

  // ── Thermal state ──────────────────────────────────────────────────
  const [thermalResult, setThermalResult] = useState(null)
  const [thermalLoading, setThermalLoading] = useState(false)
  const [thermalError, setThermalError] = useState(null)
  const thermalKeyRef = useRef(null)

  // ── Terrain state ──────────────────────────────────────────────────
  const [terrainResult, setTerrainResult] = useState(null)
  const [terrainLoading, setTerrainLoading] = useState(false)
  const [terrainError, setTerrainError] = useState(null)
  const terrainKeyRef = useRef(null)

  // Cache key includes rooftop toggle so thermal re-fetches when toggled
  const buildThermalKey = useCallback((polygon, rooftopFlag, unknownArea, bldgArea) => {
    return JSON.stringify({ polygon, treatUnknownAsRooftop: rooftopFlag, unknownAreaM2: unknownArea, buildingAreaM2: bldgArea })
  }, [])

  // Reset cached data when polygon changes
  useEffect(() => {
    if (!currentPolygon) return
    setThermalResult(null); setThermalError(null); setThermalLoading(false)
    thermalKeyRef.current = null
    setTerrainResult(null); setTerrainError(null); setTerrainLoading(false)
    terrainKeyRef.current = null
    setTreatUnknownAsRooftop(false)
    setUnknownAreaM2(0)
  }, [currentPolygon])

  // Handle rooftop toggle from LandTab
  const handleToggleRooftop = useCallback((checked, area) => {
    setTreatUnknownAsRooftop(checked)
    setUnknownAreaM2(area)
    // Invalidate thermal cache so it re-fetches with the new flag
    setThermalResult(null)
    setThermalError(null)
    thermalKeyRef.current = null
  }, [])

  // Fire thermal fetch
  const fetchThermal = useCallback((polygon, rooftopFlag, unknownArea, bldgArea) => {
    const key = buildThermalKey(polygon, rooftopFlag, unknownArea, bldgArea)
    if (thermalKeyRef.current === key) return
    thermalKeyRef.current = key
    setThermalLoading(true); setThermalError(null)
    fetchThermalAnalysis(polygon, {
      treatUnknownAsRooftop: rooftopFlag,
      unknownAreaM2: unknownArea,
      buildingAreaM2: bldgArea
    })
      .then(data => { if (thermalKeyRef.current === key) setThermalResult(data) })
      .catch(err => { if (thermalKeyRef.current === key) setThermalError(err.message || 'Failed to fetch thermal data') })
      .finally(() => { if (thermalKeyRef.current === key) setThermalLoading(false) })
  }, [buildThermalKey])

  // Lazy-fetch on tab open
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)

    if (tabId === 'thermal' && currentPolygon) {
      fetchThermal(currentPolygon, treatUnknownAsRooftop, unknownAreaM2, buildingAreaM2)
    }

    if (tabId === 'terrain' && currentPolygon) {
      const key = JSON.stringify(currentPolygon)
      if (terrainKeyRef.current === key) return
      terrainKeyRef.current = key
      setTerrainLoading(true); setTerrainError(null)
      fetchTerrainAnalysis(currentPolygon)
        .then(data => { if (terrainKeyRef.current === key) setTerrainResult(data) })
        .catch(err => { if (terrainKeyRef.current === key) setTerrainError(err.message || 'Failed to fetch terrain data') })
        .finally(() => { if (terrainKeyRef.current === key) setTerrainLoading(false) })
    }
  }, [currentPolygon, treatUnknownAsRooftop, unknownAreaM2, buildingAreaM2, fetchThermal])

  // Reset to land tab on new selection
  useEffect(() => { setActiveTab('land') }, [currentPolygon])

  return (
    <div className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer__header">
        <div className="drawer__title">Analysis Results</div>
        <button className="drawer__close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="drawer__tabs">
        {TABS.map((tab) => {
          const isLoading = (tab.id === 'thermal' && thermalLoading) || (tab.id === 'terrain' && terrainLoading)
          return (
            <button key={tab.id} className={`drawer__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span>{tab.label}</span>
              {isLoading && activeTab !== tab.id && <span className="tab-loading-dot" />}
            </button>
          )
        })}
      </div>

      <div className="drawer__body">
        {activeTab === 'land' && (
          <LandTab
            result={landResult}
            loading={landLoading}
            error={landError}
            treatUnknownAsRooftop={treatUnknownAsRooftop}
            onToggleRooftop={handleToggleRooftop}
          />
        )}
        {activeTab === 'thermal' && (
          <ThermalTab result={thermalResult} loading={thermalLoading} error={thermalError} />
        )}
        {activeTab === 'terrain' && (
          <TerrainTab result={terrainResult} loading={terrainLoading} error={terrainError} />
        )}
      </div>
    </div>
  )
}