/**
 * Generate sample migration flow and county profile data
 */

import {
  CountyMigrationProfile,
  MigrationFlow,
  generateMigrationProfile,
  calculateGravityMigration,
  calculateEconomicPull,
  calculateClimatePull,
  classifyUrbanization,
  classifyFlowType,
  calculateMigrationEnergyImpact
} from '../lib/migrationModel'
import * as fs from 'fs'
import * as path from 'path'

// Sample county data with realistic attributes
const counties = [
  // Tech hubs - high in-migration
  { fips: '06085', name: 'Santa Clara', state: 'CA', pop: 1_950_000, area: 1291, innovation: 74.8, avg_temp: 60, lat: 37.3, lon: -121.9 },
  { fips: '53033', name: 'King', state: 'WA', pop: 2_250_000, area: 2307, innovation: 74.8, avg_temp: 52, lat: 47.5, lon: -121.8 },
  { fips: '48453', name: 'Travis', state: 'TX', pop: 1_310_000, area: 1023, innovation: 65.2, avg_temp: 68, lat: 30.3, lon: -97.7 },

  // Research/university - moderate in-migration
  { fips: '37183', name: 'Wake', state: 'NC', pop: 1_120_000, area: 857, innovation: 68.5, avg_temp: 59, lat: 35.8, lon: -78.6 },
  { fips: '08013', name: 'Boulder', state: 'CO', pop: 330_000, area: 742, innovation: 72.1, avg_temp: 51, lat: 40.0, lon: -105.3 },

  // Manufacturing - stable/declining
  { fips: '26163', name: 'Wayne', state: 'MI', pop: 1_740_000, area: 614, innovation: 45.3, avg_temp: 49, lat: 42.3, lon: -83.0 },
  { fips: '39035', name: 'Cuyahoga', state: 'OH', pop: 1_250_000, area: 458, innovation: 42.8, avg_temp: 50, lat: 41.5, lon: -81.7 },

  // Major metros - high in-migration
  { fips: '12086', name: 'Miami-Dade', state: 'FL', pop: 2_700_000, area: 1946, innovation: 52.4, avg_temp: 77, lat: 25.8, lon: -80.2 },
  { fips: '48201', name: 'Harris', state: 'TX', pop: 4_730_000, area: 1729, innovation: 58.6, avg_temp: 69, lat: 29.8, lon: -95.4 },
  { fips: '17031', name: 'Cook', state: 'IL', pop: 5_170_000, area: 946, innovation: 56.3, avg_temp: 50, lat: 41.9, lon: -87.6 },

  // Rural - out-migration
  { fips: '19001', name: 'Adair', state: 'IA', pop: 7_000, area: 569, innovation: 18.2, avg_temp: 49, lat: 41.3, lon: -94.5 },
  { fips: '31001', name: 'Adams', state: 'NE', pop: 29_000, area: 564, innovation: 22.1, avg_temp: 50, lat: 40.5, lon: -98.5 },
  { fips: '46003', name: 'Aurora', state: 'SD', pop: 2_700, area: 710, innovation: 15.8, avg_temp: 45, lat: 43.7, lon: -98.5 }
]

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Generate migration flows using gravity model
const migrationFlows: MigrationFlow[] = []
const years = [2025, 2030, 2035, 2040, 2045, 2050, 2055]

