'use client'

import { useState, useEffect } from 'react'
import { ClimateProjection } from '@/lib/climateEnergy'

export default function ClimateEnergyDashboard() {
  const [climateData, setClimateData] = useState<ClimateProjection[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [selectedScenario, setSelectedScenario] = useState<'RCP45' | 'RCP85'>('RCP45')
  const [loading, setLoading] = useState(true)

  // Load climate data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/energy_futures/climate/climate_projections_2025_2055.json')
        const data: ClimateProjection[] = await response.json()
        setClimateData(data)

        // Set first county as default
        if (data.length > 0) {
          setSelectedCounty(data[0].fips)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading climate data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="loading-indicator text-xl">Loading climate projections...</div>
      </div>
    )
  }

  // Get unique counties
  const counties = Array.from(new Set(climateData.map(d => ({
    fips: d.fips,
    name: `${d.county_name}, ${d.state}`
  })).map(c => JSON.stringify(c)))).map(c => JSON.parse(c))

  // Filter data for selected county and scenario
  const filteredData = climateData
    .filter(d => d.fips === selectedCounty && d.scenario === selectedScenario)
    .sort((a, b) => a.year - b.year)

  const years = filteredData.map(d => d.year)

  // Get current county info
  const currentCounty = counties.find(c => c.fips === selectedCounty)

  // Calculate statistics
  const currentData = filteredData[0] // 2025
  const futureData = filteredData[filteredData.length - 1] // 2055

  const tempIncrease = futureData ? futureData.avg_temp - currentData.avg_temp : 0
  const coolingIncrease = futureData ? futureData.cooling_increase_pct : 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Select County
          </label>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {counties.map(county => (
              <option key={county.fips} value={county.fips}>
                {county.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Climate Scenario
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedScenario('RCP45')}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedScenario === 'RCP45' ? 'shadow-lg' : ''}`}
              style={{
                background: selectedScenario === 'RCP45'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'var(--bg-tertiary)',
                color: selectedScenario === 'RCP45' ? '#ffffff' : 'var(--text-primary)',
                border: selectedScenario === 'RCP45' ? 'none' : '1px solid var(--border-color)'
              }}
            >
              RCP 4.5 (Moderate)
            </button>
            <button
              onClick={() => setSelectedScenario('RCP85')}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedScenario === 'RCP85' ? 'shadow-lg' : ''}`}
              style={{
                background: selectedScenario === 'RCP85'
                  ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                  : 'var(--bg-tertiary)',
                color: selectedScenario === 'RCP85' ? '#ffffff' : 'var(--text-primary)',
                border: selectedScenario === 'RCP85' ? 'none' : '1px solid var(--border-color)'
              }}
            >
              RCP 8.5 (High)
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <h3 className="stat-card-title">Temperature Increase (2025→2055)</h3>
          <p className="stat-card-value" style={{ color: '#dc2626' }}>+{tempIncrease.toFixed(1)}°F</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Cooling Demand Increase</h3>
          <p className="stat-card-value" style={{ color: '#f59e0b' }}>+{coolingIncrease.toFixed(1)}%</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Extreme Heat Days (2055)</h3>
          <p className="stat-card-value" style={{ color: '#ea580c' }}>
            {futureData?.extreme_heat_days.toFixed(0) || 0}
          </p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Total Climate Energy (2055)</h3>
          <p className="stat-card-value stat-card-accent">
            {futureData?.total_climate_energy.toFixed(0) || 0} GWh
          </p>
        </div>
      </div>

      {/* Temperature Projection Chart */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Temperature Projection: {currentCounty?.name}
        </h3>

        <svg width="100%" height="300" viewBox="0 0 800 300" style={{ maxWidth: '100%' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={80}
              y1={40 + 220 * ratio}
              x2={760}
              y2={40 + 220 * ratio}
              stroke="var(--border-color)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Y-axis labels (Temperature) */}
          {filteredData.length > 0 && [0, 0.5, 1].map((ratio, i) => {
            const minTemp = Math.min(...filteredData.map(d => d.avg_temp))
            const maxTemp = Math.max(...filteredData.map(d => d.avg_temp))
            const temp = minTemp + (maxTemp - minTemp) * (1 - ratio)

            return (
              <text
                key={i}
                x={70}
                y={40 + 220 * ratio}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {temp.toFixed(0)}°F
              </text>
            )
          })}

          {/* X-axis labels (Years) */}
          {years.map((year, i) => {
            const x = 80 + (680 / (years.length - 1)) * i
            return (
              <text
                key={year}
                x={x}
                y={275}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {year}
              </text>
            )
          })}

          {/* Temperature line */}
          {filteredData.length > 1 && (() => {
            const minTemp = Math.min(...filteredData.map(d => d.avg_temp))
            const maxTemp = Math.max(...filteredData.map(d => d.avg_temp))
            const yScale = (temp: number) => 40 + 220 - ((temp - minTemp) / (maxTemp - minTemp)) * 220

            const pathData = filteredData.map((d, i) => {
              const x = 80 + (680 / (years.length - 1)) * i
              const y = yScale(d.avg_temp)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke={selectedScenario === 'RCP85' ? '#dc2626' : '#10b981'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {filteredData.map((d, i) => {
                  const x = 80 + (680 / (years.length - 1)) * i
                  const y = yScale(d.avg_temp)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="5"
                      fill={selectedScenario === 'RCP85' ? '#dc2626' : '#10b981'}
                      stroke="var(--bg-secondary)"
                      strokeWidth="2"
                    />
                  )
                })}
              </>
            )
          })()}
        </svg>
      </div>

      {/* Energy Demand Chart */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Cooling vs. Heating Energy Demand
        </h3>

        <svg width="100%" height="350" viewBox="0 0 800 350" style={{ maxWidth: '100%' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={80}
              y1={40 + 260 * ratio}
              x2={760}
              y2={40 + 260 * ratio}
              stroke="var(--border-color)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Y-axis labels (Energy GWh) */}
          {filteredData.length > 0 && [0, 0.5, 1].map((ratio, i) => {
            const maxEnergy = Math.max(...filteredData.map(d =>
              Math.max(d.cooling_energy_demand, d.heating_energy_demand)
            ))
            const energy = maxEnergy * (1 - ratio)

            return (
              <text
                key={i}
                x={70}
                y={40 + 260 * ratio}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {energy.toFixed(0)} GWh
              </text>
            )
          })}

          {/* X-axis */}
          {years.map((year, i) => {
            const x = 80 + (680 / (years.length - 1)) * i
            return (
              <text
                key={year}
                x={x}
                y={320}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {year}
              </text>
            )
          })}

          {/* Cooling demand line (red) */}
          {filteredData.length > 1 && (() => {
            const maxEnergy = Math.max(...filteredData.map(d =>
              Math.max(d.cooling_energy_demand, d.heating_energy_demand)
            ))
            const yScale = (energy: number) => 40 + 260 - (energy / maxEnergy) * 260

            const coolingPath = filteredData.map((d, i) => {
              const x = 80 + (680 / (years.length - 1)) * i
              const y = yScale(d.cooling_energy_demand)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            const heatingPath = filteredData.map((d, i) => {
              const x = 80 + (680 / (years.length - 1)) * i
              const y = yScale(d.heating_energy_demand)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            return (
              <>
                <path
                  d={coolingPath}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d={heatingPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                />
              </>
            )
          })()}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ background: '#dc2626' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cooling Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-dashed border-t-2" style={{ borderColor: '#3b82f6' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Heating Demand</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Detailed Projections
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Year</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Avg Temp (°F)</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Cooling (GWh)</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Heating (GWh)</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Extreme Heat Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="py-2 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>{d.year}</td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{d.avg_temp.toFixed(1)}</td>
                  <td className="py-2 px-3" style={{ color: '#dc2626' }}>{d.cooling_energy_demand.toFixed(1)}</td>
                  <td className="py-2 px-3" style={{ color: '#3b82f6' }}>{d.heating_energy_demand.toFixed(1)}</td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{d.extreme_heat_days.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
