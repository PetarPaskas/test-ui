import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SERBIA_CENTER = [44.0165, 20.9070]
const SERBIA_BOUNDS = [[42.23, 18.82], [46.19, 23.01]]
const VERTEX_RADIUS = 5
const CLOSE_THRESHOLD_PX = 12

export default function MapView({ onAreaSelected }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [drawMode, setDrawMode] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const [vertexCount, setVertexCount] = useState(0)

  const drawModeRef = useRef(false)
  const verticesRef = useRef([])         // [{lat, lng}]
  const vertexMarkersRef = useRef([])    // L.circleMarker[]
  const edgeLinesRef = useRef(null)      // L.polyline (edges between placed vertices)
  const previewLineRef = useRef(null)    // L.polyline (cursor → last vertex)
  const selectionPolygonRef = useRef(null) // L.polygon (final)
  const onAreaSelectedRef = useRef(onAreaSelected)

  useEffect(() => { onAreaSelectedRef.current = onAreaSelected }, [onAreaSelected])

  // Sync draw mode
  useEffect(() => {
    drawModeRef.current = drawMode
    if (!mapInstance.current) return
    const map = mapInstance.current
    if (drawMode) {
      map.dragging.disable()
      map.doubleClickZoom.disable()
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.dragging.enable()
      map.doubleClickZoom.enable()
      map.getContainer().style.cursor = ''
      clearPreviewLayers()
    }
  }, [drawMode])

  const clearPreviewLayers = useCallback(() => {
    const map = mapInstance.current
    if (!map) return
    vertexMarkersRef.current.forEach(m => map.removeLayer(m))
    vertexMarkersRef.current = []
    if (edgeLinesRef.current) { map.removeLayer(edgeLinesRef.current); edgeLinesRef.current = null }
    if (previewLineRef.current) { map.removeLayer(previewLineRef.current); previewLineRef.current = null }
  }, [])

  const startDrawMode = useCallback(() => {
    verticesRef.current = []
    setVertexCount(0)
    clearPreviewLayers()
    // Clear previous selection
    if (selectionPolygonRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(selectionPolygonRef.current)
      selectionPolygonRef.current = null
    }
    setHasSelection(false)
    setDrawMode(true)
  }, [clearPreviewLayers])

  const stopDrawMode = useCallback(() => {
    verticesRef.current = []
    setVertexCount(0)
    clearPreviewLayers()
    setDrawMode(false)
  }, [clearPreviewLayers])

  const undoLastVertex = useCallback(() => {
    const map = mapInstance.current
    if (!map || verticesRef.current.length === 0) return
    verticesRef.current.pop()
    const lastMarker = vertexMarkersRef.current.pop()
    if (lastMarker) map.removeLayer(lastMarker)
    // Redraw edge lines
    if (edgeLinesRef.current) { map.removeLayer(edgeLinesRef.current); edgeLinesRef.current = null }
    if (verticesRef.current.length >= 2) {
      edgeLinesRef.current = L.polyline(
        verticesRef.current.map(v => [v.lat, v.lng]),
        { color: '#63b3ed', weight: 2, dashArray: '6 3', interactive: false }
      ).addTo(map)
    }
    setVertexCount(verticesRef.current.length)
  }, [])

  const finishPolygon = useCallback(() => {
    if (verticesRef.current.length < 3) return
    const map = mapInstance.current
    if (!map) return

    const verts = [...verticesRef.current]
    clearPreviewLayers()

    // Draw final polygon
    selectionPolygonRef.current = L.polygon(
      verts.map(v => [v.lat, v.lng]),
      { color: '#63b3ed', weight: 2, fillColor: 'rgba(99, 179, 237, 0.12)', fillOpacity: 0.12, interactive: false }
    ).addTo(map)

    // Add vertex dots on the final polygon
    verts.forEach(v => {
      L.circleMarker([v.lat, v.lng], {
        radius: 4, color: '#63b3ed', fillColor: '#63b3ed', fillOpacity: 1,
        weight: 1, interactive: false
      }).addTo(map)
    })

    setDrawMode(false)
    setHasSelection(true)
    setVertexCount(0)
    verticesRef.current = []

    onAreaSelectedRef.current(verts)
  }, [clearPreviewLayers])

  const clearSelection = useCallback(() => {
    if (selectionPolygonRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(selectionPolygonRef.current)
      selectionPolygonRef.current = null
    }
    // Also remove any vertex dots from final polygon
    mapInstance.current?.eachLayer(layer => {
      if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
        mapInstance.current.removeLayer(layer)
      }
    })
    setHasSelection(false)
  }, [])

  // Initialize map
  useEffect(() => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: SERBIA_CENTER, zoom: 8, zoomControl: false,
      maxBounds: [[40, 16], [48, 26]], minZoom: 6
    })

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map)

    L.rectangle(SERBIA_BOUNDS, {
      color: 'rgba(99, 179, 237, 0.2)', weight: 1,
      fillColor: 'transparent', fillOpacity: 0, dashArray: '8 4', interactive: false
    }).addTo(map)

    // ─── Click to place vertex ───────────────────────────────────────
    map.on('click', (e) => {
      if (!drawModeRef.current) return

      const clickPt = map.latLngToContainerPoint(e.latlng)

      // Check if clicking near first vertex to close
      if (verticesRef.current.length >= 3) {
        const firstPt = map.latLngToContainerPoint(
          L.latLng(verticesRef.current[0].lat, verticesRef.current[0].lng)
        )
        if (clickPt.distanceTo(firstPt) < CLOSE_THRESHOLD_PX) {
          // Close the polygon
          finishPolygonFromMap()
          return
        }
      }

      // Add vertex
      const v = { lat: e.latlng.lat, lng: e.latlng.lng }
      verticesRef.current.push(v)

      // Draw vertex marker
      const isFirst = verticesRef.current.length === 1
      const marker = L.circleMarker([v.lat, v.lng], {
        radius: isFirst ? VERTEX_RADIUS + 2 : VERTEX_RADIUS,
        color: isFirst ? '#FFD43B' : '#63b3ed',
        fillColor: isFirst ? '#FFD43B' : '#63b3ed',
        fillOpacity: 0.8, weight: 2, interactive: false
      }).addTo(map)
      vertexMarkersRef.current.push(marker)

      // Update edge lines
      if (edgeLinesRef.current) { map.removeLayer(edgeLinesRef.current); edgeLinesRef.current = null }
      if (verticesRef.current.length >= 2) {
        edgeLinesRef.current = L.polyline(
          verticesRef.current.map(vt => [vt.lat, vt.lng]),
          { color: '#63b3ed', weight: 2, dashArray: '6 3', interactive: false }
        ).addTo(map)
      }

      setVertexCount(verticesRef.current.length)
    })

    // ─── Mouse move for preview line ─────────────────────────────────
    map.on('mousemove', (e) => {
      if (!drawModeRef.current || verticesRef.current.length === 0) return

      const lastV = verticesRef.current[verticesRef.current.length - 1]
      const pts = [[lastV.lat, lastV.lng], [e.latlng.lat, e.latlng.lng]]

      // Also draw closing line preview if >= 3 vertices
      if (verticesRef.current.length >= 3) {
        const firstV = verticesRef.current[0]
        pts.push([firstV.lat, firstV.lng])
      }

      if (previewLineRef.current) {
        previewLineRef.current.setLatLngs(
          verticesRef.current.length >= 3
            ? [[lastV.lat, lastV.lng], [e.latlng.lat, e.latlng.lng], [verticesRef.current[0].lat, verticesRef.current[0].lng]]
            : [[lastV.lat, lastV.lng], [e.latlng.lat, e.latlng.lng]]
        )
      } else {
        previewLineRef.current = L.polyline(pts, {
          color: 'rgba(99, 179, 237, 0.4)', weight: 1.5, dashArray: '4 4', interactive: false
        }).addTo(map)
      }
    })

    // Helper: finish polygon triggered from map click on first vertex
    function finishPolygonFromMap() {
      if (verticesRef.current.length < 3) return
      const verts = [...verticesRef.current]

      // Clear preview layers
      vertexMarkersRef.current.forEach(m => map.removeLayer(m))
      vertexMarkersRef.current = []
      if (edgeLinesRef.current) { map.removeLayer(edgeLinesRef.current); edgeLinesRef.current = null }
      if (previewLineRef.current) { map.removeLayer(previewLineRef.current); previewLineRef.current = null }

      // Draw final polygon
      selectionPolygonRef.current = L.polygon(
        verts.map(v => [v.lat, v.lng]),
        { color: '#63b3ed', weight: 2, fillColor: 'rgba(99, 179, 237, 0.12)', fillOpacity: 0.12, interactive: false }
      ).addTo(map)

      verts.forEach(v => {
        L.circleMarker([v.lat, v.lng], {
          radius: 4, color: '#63b3ed', fillColor: '#63b3ed', fillOpacity: 1, weight: 1, interactive: false
        }).addTo(map)
      })

      drawModeRef.current = false
      map.dragging.enable()
      map.doubleClickZoom.enable()
      map.getContainer().style.cursor = ''

      setDrawMode(false)
      setHasSelection(true)
      setVertexCount(0)
      verticesRef.current = []

      onAreaSelectedRef.current(verts)
    }

    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <div className="draw-toolbar">
        {!drawMode ? (
          <>
            <button className="draw-toolbar__btn draw-toolbar__btn--primary" onClick={startDrawMode}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 22h20L12 2z" />
                <circle cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="2" cy="22" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="22" cy="22" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span>Draw Polygon</span>
            </button>
            {hasSelection && (
              <button className="draw-toolbar__btn draw-toolbar__btn--ghost" onClick={clearSelection}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="draw-toolbar__active">
            <div className="draw-toolbar__pulse" />
            <span>
              {vertexCount === 0 ? 'Click to place first point'
                : vertexCount < 3 ? `${vertexCount} point${vertexCount > 1 ? 's' : ''} — need ${3 - vertexCount} more`
                : `${vertexCount} points — click first point or Finish`}
            </span>
            {vertexCount > 0 && (
              <button className="draw-toolbar__btn draw-toolbar__btn--cancel" onClick={undoLastVertex}>
                Undo
              </button>
            )}
            {vertexCount >= 3 && (
              <button className="draw-toolbar__btn draw-toolbar__btn--finish" onClick={finishPolygon}>
                Finish
              </button>
            )}
            <button className="draw-toolbar__btn draw-toolbar__btn--cancel" onClick={stopDrawMode}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  )
}