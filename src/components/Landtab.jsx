import React, { useMemo } from 'react'
import DonutChart from './Donutchart.jsx'

function formatArea(sqm) {
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)} ha`
  if (sqm >= 1) return `${sqm.toFixed(1)} m²`
  return `${(sqm * 10000).toFixed(0)} cm²`
}

function formatDimension(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`
  return `${m.toFixed(1)} m`
}

export default function LandTab({ result, loading, error, treatUnknownAsRooftop, onToggleRooftop }) {
  const sorted = useMemo(() => {
    if (!result?.classifications) return []
    return [...result.classifications].sort((a, b) => b.percentage - a.percentage)
  }, [result])

  const unknownArea = useMemo(() => {
    if (!result?.classifications) return 0
    const cls = result.classifications.find(c => c.type.toLowerCase().includes('unknown'))
    return cls?.areaSquareMeters || 0
  }, [result])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Analyzing land selection…</div>
        <div className="loading-subtext">
          Fetching Sentinel-2 L2A imagery and computing spectral indices
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-banner">
        <div className="error-banner__text">{error}</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🛰️</div>
        <div className="empty-state__title">No analysis yet</div>
        <div className="empty-state__desc">
          Draw a polygon on the map to analyze land cover using Sentinel-2.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Width</div>
          <div className="stat-card__value">{formatDimension(result.widthMeters)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Height</div>
          <div className="stat-card__value">{formatDimension(result.heightMeters)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Area</div>
          <div className="stat-card__value">{formatArea(result.totalAreaSquareMeters)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Imagery Date</div>
          <div className="stat-card__value" style={{ fontSize: 13 }}>{result.acquisitionDate}</div>
        </div>
        <div className="stat-card full-width">
          <div className="stat-card__label">Center Coordinates</div>
          <div className="stat-card__value" style={{ fontSize: 13 }}>
            {result.center.lat.toFixed(5)}°N, {result.center.lng.toFixed(5)}°E
          </div>
        </div>
      </div>

      <DonutChart classifications={sorted} />

      <div className="section-label">Land Cover Classification</div>
      <div className="classification-list">
        {sorted.map((item) => (
          <div key={item.type} className="classification-item">
            <div className="classification-item__header">
              <div className="classification-item__name">
                <span className="classification-item__dot" style={{ backgroundColor: item.color }} />
                {item.type}
              </div>
              <div className="classification-item__pct">{item.percentage}%</div>
            </div>
            <div className="classification-item__bar">
              <div
                className="classification-item__bar-fill"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
            <div className="classification-item__area">{formatArea(item.areaSquareMeters)}</div>
          </div>
        ))}
      </div>

      {/* Rooftop toggle — only shown when Unknown area exists */}
      {unknownArea > 0 && (
        <div className="rooftop-toggle">
          <div className="rooftop-toggle__row">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={treatUnknownAsRooftop}
                onChange={(e) => onToggleRooftop(e.target.checked, unknownArea)}
              />
              <span className="toggle-switch__slider" />
            </label>
            <span className="rooftop-toggle__label">Treat Unknown as roof area</span>
            <div className="rooftop-toggle__info" title="Rooftops may be categorized as 'Unknown' since satellite spectral signatures of roofing materials don't always match standard land cover classes. Enabling this treats the Unknown area as potential rooftop for solar panel estimation in the Thermal tab.">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
          </div>
          {treatUnknownAsRooftop && (
            <div className="rooftop-toggle__detail">
              {formatArea(unknownArea)} will be treated as rooftop in the Thermal &amp; Energy tab
            </div>
          )}
        </div>
      )}
    </>
  )
}