for (const year of years) {
  // Generate flows between selected county pairs
  const majorFlows = [
    // Rural to tech hubs
    { from: '19001', to: '06085' }, // Adair, IA → Santa Clara, CA
    { from: '31001', to: '53033' }, // Adams, NE → King, WA
    { from: '46003', to: '48453' }, // Aurora, SD → Travis, TX

    // Manufacturing to sunbelt
    { from: '26163', to: '12086' }, // Wayne, MI → Miami-Dade, FL
    { from: '39035', to: '48201' }, // Cuyahoga, OH → Harris, TX

    // Urban to urban growth
    { from: '17031', to: '48453' }, // Cook, IL → Travis, TX
    { from: '17031', to: '37183' }, // Cook, IL → Wake, NC
  ]

  for (const flow of majorFlows) {
    const origin = counties.find(c => c.fips === flow.from)!
    const dest = counties.find(c => c.fips === flow.to)!

    const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon)

    // Calculate pull factors
    const economic_pull = calculateEconomicPull(dest.innovation, 3.5, 3.0)
    const climate_pull = calculateClimatePull(dest.avg_temp, 0, 0, 30)

    // Gravity model migration
    let base_migrants = calculateGravityMigration(
      origin.pop,
      dest.pop,
      distance,
      economic_pull,
      climate_pull
    )

    // Increase migration over time (people continue to move to opportunity)
    const year_multiplier = 1 + ((year - 2025) / 30) * 0.3 // 30% increase by 2055
    base_migrants = Math.round(base_migrants * year_multiplier)

    const migration_rate = (base_migrants / origin.pop) * 100

    const origin_urbanization = classifyUrbanization(origin.pop / origin.area)
    const dest_urbanization = classifyUrbanization(dest.pop / dest.area)
    const flow_type = classifyFlowType(origin_urbanization, dest_urbanization, origin.state, dest.state)

    const energy_change = calculateMigrationEnergyImpact(base_migrants)

    migrationFlows.push({
      from_fips: origin.fips,
      from_county: origin.name,
      from_state: origin.state,
      to_fips: dest.fips,
      to_county: dest.name,
      to_state: dest.state,
      year,
      net_migrants: base_migrants,
      migration_rate: Number(migration_rate.toFixed(3)),
      flow_type,
      economic_factor: Number((economic_pull * 50).toFixed(1)),
      climate_factor: Number((climate_pull * 50).toFixed(1)),
      cost_of_living_factor: Number((Math.random() * 40 + 30).toFixed(1)),
      energy_demand_change: energy_change
    })
  }
}

// Generate county migration profiles
const countyProfiles: CountyMigrationProfile[] = []

for (const county of counties) {
  for (const year of years) {
    // Calculate in/out migration for this county
    const flows_in = migrationFlows.filter(f => f.to_fips === county.fips && f.year === year)
    const flows_out = migrationFlows.filter(f => f.from_fips === county.fips && f.year === year)

    const total_in = flows_in.reduce((sum, f) => sum + f.net_migrants, 0)
    const total_out = flows_out.reduce((sum, f) => sum + f.net_migrants, 0)

    // Baseline energy (GWh) - rough estimate based on population
    const baseline_energy = (county.pop / 1_000_000) * 15 // ~15 GWh per 1M people

    const profile = generateMigrationProfile(
      county.fips,
      county.name,
      county.state,
      year,
      county.pop,
      county.area,
      total_in,
      total_out,
      baseline_energy
    )

    countyProfiles.push(profile)
  }
}

// Save migration flows
const flowsPath = path.join(__dirname, '../data/energy_futures/migration/migration_flows_2025_2055.json')
fs.writeFileSync(flowsPath, JSON.stringify(migrationFlows, null, 2))

// Save county profiles
const profilesPath = path.join(__dirname, '../data/energy_futures/migration/county_migration_profiles.json')
fs.writeFileSync(profilesPath, JSON.stringify(countyProfiles, null, 2))

console.log(`✓ Generated ${migrationFlows.length} migration flows`)
console.log(`✓ Generated ${countyProfiles.length} county migration profiles`)
console.log(`✓ Years: ${years.length} (2025-2055)`)
console.log(`✓ Counties: ${counties.length}`)
console.log(`✓ Saved to:`)
console.log(`  - ${flowsPath}`)
console.log(`  - ${profilesPath}`)

// Show sample flow
console.log('\nSample migration flow (2055, Rural → Tech Hub):')
const sample_flow = migrationFlows.find(f => f.year === 2055 && f.flow_type === 'rural_to_urban')
console.log(JSON.stringify(sample_flow, null, 2))

// Show statistics
const total_rural_to_urban_2055 = migrationFlows
  .filter(f => f.year === 2055 && f.flow_type === 'rural_to_urban')
  .reduce((sum, f) => sum + f.net_migrants, 0)

console.log(`\nTotal rural-to-urban migration (2055): ${total_rural_to_urban_2055.toLocaleString()} people`)
