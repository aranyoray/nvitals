/**
 * Generate unified energy forecasts integrating all factors:
 * - Innovation Index
 * - Climate Projections
 * - Migration Patterns
 * - Disaster Risk
 */

import { generateUnifiedForecast, aggregateNationalForecast, UnifiedEnergyForecast } from '../lib/unifiedForecast'
import * as fs from 'fs'
import * as path from 'path'

// Load all factor data
const innovationData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/energy_futures/innovation/innovation_index_sample.json'), 'utf-8')
)

const climateData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/energy_futures/climate/climate_projections_2025_2055.json'), 'utf-8')
)

const migrationData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/energy_futures/migration/county_migration_profiles.json'), 'utf-8')
)

const disasterData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/energy_futures/extreme_events/disaster_risk_profiles.json'), 'utf-8')
)

const years = [2025, 2030, 2035, 2040, 2045, 2050, 2055]
const scenarios: Array<'baseline' | 'moderate' | 'high_impact'> = ['baseline', 'moderate', 'high_impact']

// County metadata (population estimates)
const countyMeta: Record<string, { population: number }> = {
  '06085': { population: 1_950_000 },  // Santa Clara
  '06001': { population: 1_670_000 },  // Alameda
  '53033': { population: 2_250_000 },  // King
  '25017': { population: 1_610_000 },  // Middlesex
  '26163': { population: 1_740_000 },  // Wayne
  '39035': { population: 1_250_000 },  // Cuyahoga
  '42003': { population: 1_230_000 },  // Allegheny
  '37183': { population: 1_120_000 },  // Wake
  '08013': { population: 330_000 },    // Boulder
  '48453': { population: 1_310_000 },  // Travis
  '19001': { population: 7_000 },      // Adair
  '31001': { population: 29_000 },     // Adams
  '46003': { population: 2_700 },      // Aurora
  '08031': { population: 715_000 },    // Denver
  '41051': { population: 815_000 },    // Multnomah
  '36047': { population: 2_640_000 },  // Kings
  '12086': { population: 2_700_000 },  // Miami-Dade
  '48201': { population: 4_730_000 },  // Harris
  '17031': { population: 5_170_000 }   // Cook
}

// Generate unified forecasts
const unifiedForecasts: UnifiedEnergyForecast[] = []

for (const year of years) {
  for (const scenario of scenarios) {
    // Get all unique counties that have data
    const counties = new Set([
      ...innovationData.map((d: any) => d.fips),
      ...climateData.filter((d: any) => d.year === year).map((d: any) => d.fips),
      ...migrationData.filter((d: any) => d.year === year).map((d: any) => d.fips),
      ...disasterData.filter((d: any) => d.year === year).map((d: any) => d.fips)
    ])

    for (const fips of counties) {
      // Get data from each factor
      const innovation = innovationData.find((d: any) => d.fips === fips)
      const climate = climateData.find((d: any) => d.fips === fips && d.year === year && d.scenario === 'RCP45')
      const migration = migrationData.find((d: any) => d.fips === fips && d.year === year)
      const disaster = disasterData.find((d: any) => d.fips === fips && d.year === year)

      // Skip if missing critical data
      if (!innovation) continue

      const county_name = innovation.county_name
      const state = innovation.state
      const population = countyMeta[fips]?.population || 100_000

      // Baseline energy (estimate from population)
      const baseline_energy_2024 = (population / 1_000_000) * 15  // ~15 GWh per million people

      // Innovation factor
      const innovation_index = innovation.innovation_index || 50

      // Climate factor
      const temp_increase = climate ? climate.avg_temp - 55 : 0  // Baseline ~55°F
      const extreme_heat_days = climate ? climate.extreme_heat_days : 0

      // Migration factor
      const net_migration_rate = migration ? migration.net_migration_rate : 0

      // Disaster factor
      const disaster_annual_energy = disaster ? disaster.total_annual_disaster_energy : 0
      const has_disaster_history = disaster ? disaster.overall_risk_score > 30 : false

      const forecast = generateUnifiedForecast({
        fips,
        county_name,
        state,
        year,
        scenario,
        baseline_energy_2024,
        population_2024: population,
        innovation_index,
        temp_increase,
        extreme_heat_days,
        net_migration_rate,
        disaster_annual_energy,
        has_disaster_history
      })

      unifiedForecasts.push(forecast)
    }
  }
}

// Save unified forecasts
const forecastPath = path.join(__dirname, '../data/energy_futures/unified_energy_forecast_2025_2055.json')
fs.writeFileSync(forecastPath, JSON.stringify(unifiedForecasts, null, 2))

console.log(`✓ Generated ${unifiedForecasts.length} unified energy forecasts`)
console.log(`✓ Counties: ${new Set(unifiedForecasts.map(f => f.fips)).size}`)
console.log(`✓ Years: ${years.length} (2025-2055)`)
console.log(`✓ Scenarios: ${scenarios.join(', ')}`)
console.log(`✓ Saved to: ${forecastPath}`)

// Show sample forecast
console.log('\nSample unified forecast (Santa Clara, 2055, baseline):')
const sample = unifiedForecasts.find(f =>
  f.fips === '06085' && f.year === 2055 && f.scenario === 'baseline'
)
console.log(JSON.stringify(sample, null, 2))

// Calculate national aggregates for each scenario/year
console.log('\n=== National Aggregates (2055) ===')
for (const scenario of scenarios) {
  const forecasts_2055 = unifiedForecasts.filter(f => f.year === 2055 && f.scenario === scenario)
  const aggregate = aggregateNationalForecast(forecasts_2055)

  console.log(`\n${scenario.toUpperCase()}:`)
  console.log(`  Total Energy: ${aggregate.total_energy} GWh`)
  console.log(`  Renewable: ${aggregate.total_renewable} GWh (${Math.round(aggregate.total_renewable / aggregate.total_energy * 100)}%)`)
  console.log(`  Fossil: ${aggregate.total_fossil} GWh`)
  console.log(`  Avg Innovation Savings: ${aggregate.avg_innovation_savings.toFixed(2)} GWh/county`)
  console.log(`  Avg Climate Increase: ${aggregate.avg_climate_increase.toFixed(2)} GWh/county`)
  console.log(`  Avg Per Capita: ${aggregate.avg_per_capita.toLocaleString()} kWh/person/year`)
}
