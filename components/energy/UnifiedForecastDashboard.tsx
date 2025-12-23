'use client'

import { useState, useEffect } from 'react'
import { UnifiedEnergyForecast } from '@/lib/unifiedForecast'

export default function UnifiedForecastDashboard() {
  const [forecasts, setForecasts] = useState<UnifiedEnergyForecast[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [selectedScenario, setSelectedScenario] = useState<'baseline' | 'moderate' | 'high_impact'>('baseline')
  const [comparisonMode, setComparisonMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/energy_futures/unified_energy_forecast_2025_2055.json')
        const data: UnifiedEnergyForecast[] = await response.json()

        setForecasts(data)

        // Set first county as default
        if (data.length > 0) {
          setSelectedCounty(data[0].fips)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading unified forecast:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="loading-indicator text-xl">Loading unified forecast...</div>
      </div>
    )
  }

  // Get unique counties
  const counties = Array.from(new Set(forecasts.map(f => ({
    fips: f.fips,
    name: `${f.county_name}, ${f.state}`
  })).map(c => JSON.stringify(c)))).map(c => JSON.parse(c))

  // Filter data
  const countyForecasts = forecasts.filter(f =>
    f.fips === selectedCounty &&
    (comparisonMode || f.scenario === selectedScenario)
  ).sort((a, b) => a.year - b.year)

  const years = Array.from(new Set(countyForecasts.map(f => f.year))).sort()

  // Get baseline scenario data for comparison
  const baselineData = countyForecasts.filter(f => f.scenario === 'baseline')
  const moderateData = countyForecasts.filter(f => f.scenario === 'moderate')
  const highImpactData = countyForecasts.filter(f => f.scenario === 'high_impact')

  // Current county info
  const currentCounty = counties.find(c => c.fips === selectedCounty)
  const baseline2024 = baselineData[0]?.baseline_energy_2024 || 0
  const forecast2055 = baselineData[baselineData.length - 1] || null

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
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
            Forecast Scenario
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedScenario('baseline'); setComparisonMode(false); }}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedScenario === 'baseline' && !comparisonMode ? 'shadow-lg' : ''}`}
              style={{
                background: selectedScenario === 'baseline' && !comparisonMode
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'var(--bg-tertiary)',
                color: selectedScenario === 'baseline' && !comparisonMode ? '#ffffff' : 'var(--text-primary)',
                border: selectedScenario === 'baseline' && !comparisonMode ? 'none' : '1px solid var(--border-color)'
              }}
            >
              Baseline
            </button>
            <button
              onClick={() => { setSelectedScenario('moderate'); setComparisonMode(false); }}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedScenario === 'moderate' && !comparisonMode ? 'shadow-lg' : ''}`}
              style={{
                background: selectedScenario === 'moderate' && !comparisonMode
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'var(--bg-tertiary)',
                color: selectedScenario === 'moderate' && !comparisonMode ? '#ffffff' : 'var(--text-primary)',
                border: selectedScenario === 'moderate' && !comparisonMode ? 'none' : '1px solid var(--border-color)'
              }}
            >
              Moderate Impact
            </button>
            <button
              onClick={() => { setSelectedScenario('high_impact'); setComparisonMode(false); }}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedScenario === 'high_impact' && !comparisonMode ? 'shadow-lg' : ''}`}
              style={{
                background: selectedScenario === 'high_impact' && !comparisonMode
                  ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                  : 'var(--bg-tertiary)',
                color: selectedScenario === 'high_impact' && !comparisonMode ? '#ffffff' : 'var(--text-primary)',
                border: selectedScenario === 'high_impact' && !comparisonMode ? 'none' : '1px solid var(--border-color)'
              }}
            >
              High Impact
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-4 py-2 rounded-lg font-semibold ${comparisonMode ? 'shadow-lg' : ''}`}
            style={{
              background: comparisonMode
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'var(--bg-tertiary)',
              color: comparisonMode ? '#ffffff' : 'var(--text-primary)',
              border: comparisonMode ? 'none' : '1px solid var(--border-color)'
            }}
          >
            {comparisonMode ? '✓ Compare All Scenarios' : 'Compare Scenarios'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <h3 className="stat-card-title">Baseline Energy (2024)</h3>
          <p className="stat-card-value">{baseline2024.toFixed(1)} GWh</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Forecast (2055)</h3>
          <p className="stat-card-value stat-card-accent">{forecast2055?.total_energy_forecast.toFixed(1) || 0} GWh</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Total Change</h3>
          <p className="stat-card-value" style={{ color: (forecast2055?.total_change_pct || 0) > 0 ? '#dc2626' : '#10b981' }}>
            {forecast2055?.total_change_pct || 0 > 0 ? '+' : ''}{forecast2055?.total_change_pct.toFixed(1) || 0}%
          </p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Renewable Share (2055)</h3>
          <p className="stat-card-value" style={{ color: '#10b981' }}>{forecast2055?.renewable_share_pct || 0}%</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Per Capita (2055)</h3>
          <p className="stat-card-value">{forecast2055?.per_capita_kwh.toLocaleString() || 0} kWh</p>
        </div>
      </div>

      {/* Main Timeline Chart */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          30-Year Energy Forecast: {currentCounty?.name}
        </h3>

        <svg width="100%" height="400" viewBox="0 0 900 400" style={{ maxWidth: '100%' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={80}
              y1={40 + 300 * ratio}
              x2={860}
              y2={40 + 300 * ratio}
              stroke="var(--border-color)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Y-axis labels */}
          {baselineData.length > 0 && [0, 0.5, 1].map((ratio, i) => {
            const maxEnergy = Math.max(...countyForecasts.map(d => d.total_energy_forecast))
            const energy = maxEnergy * (1 - ratio)

            return (
              <text
                key={i}
                x={70}
                y={40 + 300 * ratio}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {energy.toFixed(0)} GWh
              </text>
            )
          })}

          {/* X-axis labels */}
          {years.map((year, i) => {
            const x = 80 + (780 / (years.length - 1)) * i
            return (
              <text
                key={year}
                x={x}
                y={360}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {year}
              </text>
            )
          })}

          {/* Baseline scenario line */}
          {baselineData.length > 1 && (() => {
            const maxEnergy = Math.max(...countyForecasts.map(d => d.total_energy_forecast))
            const yScale = (energy: number) => 40 + 300 - (energy / maxEnergy) * 300

            const pathData = baselineData.map((d, i) => {
              const x = 80 + (780 / (years.length - 1)) * i
              const y = yScale(d.total_energy_forecast)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            return (
              <path
                d={pathData}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )
          })()}

          {/* Moderate scenario line (if comparison mode) */}
          {comparisonMode && moderateData.length > 1 && (() => {
            const maxEnergy = Math.max(...countyForecasts.map(d => d.total_energy_forecast))
            const yScale = (energy: number) => 40 + 300 - (energy / maxEnergy) * 300

            const pathData = moderateData.map((d, i) => {
              const x = 80 + (780 / (years.length - 1)) * i
              const y = yScale(d.total_energy_forecast)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            return (
              <path
                d={pathData}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
              />
            )
          })()}

          {/* High impact scenario line (if comparison mode) */}
          {comparisonMode && highImpactData.length > 1 && (() => {
            const maxEnergy = Math.max(...countyForecasts.map(d => d.total_energy_forecast))
            const yScale = (energy: number) => 40 + 300 - (energy / maxEnergy) * 300

            const pathData = highImpactData.map((d, i) => {
              const x = 80 + (780 / (years.length - 1)) * i
              const y = yScale(d.total_energy_forecast)
              return `${i === 0 ? 'M' : 'L'}${x},${y}`
            }).join(' ')

            return (
              <path
                d={pathData}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8,4"
              />
            )
          })()}
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ background: '#10b981' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Baseline Scenario</span>
          </div>
          {comparisonMode && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-dashed border-t-2" style={{ borderColor: '#f97316' }}></div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Moderate Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-dashed border-t-2" style={{ borderColor: '#dc2626' }}></div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>High Impact</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Factor Contributions (Stacked Area Chart) */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Energy Change Factors ({selectedScenario} scenario)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded" style={{ background: '#10b98120', border: '1px solid #10b981' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>💡 Innovation Savings</div>
            <div className="text-lg font-bold" style={{ color: '#10b981' }}>
              {forecast2055?.innovation_savings.toFixed(1) || 0} GWh
            </div>
          </div>

          <div className="p-3 rounded" style={{ background: '#dc262620', border: '1px solid #dc2626' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🌡️ Climate Increase</div>
            <div className="text-lg font-bold" style={{ color: '#dc2626' }}>
              +{forecast2055?.climate_increase.toFixed(1) || 0} GWh
            </div>
          </div>

          <div className="p-3 rounded" style={{ background: '#3b82f620', border: '1px solid #3b82f6' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🚚 Migration Change</div>
            <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>
              {forecast2055?.migration_change >= 0 ? '+' : ''}{forecast2055?.migration_change.toFixed(1) || 0} GWh
            </div>
          </div>

          <div className="p-3 rounded" style={{ background: '#f9731620', border: '1px solid #f97316' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>⚠️ Disaster Energy</div>
            <div className="text-lg font-bold" style={{ color: '#f97316' }}>
              +{forecast2055?.disaster_energy.toFixed(1) || 0} GWh
            </div>
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong>Net Impact:</strong> {forecast2055?.total_change_pct > 0 ? 'Increase' : 'Decrease'} of <strong>{Math.abs(forecast2055?.total_change_pct || 0).toFixed(1)}%</strong> from 2024 baseline.
          {forecast2055?.innovation_savings && Math.abs(forecast2055.innovation_savings) > (forecast2055.climate_increase || 0) &&
            " Innovation efficiency gains more than offset climate-driven increases."}
        </p>
      </div>

      {/* Energy Mix Projection */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Energy Mix Evolution
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {baselineData.map((data, i) => {
            const renewable_h = (data.renewable_share_pct / 100) * 200
            const fossil_h = (data.fossil_share_pct / 100) * 200

            return (
              <div key={i} className="text-center">
                <div className="text-xs mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {data.year}
                </div>
                <div className="flex flex-col-reverse" style={{ height: '200px', position: 'relative' }}>
                  <div
                    style={{
                      height: `${renewable_h}px`,
                      background: 'linear-gradient(to top, #10b981, #059669)',
                      borderRadius: '4px 4px 0 0'
                    }}
                    title={`Renewable: ${data.renewable_share_pct}%`}
                  ></div>
                  <div
                    style={{
                      height: `${fossil_h}px`,
                      background: 'linear-gradient(to top, #6b7280, #4b5563)',
                      borderRadius: '0 0 4px 4px'
                    }}
                    title={`Fossil: ${data.fossil_share_pct}%`}
                  ></div>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {data.renewable_share_pct}%
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'linear-gradient(to top, #10b981, #059669)' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Renewable Energy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'linear-gradient(to top, #6b7280, #4b5563)' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Fossil Fuels</span>
          </div>
        </div>
      </div>
    </div>
  )
}
