import React from 'react'

function RatingBadge({ rating, color }) {
  return (
    <span className="rating-badge" style={{ color: color || '#999', borderColor: color || '#333' }}>
      {rating}
    </span>
  )
}

function DistributionBar({ segments }) {
  return (
    <div className="dist-bar">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="dist-bar__segment"
          style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
          title={`${seg.label}: ${seg.percent}%`}
        />
      ))}
    </div>
  )
}

export default function TerrainTab({ result, loading, error }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Fetching elevation data…</div>
        <div className="loading-subtext">
          Querying Copernicus DEM GLO-30 and computing slope, aspect &amp; hillshade
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
        <div className="empty-state__icon">⛰️</div>
        <div className="empty-state__title">Terrain data not loaded</div>
        <div className="empty-state__desc">
          Slope, tilt &amp; shading analysis from Copernicus DEM will load when this tab is opened.
        </div>
      </div>
    )
  }

  const { elevation, slope, aspect, solarTilt, shading } = result

  return (
    <>
      {/* Elevation Hero */}
      <div className="terrain-hero">
        <div className="terrain-hero__grid">
          <div className="terrain-hero__stat">
            <div className="terrain-hero__value">{elevation.minMeters}m</div>
            <div className="terrain-hero__label">Min</div>
          </div>
          <div className="terrain-hero__stat terrain-hero__stat--main">
            <div className="terrain-hero__value">{elevation.meanMeters}m</div>
            <div className="terrain-hero__label">Mean Elevation</div>
          </div>
          <div className="terrain-hero__stat">
            <div className="terrain-hero__value">{elevation.maxMeters}m</div>
            <div className="terrain-hero__label">Max</div>
          </div>
        </div>
        <div className="terrain-hero__range">
          Relief: {elevation.rangeMeters}m · {elevation.rating}
        </div>
      </div>

      {/* Slope */}
      <div className="section-label">Slope Analysis</div>
      <div className="classification-item">
        <div className="classification-item__header">
          <div className="classification-item__name">
            <span className="classification-item__dot" style={{ backgroundColor: slope.color }} />
            Mean Slope
          </div>
          <RatingBadge rating={slope.rating} color={slope.color} />
        </div>
        <div className="thermal-layer__value">
          <span className="thermal-layer__number">{slope.meanDegrees}°</span>
          <span className="thermal-layer__unit"> (max {slope.maxDegrees}°)</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="dist-bar-labels">
            <span>Flat &lt;5° ({slope.flatPercent}%)</span>
            <span>Moderate ({slope.moderatePercent}%)</span>
            <span>Steep &gt;15° ({slope.steepPercent}%)</span>
          </div>
          <DistributionBar segments={[
            { percent: slope.flatPercent, color: '#68D391', label: 'Flat' },
            { percent: slope.moderatePercent, color: '#FFD43B', label: 'Moderate' },
            { percent: slope.steepPercent, color: '#FF6B6B', label: 'Steep' }
          ]} />
        </div>
      </div>

      {/* Aspect */}
      <div className="section-label" style={{ marginTop: 20 }}>Aspect &amp; Orientation</div>
      <div className="classification-item">
        <div className="classification-item__header">
          <div className="classification-item__name">
            <span className="classification-item__dot" style={{ backgroundColor: aspect.color }} />
            Dominant Aspect
          </div>
          <RatingBadge rating={aspect.rating} color={aspect.color} />
        </div>
        <div className="terrain-aspect-row">
          <div className="terrain-compass">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
              <text x="32" y="10" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">N</text>
              <text x="56" y="35" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">E</text>
              <text x="32" y="60" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">S</text>
              <text x="8" y="35" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">W</text>
              {/* Arrow pointing in dominant direction */}
              <line
                x1="32" y1="32"
                x2={32 + 20 * Math.sin(aspect.dominantBearing * Math.PI / 180)}
                y2={32 - 20 * Math.cos(aspect.dominantBearing * Math.PI / 180)}
                stroke={aspect.color} strokeWidth="2.5" strokeLinecap="round"
              />
              <circle cx="32" cy="32" r="3" fill={aspect.color} />
            </svg>
          </div>
          <div className="terrain-aspect-info">
            <div className="thermal-layer__value">
              <span className="thermal-layer__number">{aspect.dominantDirection}</span>
              <span className="thermal-layer__unit"> ({aspect.dominantBearing}°)</span>
            </div>
            <div className="thermal-layer__desc">
              {aspect.southFacingPercent}% faces south (135–225°)
            </div>
          </div>
        </div>
      </div>

      {/* Shading */}
      <div className="section-label" style={{ marginTop: 20 }}>Terrain Shading</div>
      <div className="classification-item">
        <div className="classification-item__header">
          <div className="classification-item__name">
            <span className="classification-item__dot" style={{ backgroundColor: shading.color }} />
            Shading Impact
          </div>
          <RatingBadge rating={shading.rating} color={shading.color} />
        </div>
        <div className="stats-grid" style={{ marginTop: 10, marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-card__label">Shaded Area</div>
            <div className="stat-card__value">{shading.shadedPercent}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Hillshade</div>
            <div className="stat-card__value">{shading.meanHillshade}</div>
          </div>
        </div>
      </div>

      {/* Solar Tilt Recommendation */}
      <div className="section-label" style={{ marginTop: 20 }}>Solar Panel Recommendation</div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Optimal Tilt</div>
          <div className="stat-card__value">{solarTilt.recommendedTiltDegrees}°</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Azimuth</div>
          <div className="stat-card__value">{solarTilt.recommendedAzimuthDegrees}°<span className="stat-card__unit"> S</span></div>
        </div>
        <div className="stat-card full-width">
          <div className="stat-card__label">Terrain Efficiency</div>
          <div className="stat-card__value">
            {(solarTilt.terrainEfficiencyFactor * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="recommendation-card">
        <div className="recommendation-card__text">{solarTilt.recommendation}</div>
      </div>

      {/* Data source */}
      <div className="stats-grid" style={{ marginTop: 8 }}>
        <div className="stat-card full-width">
          <div className="stat-card__label">Data Source</div>
          <div className="stat-card__value" style={{ fontSize: 11 }}>{result.dataSource}</div>
        </div>
      </div>
    </>
  )
}