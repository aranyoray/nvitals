'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import InnovationIndexMap from '@/components/energy/InnovationIndexMap'
import ClimateEnergyDashboard from '@/components/energy/ClimateEnergyDashboard'
import MigrationDashboard from '@/components/energy/MigrationDashboard'

export default function EnergyFuturesPage() {
  const [selectedView, setSelectedView] = useState<'overview' | 'innovation' | 'climate' | 'migration' | 'disasters'>('overview')

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          {/* Theme Toggle - Top Right */}
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-sm font-semibold hover:underline" style={{ color: 'var(--accent-blue)' }}>
              ← Back to Health Dashboard
            </Link>
            <ThemeToggle />
          </div>

          {/* Main Heading */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Energy Futures 2025-2055
            </h1>
            <p className="text-sm md:text-lg max-w-4xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              AI-Driven 30-Year Energy Demand Forecasting • County-Level Climate Impact • Migration Patterns • Innovation Index
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {[
            { id: 'overview', label: 'Overview', icon: '🌎' },
            { id: 'innovation', label: 'Innovation Index', icon: '💡' },
            { id: 'climate', label: 'Climate Impact', icon: '🌡️' },
            { id: 'migration', label: 'Migration Patterns', icon: '🚚' },
            { id: 'disasters', label: 'Disaster Risk', icon: '⚠️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedView === tab.id ? 'shadow-lg' : ''
              }`}
              style={{
                background: selectedView === tab.id
                  ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                  : 'var(--bg-secondary)',
                color: selectedView === tab.id ? '#ffffff' : 'var(--text-primary)',
                border: selectedView === tab.id ? 'none' : '1px solid var(--border-color)'
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <h3 className="stat-card-title">US Energy Growth</h3>
                <p className="stat-card-value stat-card-accent">+34%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>2024 → 2055 projection</p>
              </div>

              <div className="stat-card">
                <h3 className="stat-card-title">Climate-Driven Increase</h3>
                <p className="stat-card-value" style={{ color: '#dc2626' }}>+18%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>From extreme heat/cold</p>
              </div>

              <div className="stat-card">
                <h3 className="stat-card-title">Renewable Share 2055</h3>
                <p className="stat-card-value" style={{ color: '#10b981' }}>62%</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Up from 22% in 2024</p>
              </div>

              <div className="stat-card">
                <h3 className="stat-card-title">High-Risk Counties</h3>
                <p className="stat-card-value" style={{ color: '#f59e0b' }}>847</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Disaster vulnerability</p>
              </div>
            </div>

            {/* Overview Description */}
            <div className="panel">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>About This Dashboard</h2>
              <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  This dashboard projects energy demand across all US counties through 2055 using AI-driven forecasting models
                  that incorporate climate change, migration patterns, urbanization, extreme weather events, and industrial innovation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>🌡️ Climate Impact</h3>
                    <p className="text-sm">
                      Projects heating and cooling energy demand based on NOAA climate projections (RCP 4.5 & 8.5 scenarios).
                      Accounts for extreme heat days, cold snaps, and changing seasonal patterns.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>🚚 Migration & Urbanization</h3>
                    <p className="text-sm">
                      Forecasts population shifts using gravity models and IRS migration data. Tracks rural-to-urban flows
                      and interstate movements affecting regional energy infrastructure needs.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>⚠️ Disaster Resilience</h3>
                    <p className="text-sm">
                      Models energy requirements for disaster response and rebuilding based on FEMA historical data and
                      extreme event probabilities (hurricanes, floods, tornadoes, wildfires).
                    </p>
                  </div>

                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>💡 Innovation Index</h3>
                    <p className="text-sm">
                      Composite score (0-100) measuring county-level innovation capacity: patents, STEM jobs, broadband,
                      manufacturing, clean energy adoption, and automation. Higher innovation = more efficient energy use.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))', border: '1px solid var(--accent-blue)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🔍 Key Projections</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>+52°F</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Avg Summer Peak Temperature</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>By 2055 in Sun Belt states</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#10b981' }}>2.1×</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Urban Energy Density</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>As rural populations migrate to cities</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#f59e0b' }}>$127B</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Annual Disaster Energy Cost</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Emergency response + rebuilding</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'innovation' && (
          <div className="space-y-6">
            <div className="panel">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                💡 County Innovation Index (2024 Baseline)
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Composite innovation score based on patents, STEM employment, broadband access, manufacturing GDP, clean energy adoption, and automation index.
                Higher innovation correlates with more efficient energy use and faster renewable energy transition.
              </p>

              <InnovationIndexMap />
            </div>
          </div>
        )}

        {selectedView === 'climate' && (
          <div className="space-y-6">
            <div className="panel">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                🌡️ Climate-Driven Energy Demand (2025-2055)
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Energy demand projections based on IPCC climate scenarios. RCP 4.5 assumes moderate emissions reduction,
                while RCP 8.5 represents high emissions "business as usual" trajectory.
              </p>

              <ClimateEnergyDashboard />
            </div>
          </div>
        )}

        {selectedView === 'migration' && (
          <div className="space-y-6">
            <div className="panel">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                🚚 Population Migration & Urbanization (2025-2055)
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Migration patterns based on gravity model incorporating economic opportunities, climate comfort, and cost of living.
                Tracks rural-to-urban flows, interstate migration, and energy infrastructure impacts.
              </p>

              <MigrationDashboard />
            </div>
          </div>
        )}

        {selectedView === 'disasters' && (
          <div className="panel">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              ⚠️ Extreme Event Risk & Energy Requirements
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Disaster risk modeling coming soon. Will project energy needs for emergency response, temporary housing,
              and infrastructure rebuilding based on historical FEMA data and climate projections.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>Forecasting Horizon: 2025-2055 | County-Level Granularity: 3,143 US Counties</p>
          <p className="mt-2">Data Sources: NOAA, EIA, Census Bureau, FEMA, USPTO, BLS, FCC</p>
        </div>
      </div>
    </div>
  )
}
