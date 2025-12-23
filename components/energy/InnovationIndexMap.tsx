'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface InnovationData {
  fips: string
  county_name: string
  state: string
  innovation_index: number
  innovation_category: string
  innovation_percentile: number
  patents_per_1000?: number
  stem_employment_pct?: number
  broadband_penetration?: number
  manufacturing_gdp_share?: number
  clean_energy_adoption?: number
  automation_index?: number
}

export default function InnovationIndexMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [innovationData, setInnovationData] = useState<Record<string, InnovationData>>({})
  const [hoveredCounty, setHoveredCounty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Load innovation data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/energy_futures/innovation/innovation_index_sample.json')
        const data: InnovationData[] = await response.json()

        // Convert array to object keyed by FIPS
        const dataMap: Record<string, InnovationData> = {}
        data.forEach(county => {
          dataMap[county.fips] = county
        })

        setInnovationData(dataMap)
        setLoading(false)
      } catch (error) {
        console.error('Error loading innovation data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Get color for innovation index
  const getColorForInnovation = (index: number | null): string => {
    if (index === null || index === undefined) return '#d1d5db' // Gray for no data

    // Orange to purple gradient for innovation
    if (index >= 75) return '#7c2d12' // Very dark brown/orange (Very High)
    if (index >= 60) return '#ea580c' // Dark orange (High)
    if (index >= 40) return '#f97316' // Orange (Medium-High)
    if (index >= 25) return '#fb923c' // Light orange (Medium)
    return '#fed7aa' // Very light orange (Low)
  }

  // Create map
  useEffect(() => {
    if (!mapContainer.current || map.current || loading) return
    if (Object.keys(innovationData).length === 0) return

    const newMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#f0f0f0'
          }
        }]
      },
      center: [-98.5, 39.8],
      zoom: 3.5
    })

    newMap.addControl(new maplibregl.NavigationControl(), 'top-right')

    newMap.on('load', async () => {
      // Load GeoJSON
      try {
        const geojsonResponse = await fetch('/data/us_counties.geojson')
        const geojson = await geojsonResponse.json()

        newMap.addSource('counties', {
          type: 'geojson',
          data: geojson
        })

        newMap.addLayer({
          id: 'counties-fill',
          type: 'fill',
          source: 'counties',
          paint: {
            'fill-color': '#e5e7eb',
            'fill-opacity': 0.9,
            'fill-antialias': true
          }
        })

        newMap.addLayer({
          id: 'counties-outline',
          type: 'line',
          source: 'counties',
          paint: {
            'line-color': '#ffffff',
            'line-width': 0.5,
            'line-opacity': 0.5
          }
        })

        // Color counties by innovation index
        const fillExpression: any[] = ['match', ['to-string', ['get', 'GEOID']]]

        Object.entries(innovationData).forEach(([fips, data]) => {
          const color = getColorForInnovation(data.innovation_index)
          fillExpression.push(fips, color)
        })

        fillExpression.push('#e5e7eb') // Default color

        newMap.setPaintProperty('counties-fill', 'fill-color', fillExpression as any)

        // Add hover
        newMap.on('mousemove', 'counties-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const fips = String(feature.properties?.GEOID || '').trim().padStart(5, '0')
            const data = innovationData[fips]

            if (data) {
              setHoveredCounty(data)
              newMap.getCanvas().style.cursor = 'pointer'
            }
          }
        })

        newMap.on('mouseleave', 'counties-fill', () => {
          setHoveredCounty(null)
          newMap.getCanvas().style.cursor = ''
        })
      } catch (error) {
        console.error('Error loading GeoJSON:', error)
      }
    })

    map.current = newMap

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [loading, innovationData])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="loading-indicator text-xl">Loading innovation data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="legend-container">
        <h4 className="legend-title">Innovation Index Score (0-100)</h4>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#fed7aa'}}></div>
            <span>Low (0-25)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#fb923c'}}></div>
            <span>Medium (25-40)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#f97316'}}></div>
            <span>Med-High (40-60)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#ea580c'}}></div>
            <span>High (60-75)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#7c2d12'}}></div>
            <span>Very High (75-100)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#d1d5db'}}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapContainer} className="h-[600px] rounded-lg shadow-lg" style={{ border: '1px solid var(--border-color)' }} />
      </div>

      {/* Hover Tooltip */}
      {hoveredCounty && (
        <div className="county-tooltip" style={{ background: 'var(--bg-secondary)', border: `2px solid var(--accent-blue)` }}>
          <h3 className="font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>
            {hoveredCounty.county_name} County, {hoveredCounty.state}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Innovation Index</span>
              <div className="font-bold text-2xl" style={{ color: 'var(--accent-blue)' }}>
                {hoveredCounty.innovation_index?.toFixed(1)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {hoveredCounty.innovation_category}
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>National Percentile</span>
              <div className="font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                {hoveredCounty.innovation_percentile}th
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Patents per 1,000</span>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {hoveredCounty.patents_per_1000?.toFixed(2) || 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>STEM Employment</span>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {hoveredCounty.stem_employment_pct?.toFixed(1) || 'N/A'}%
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Broadband Access</span>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {hoveredCounty.broadband_penetration?.toFixed(0) || 'N/A'}%
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Clean Energy Adoption</span>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {hoveredCounty.clean_energy_adoption?.toFixed(0) || 'N/A'}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="stat-card-title">Counties Analyzed</h3>
          <p className="stat-card-value">{Object.keys(innovationData).length}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Avg Innovation Score</h3>
          <p className="stat-card-value stat-card-accent">
            {(Object.values(innovationData).reduce((sum, c) => sum + (c.innovation_index || 0), 0) / Object.keys(innovationData).length).toFixed(1)}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">High Innovation Counties</h3>
          <p className="stat-card-value" style={{ color: '#10b981' }}>
            {Object.values(innovationData).filter(c => (c.innovation_index || 0) >= 60).length}
          </p>
        </div>
      </div>
    </div>
  )
}
