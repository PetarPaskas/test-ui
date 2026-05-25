const API_URL = 'https://recap-backend-hqdahxf3hwg8fwbc.westeurope-01.azurewebsites.net'

/**
 * Builds the polygon request body from an array of {lat, lng} vertices.
 */
function buildRequestBody(polygon) {
  return {
    polygon: polygon.map(p => ({ lat: p.lat, lng: p.lng }))
  }
}

async function post(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Server responded with ${response.status}`)
  }

  return response.json()
}

export async function fetchLandAnalysis(polygon) {
  return post('/api/analyze', buildRequestBody(polygon))
}

export async function fetchThermalAnalysis(polygon, { treatUnknownAsRooftop = false, unknownAreaM2 = 0, buildingAreaM2 = 0 } = {}) {
  return post('/api/thermal', {
    ...buildRequestBody(polygon),
    treatUnknownAsRooftop,
    unknownAreaM2,
    buildingAreaM2
  })
}

export async function fetchTerrainAnalysis(polygon) {
  return post('/api/terrain', buildRequestBody(polygon))
}