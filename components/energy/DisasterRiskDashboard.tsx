'use client'

import { useState, useEffect } from 'react'
import { CountyDisasterProfile, DisasterEvent } from '@/lib/disasterRisk'

export default function DisasterRiskDashboard() {
  const [disasterProfiles, setDisasterProfiles] = useState<CountyDisasterProfile[]>([])
  const [disasterEvents, setDisasterEvents] = useState<DisasterEvent[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2055)
  const [loading, setLoading] = useState(true)

  // Overlay controls
  const [showOverallRisk, setShowOverallRisk] = useState(true)
  const [showHurricaneRisk, setShowHurricaneRisk] = useState(false)
  const [showTornadoRisk, setShowTornadoRisk] = useState(false)
  const [showWildfireRisk, setShowWildfireRisk] = useState(false)
  const [showFloodRisk, setShowFloodRisk] = useState(false)
  const [showExtremeHeatRisk, setShowExtremeHeatRisk] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilesRes, eventsRes] = await Promise.all([
          fetch('/data/energy_futures/extreme_events/disaster_risk_profiles.json'),
          fetch('/data/energy_futures/extreme_events/disaster_events_2025_2055.json')
        ])

        const profiles: CountyDisasterProfile[] = await profilesRes.json()
        const events: DisasterEvent[] = await eventsRes.json()

        setDisasterProfiles(profiles)
        setDisasterEvents(events)
        setLoading(false)
      } catch (error) {
        console.error('Error loading disaster data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter data by selected year
  const yearProfiles = disasterProfiles.filter(p => p.year === selectedYear)
  const yearEvents = disasterEvents.filter(e => e.year === selectedYear)

  // Get color based on active risk layer
  const getRiskColor = (profile: CountyDisasterProfile): string => {
    let riskScore = profile.overall_risk_score

    if (showHurricaneRisk) riskScore = profile.hurricane_risk
    else if (showTornadoRisk) riskScore = profile.tornado_risk
    else if (showWildfireRisk) riskScore = profile.wildfire_risk
    else if (showFloodRisk) riskScore = profile.flood_risk
    else if (showExtremeHeatRisk) riskScore = profile.extreme_heat_risk

    // Color scale
    if (riskScore >= 70) return '#7f1d1d'  // Very high (dark red)
    if (riskScore >= 50) return '#dc2626'  // High (red)
    if (riskScore >= 30) return '#f97316'  // Moderate (orange)
    if (riskScore >= 15) return '#facc15'  // Low-moderate (yellow)
    return '#10b981'                        // Low (green)
  }

  // Get active risk type name
  const getActiveRiskType = (): string => {
    if (showHurricaneRisk) return 'Hurricane Risk'
    if (showTornadoRisk) return 'Tornado Risk'
    if (showWildfireRisk) return 'Wildfire Risk'
    if (showFloodRisk) return 'Flood Risk'
    if (showExtremeHeatRisk) return 'Extreme Heat Risk'
    return 'Overall Disaster Risk'
  }

  // Stats
  const veryHighRisk = yearProfiles.filter(p => p.risk_category === 'very_high').length
  const highRisk = yearProfiles.filter(p => p.risk_category === 'high').length
  const totalDisasterEnergy = yearProfiles.reduce((sum, p) => sum + p.total_annual_disaster_energy, 0)
  const avgRiskScore = yearProfiles.length > 0
    ? yearProfiles.reduce((sum, p) => sum + p.overall_risk_score, 0) / yearProfiles.length
    : 0

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="loading-indicator text-xl">Loading disaster risk data...</div>
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
                  ? 'linear-gradient(135deg, #dc2626, #991b1b)'
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

      {/* Disaster Type Overlays - Checkboxes */}
      <div className="panel p-4">
        <h4 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          ⚠️ Disaster Type Overlays (Select One)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showOverallRisk}
              onChange={() => {
                setShowOverallRisk(true)
                setShowHurricaneRisk(false)
                setShowTornadoRisk(false)
                setShowWildfireRisk(false)
                setShowFloodRisk(false)
                setShowExtremeHeatRisk(false)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Overall Risk
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showHurricaneRisk}
              onChange={() => {
                setShowOverallRisk(false)
                setShowHurricaneRisk(true)
                setShowTornadoRisk(false)
                setShowWildfireRisk(false)
                setShowFloodRisk(false)
                setShowExtremeHeatRisk(false)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🌀 Hurricane
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showTornadoRisk}
              onChange={() => {
                setShowOverallRisk(false)
                setShowHurricaneRisk(false)
                setShowTornadoRisk(true)
                setShowWildfireRisk(false)
                setShowFloodRisk(false)
                setShowExtremeHeatRisk(false)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🌪️ Tornado
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showWildfireRisk}
              onChange={() => {
                setShowOverallRisk(false)
                setShowHurricaneRisk(false)
                setShowTornadoRisk(false)
                setShowWildfireRisk(true)
                setShowFloodRisk(false)
                setShowExtremeHeatRisk(false)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🔥 Wildfire
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showFloodRisk}
              onChange={() => {
                setShowOverallRisk(false)
                setShowHurricaneRisk(false)
                setShowTornadoRisk(false)
                setShowWildfireRisk(false)
                setShowFloodRisk(true)
                setShowExtremeHeatRisk(false)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🌊 Flood
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="disaster-type"
              className="w-5 h-5 cursor-pointer"
              checked={showExtremeHeatRisk}
              onChange={() => {
                setShowOverallRisk(false)
                setShowHurricaneRisk(false)
                setShowTornadoRisk(false)
                setShowWildfireRisk(false)
                setShowFloodRisk(false)
                setShowExtremeHeatRisk(true)
              }}
              style={{ accentColor: '#dc2626' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              ☀️ Extreme Heat
            </span>
          </label>
        </div>

        {/* Active layer indicator */}
        <div className="mt-3 text-xs p-2 rounded" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--text-primary)' }}>
          Active View: <strong>{getActiveRiskType()}</strong>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <h3 className="stat-card-title">Avg Risk Score ({selectedYear})</h3>
          <p className="stat-card-value" style={{ color: '#dc2626' }}>{avgRiskScore.toFixed(0)}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">High Risk Counties</h3>
          <p className="stat-card-value" style={{ color: '#f97316' }}>{highRisk}</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Total Disaster Energy</h3>
          <p className="stat-card-value stat-card-accent">{totalDisasterEnergy.toFixed(0)} GWh</p>
        </div>

        <div className="stat-card">
          <h3 className="stat-card-title">Disaster Events Projected</h3>
          <p className="stat-card-value" style={{ color: '#10b981' }}>{yearEvents.length}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-container">
        <h4 className="legend-title">{getActiveRiskType()} (0-100 Scale)</h4>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#10b981'}}></div>
            <span>Low (0-15)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#facc15'}}></div>
            <span>Low-Mod (15-30)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#f97316'}}></div>
            <span>Moderate (30-50)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#dc2626'}}></div>
            <span>High (50-70)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#7f1d1d'}}></div>
            <span>Very High (70-100)</span>
          </div>
        </div>
      </div>

      {/* County Risk Profiles */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          County Disaster Risk Profiles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearProfiles
            .sort((a, b) => b.overall_risk_score - a.overall_risk_score)
            .slice(0, 12)
            .map((profile, i) => {
              const color = getRiskColor(profile)

              return (
                <div
                  key={i}
                  className="p-4 rounded-lg"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: `2px solid ${color}`
                  }}
                >
                  <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {profile.county_name}, {profile.state}
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text-muted)' }}>Overall Risk:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: `${color}20`, color }}
                      >
                        {profile.overall_risk_score} - {profile.risk_category.toUpperCase()}
                      </span>
                    </div>

                    {showHurricaneRisk && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>🌀 Hurricane:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile.hurricane_risk}
                        </span>
                      </div>
                    )}

                    {showTornadoRisk && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>🌪️ Tornado:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile.tornado_risk}
                        </span>
                      </div>
                    )}

                    {showWildfireRisk && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>🔥 Wildfire:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile.wildfire_risk}
                        </span>
                      </div>
                    )}

                    {showFloodRisk && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>🌊 Flood:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile.flood_risk}
                        </span>
                      </div>
                    )}

                    {showExtremeHeatRisk && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>☀️ Extreme Heat:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {profile.extreme_heat_risk}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Disaster Energy:</span>
                      <span className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
                        {profile.total_annual_disaster_energy.toFixed(1)} GWh
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>% of Baseline:</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {profile.energy_as_pct_of_baseline.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Disaster Events Table */}
      <div className="panel">
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Projected Disaster Events ({selectedYear})
        </h3>

        {yearEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>County</th>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Type</th>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Probability (%)</th>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Severity</th>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Emergency Energy</th>
                  <th className="text-left py-2 px-3" style={{ color: 'var(--text-primary)' }}>Rebuild Energy</th>
                </tr>
              </thead>
              <tbody>
                {yearEvents.map((event, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {event.county_name}, {event.state}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          background: event.disaster_type === 'hurricane' ? '#dc262620' :
                                     event.disaster_type === 'wildfire' ? '#f9731620' :
                                     '#facc1520',
                          color: event.disaster_type === 'hurricane' ? '#dc2626' :
                                event.disaster_type === 'wildfire' ? '#f97316' :
                                '#facc15'
                        }}
                      >
                        {event.disaster_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                      {event.annual_probability.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3" style={{ color: '#dc2626' }}>
                      {event.severity_score}/100
                    </td>
                    <td className="py-2 px-3" style={{ color: 'var(--accent-blue)' }}>
                      {event.emergency_energy_gwh.toFixed(2)} GWh
                    </td>
                    <td className="py-2 px-3" style={{ color: 'var(--accent-blue)' }}>
                      {event.rebuild_energy_gwh.toFixed(2)} GWh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No specific disaster events projected for this year.</p>
        )}
      </div>
    </div>
  )
}
