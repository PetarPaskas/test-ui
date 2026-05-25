import React from 'react'

function RatingBadge({ rating }) {
  const colors = {
    'Very High': '#FF6B6B', 'High': '#FFA94D', 'Medium': '#FFD43B', 'Low': '#74C0FC'
  }
  return (
    <span className="rating-badge" style={{ color: colors[rating] || '#999', borderColor: colors[rating] || '#333' }}>
      {rating}
    </span>
  )
}

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export default function ThermalTab({ result, loading, error }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Fetching thermal data…</div>
        <div className="loading-subtext">
          Querying Sentinel-3 SLSTR for thermal IR and environmental layers
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
        <div className="empty-state__icon">🌡️</div>
        <div className="empty-state__title">Thermal data not loaded</div>
        <div className="empty-state__desc">
          Thermal &amp; environmental analysis from Sentinel-3 will load when this tab is opened.
        </div>
      </div>
    )
  }

  const { summary, layers, energySuitability: e, rooftopEstimation: roof } = result

  return (
    <>
      {/* Temperature Hero */}
      <div className="thermal-hero">
        <div className="thermal-hero__value">
          {summary.landSurfaceTemperatureCelsius}°C
        </div>
        <div className="thermal-hero__label">Land Surface Temperature</div>
        <div className="thermal-hero__range">
          {summary.lstMinCelsius}°C — {summary.lstMaxCelsius}°C
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Solar Irradiance</div>
          <div className="stat-card__value">
            {summary.solarIrradianceWm2}<span className="stat-card__unit"> W/m²</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Annual GHI</div>
          <div className="stat-card__value">
            {summary.annualSolarRadiationKwhM2}<span className="stat-card__unit"> kWh/m²</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">NDVI</div>
          <div className="stat-card__value">{summary.ndviMean}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Soil Moisture</div>
          <div className="stat-card__value">{summary.soilMoistureIndex}</div>
        </div>
      </div>

      {/* Environmental Layers */}
      <div className="section-label">Environmental Layers</div>
      <div className="classification-list">
        {layers.map((layer) => (
          <div key={layer.name} className="classification-item">
            <div className="classification-item__header">
              <div className="classification-item__name">
                <span className="classification-item__dot" style={{ backgroundColor: layer.color }} />
                {layer.name}
              </div>
              <RatingBadge rating={layer.rating} />
            </div>
            <div className="thermal-layer__value">
              <span className="thermal-layer__number">{layer.value}</span>
              {layer.unit && <span className="thermal-layer__unit"> {layer.unit}</span>}
            </div>
            <div className="thermal-layer__desc">{layer.description}</div>
          </div>
        ))}
      </div>

      {/* ── Full Area Solar Estimation ─────────────────────────────── */}
      <div className="section-label" style={{ marginTop: 24 }}>Solar Panel Estimation — Full Area</div>
      <div className="energy-card">
        <div className="energy-card__icon">☀️</div>
        <div className="energy-card__content">
          <div className="stats-grid" style={{ marginBottom: 12 }}>
            <div className="stat-card">
              <div className="stat-card__label">Usable Area</div>
              <div className="stat-card__value">
                {fmt(e.usableAreaM2)}<span className="stat-card__unit"> m²</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Utilization</div>
              <div className="stat-card__value">
                {(e.utilizationFactor * 100).toFixed(0)}<span className="stat-card__unit">%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Panels</div>
              <div className="stat-card__value">{fmt(e.solarPanelCount)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Capacity</div>
              <div className="stat-card__value">
                {fmt(e.solarCapacityKw)}<span className="stat-card__unit"> kW</span>
              </div>
            </div>
          </div>
          <div className="energy-highlight">
            <div className="energy-highlight__value">{fmt(e.solarEnergyKwhYear)}</div>
            <div className="energy-highlight__unit">kWh / year</div>
          </div>
        </div>
      </div>

      {/* ── Rooftop-Only Solar Estimation (from backend) ──────────── */}
      {roof && (
        <>
          <div className="section-label" style={{ marginTop: 20 }}>Solar Panel Estimation — Rooftop Only</div>
          <div className="energy-card rooftop-card">
            <div className="energy-card__icon">🏠</div>
            <div className="energy-card__content">
              <div className="rooftop-source">
                Estimated roof area: <strong>{roof.roofAreaM2} m²</strong>
              </div>
              <div className="stats-grid" style={{ marginBottom: 12 }}>
                <div className="stat-card">
                  <div className="stat-card__label">Usable Roof</div>
                  <div className="stat-card__value">
                    {roof.usableRoofM2}<span className="stat-card__unit"> m²</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__label">Utilization</div>
                  <div className="stat-card__value">75<span className="stat-card__unit">%</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__label">Panels</div>
                  <div className="stat-card__value">{roof.panelCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__label">Capacity</div>
                  <div className="stat-card__value">
                    {roof.capacityKw}<span className="stat-card__unit"> kW</span>
                  </div>
                </div>
              </div>
              <div className="energy-highlight rooftop-highlight">
                <div className="energy-highlight__value">{fmt(roof.energyKwhYear)}</div>
                <div className="energy-highlight__unit">kWh / year</div>
              </div>
              <div className="stats-grid" style={{ marginTop: 10, marginBottom: 0 }}>
                <div className="stat-card">
                  <div className="stat-card__label">Per Panel</div>
                  <div className="stat-card__value">
                    {roof.perPanelKwhYear}<span className="stat-card__unit"> kWh/yr</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__label">CO₂ Saved</div>
                  <div className="stat-card__value">
                    {roof.co2SavedTonnesYear}<span className="stat-card__unit"> t/yr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Wind Turbine Estimation ────────────────────────────────── */}
      <div className="section-label" style={{ marginTop: 20 }}>Mini Wind Turbine Estimation</div>
      <div className="energy-card">
        <div className="energy-card__icon">💨</div>
        <div className="energy-card__content">
          <div className="stats-grid" style={{ marginBottom: 12 }}>
            <div className="stat-card">
              <div className="stat-card__label">Rotor ⌀</div>
              <div className="stat-card__value">
                {e.rotorDiameterM}<span className="stat-card__unit"> m</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Spacing</div>
              <div className="stat-card__value">
                {e.areaPerTurbineM2}<span className="stat-card__unit"> m²</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Theoretical</div>
              <div className="stat-card__value">{e.windTurbineCountTheoretical}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Realistic</div>
              <div className="stat-card__value">{e.windTurbineCountRealistic}</div>
            </div>
          </div>
          <div className="energy-highlight">
            <div className="energy-highlight__value">{fmt(e.windEnergyKwhYear)}</div>
            <div className="energy-highlight__unit">kWh / year</div>
          </div>
          <div className="energy-disclaimer">{e.windDisclaimer}</div>
        </div>
      </div>

      {/* ── CO2 Savings ────────────────────────────────────────────── */}
      <div className="section-label" style={{ marginTop: 20 }}>Combined Impact</div>
      <div className="co2-card">
        <div className="co2-card__row">
          <div className="co2-card__stat">
            <div className="co2-card__value">{fmt(e.totalEnergyMwhYear)}</div>
            <div className="co2-card__label">MWh / year</div>
          </div>
          <div className="co2-card__divider" />
          <div className="co2-card__stat">
            <div className="co2-card__value co2-card__value--green">{e.co2SavedTonnesYear}</div>
            <div className="co2-card__label">tonnes CO₂ saved / year</div>
          </div>
        </div>
        <div className="co2-card__factor">Balkan grid emission factor: 0.4 tCO₂/MWh</div>
      </div>

      <div className="recommendation-card" style={{ marginTop: 16 }}>
        <div className="recommendation-card__text">{e.recommendation}</div>
      </div>

      <div className="stats-grid" style={{ marginTop: 16 }}>
        <div className="stat-card full-width">
          <div className="stat-card__label">Sentinel-3 Imagery</div>
          <div className="stat-card__value" style={{ fontSize: 12 }}>{result.acquisitionDate}</div>
        </div>
      </div>
    </>
  )
}