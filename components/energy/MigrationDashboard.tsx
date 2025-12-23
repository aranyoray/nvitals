'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CountyMigrationProfile, MigrationFlow } from '@/lib/migrationModel'

export default function MigrationDashboard() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  const [migrationFlows, setMigrationFlows] = useState<MigrationFlow[]>([])
  const [countyProfiles, setCountyProfiles] = useState<CountyMigrationProfile[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2055)
  const [loading, setLoading] = useState(true)

  // Overlay controls with checkboxes
  const [showInnovation, setShowInnovation] = useState(false)
  const [showPopulationGrowth, setShowPopulationGrowth] = useState(true)
  const [showMigrationFlows, setShowMigrationFlows] = useState(true)
  const [showEnergyImpact, setShowEnergyImpact] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [flowsRes, profilesRes] = await Promise.all([
          fetch('/data/energy_futures/migration/migration_flows_2025_2055.json'),
          fetch('/data/energy_futures/migration/county_migration_profiles.json')
        ])

        const flows: MigrationFlow[] = await flowsRes.json()
        const profiles: CountyMigrationProfile[] = await profilesRes.json()

        setMigrationFlows(flows)
        setCountyProfiles(profiles)
        setLoading(false)
      } catch (error) {
        console.error('Error loading migration data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter data by selected year
  const yearFlows = migrationFlows.filter(f => f.year === selectedYear)
  const yearProfiles = countyProfiles.filter(p => p.year === selectedYear)

  // Get color based on active overlays
  const getCountyColor = (profile: CountyMigrationProfile): string => {
    if (showEnergyImpact) {
      // Color by energy demand change
      const change = profile.energy_change_pct
      if (change > 20) return '#dc2626'     // High increase (red)
      if (change > 10) return '#f97316'     // Moderate increase (orange)
      if (change > 0) return '#facc15'      // Small increase (yellow)
      if (change > -10) return '#a3e635'    // Small decrease (light green)
      return '#10b981'                       // Decrease (green)
    }

    if (showPopulationGrowth) {
      // Color by net migration rate
      const rate = profile.net_migration_rate
      if (rate > 2) return '#10b981'        // High growth (green)
      if (rate > 0.5) return '#84cc16'      // Moderate growth
      if (rate > -0.5) return '#facc15'     // Stable (yellow)
      if (rate > -2) return '#f97316'       // Declining (orange)
      return '#dc2626'                       // High decline (red)
    }

    return '#9ca3af' // Gray default
  }

  // Stats
  const totalMigrants = yearFlows.reduce((sum, f) => sum + f.net_migrants, 0)
  const ruralToUrban = yearFlows.filter(f => f.flow_type === 'rural_to_urban')
  const avgGrowthRate = yearProfiles.length > 0
    ? yearProfiles.reduce((sum, p) => sum + p.net_migration_rate, 0) / yearProfiles.length
    : 0

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="loading-indicator text-xl">Loading migration data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Projection Year:
        </label>
        <div className="flex gap-2 flex-wrap">
          {[2025, 2030, 2035, 2040, 2045, 2050, 2055].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg font-semibold ${selectedYear === year ? 'shadow-lg' : ''}`}
              style={{
                background: selectedYear === year
                  ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                  : 'var(--bg-tertiary)',
                color: selectedYear === year ? '#ffffff' : 'var(--text-primary)',
                border: selectedYear === year ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay Controls - Checkboxes */}
      <div className="panel p-4">
        <h4 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          🎛️ Map Overlays (Toggle Layers)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={showPopulationGrowth}
              onChange={(e) => setShowPopulationGrowth(e.target.checked)}
              style={{
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Population Growth
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={showMigrationFlows}
              onChange={(e) => setShowMigrationFlows(e.target.checked)}
              style={{
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Migration Arrows
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={showEnergyImpact}
              onChange={(e) => setShowEnergyImpact(e.target.checked)}
              style={{
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Energy Impact
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer opacity-50">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={showInnovation}
              onChange={(e) => setShowInnovation(e.target.checked)}
              disabled
              style={{
                accentColor: '#3b82f6',
                cursor: 'not-allowed'
              }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Innovation Index <span className="text-xs">(soon)</span>
            </span>
          </label>
        </div>

        {/* Active layer indicator */}
        <div className="mt-3 text-xs p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--text-primary)' }}>
          Active: {showPopulationGrowth && 'Population Growth • '}
          {showMigrationFlows && 'Migration Flows • '}
          {showEnergyImpact && 'Energy Impact'}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <h3 className="stat-card-title">Total Migration ({selectedYear})</h3>
          <p className="stat-card-value">{totalMigrants.toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Rural → Urban Flows</h3>
          <p className="stat-card-value" style={{ color: '#10b981' }}>{ruralToUrban.length}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Avg Growth Rate</h3>
          <p className="stat-card-value stat-card-accent">{avgGrowthRate.toFixed(2)}%</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Growing Counties</h3>
          <p className="stat-card-value" style={{ color: '#10b981' }}>
            {yearProfiles.filter(p => p.is_growing).length}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-container">
        <h4 className="legend-title">
          {showEnergyImpact ? 'Energy Demand Change (%)' : 'Net Migration Rate (%)'}
        </h4>
        <div className="flex gap-2 items-center flex-wrap">
          {showEnergyImpact ? (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#10b981'}}></div>
                <span>Decrease</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#facc15'}}></div>
                <span>Stable</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#f97316'}}></div>
                <span>+10-20%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#dc2626'}}></div>
                <span>&gt;+20%</span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#10b981'}}></div>
                <span>High Growth (&gt;2%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#84cc16'}}></div>
                <span>Growing (0.5-2%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#facc15'}}></div>
                <span>Stable (±0.5%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#f97316'}}></div>
                <span>Declining (-0.5 to -2%)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#dc2626'}}></div>
                <span>High Decline (&lt;-2%)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Migration Flow List */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Major Migration Flows ({selectedYear})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>From</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>To</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Migrants</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Flow Type</th>
                <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Energy Impact (GWh)</th>
              </tr>
            </thead>
            <tbody>
              {yearFlows
                .sort((a, b) => b.net_migrants - a.net_migrants)
                .slice(0, 10)
                .map((flow, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {flow.from_county}, {flow.from_state}
                    </td>
                    <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {flow.to_county}, {flow.to_state}
                    </td>
                    <td className="py-2 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                      {flow.net_migrants.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          background: flow.flow_type === 'rural_to_urban' ? '#10b98120' : '#3b82f620',
                          color: flow.flow_type === 'rural_to_urban' ? '#10b981' : '#3b82f6'
                        }}
                      >
                        {flow.flow_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3" style={{ color: 'var(--accent-blue)' }}>
                      {flow.energy_demand_change.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* County Profiles */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          County Migration Profiles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearProfiles
            .sort((a, b) => Math.abs(b.net_migration) - Math.abs(a.net_migration))
            .slice(0, 9)
            .map((profile, i) => (
              <div
                key={i}
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `2px solid ${profile.is_growing ? '#10b981' : '#dc2626'}`
                }}
              >
                <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {profile.county_name}, {profile.state}
                </h4>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Urbanization:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {profile.urbanization_level}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Net Migration:</span>
                    <span
                      className="font-semibold"
                      style={{ color: profile.net_migration > 0 ? '#10b981' : '#dc2626' }}
                    >
                      {profile.net_migration > 0 ? '+' : ''}{profile.net_migration.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Growth Rate:</span>
                    <span className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
                      {profile.net_migration_rate.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Energy Change:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {profile.energy_change_pct > 0 ? '+' : ''}{profile.energy_change_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
