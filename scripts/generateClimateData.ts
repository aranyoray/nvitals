/**
 * Generate sample climate projection data for US counties
 */

import { ClimateProjection, BaselineClimate, generateClimateProjection, getCountyLatitude } from '../lib/climateEnergy'
import * as fs from 'fs'
import * as path from 'path'

// Sample counties (same as innovation data)
const sampleCounties = [
  { fips: '06085', name: 'Santa Clara', state: 'CA', baseline_temp: 60 },
  { fips: '06001', name: 'Alameda', state: 'CA', baseline_temp: 58 },
  { fips: '53033', name: 'King', state: 'WA', baseline_temp: 52 },
  { fips: '25017', name: 'Middlesex', state: 'MA', baseline_temp: 50 },
  { fips: '26163', name: 'Wayne', state: 'MI', baseline_temp: 49 },
  { fips: '39035', name: 'Cuyahoga', state: 'OH', baseline_temp: 50 },
  { fips: '42003', name: 'Allegheny', state: 'PA', baseline_temp: 51 },
  { fips: '37183', name: 'Wake', state: 'NC', baseline_temp: 59 },
  { fips: '08013', name: 'Boulder', state: 'CO', baseline_temp: 51 },
  { fips: '48453', name: 'Travis', state: 'TX', baseline_temp: 68 },
  { fips: '19001', name: 'Adair', state: 'IA', baseline_temp: 49 },
  { fips: '31001', name: 'Adams', state: 'NE', baseline_temp: 50 },
  { fips: '46003', name: 'Aurora', state: 'SD', baseline_temp: 45 },
  { fips: '08031', name: 'Denver', state: 'CO', baseline_temp: 51 },
  { fips: '41051', name: 'Multnomah', state: 'OR', baseline_temp: 54 },
  { fips: '36047', name: 'Kings', state: 'NY', baseline_temp: 54 },
  { fips: '12086', name: 'Miami-Dade', state: 'FL', baseline_temp: 77 },
  { fips: '48201', name: 'Harris', state: 'TX', baseline_temp: 69 },
  { fips: '17031', name: 'Cook', state: 'IL', baseline_temp: 50 }
]

// Years to project
const projectionYears = [2025, 2030, 2035, 2040, 2045, 2050, 2055]

// Scenarios
const scenarios: Array<'RCP45' | 'RCP85'> = ['RCP45', 'RCP85']

// Generate baseline data for each county
function generateBaseline(county: typeof sampleCounties[0]): BaselineClimate {
  // Estimate population/households based on county type
  const populationMap: Record<string, number> = {
    '06085': 1_950_000,  // Santa Clara
    '06001': 1_670_000,  // Alameda
    '53033': 2_250_000,  // King (Seattle)
    '25017': 1_610_000,  // Middlesex
    '26163': 1_740_000,  // Wayne (Detroit)
    '39035': 1_250_000,  // Cuyahoga (Cleveland)
    '42003': 1_230_000,  // Allegheny (Pittsburgh)
    '37183': 1_120_000,  // Wake (Raleigh)
    '08013': 330_000,    // Boulder
    '48453': 1_310_000,  // Travis (Austin)
    '19001': 7_000,      // Adair (rural)
    '31001': 29_000,     // Adams (rural)
    '46003': 2_700,      // Aurora (rural)
    '08031': 715_000,    // Denver
    '41051': 815_000,    // Multnomah (Portland)
    '36047': 2_640_000,  // Kings (Brooklyn)
    '12086': 2_700_000,  // Miami-Dade
    '48201': 4_730_000,  // Harris (Houston)
    '17031': 5_170_000   // Cook (Chicago)
  }

  const population = populationMap[county.fips] || 50_000
  const households = Math.round(population / 2.5) // Avg 2.5 people per household

  // Calculate baseline degree days
  const cdd_2024 = Math.max(0, (county.baseline_temp - 65) * 180) // ~180 cooling days
  const hdd_2024 = Math.max(0, (65 - county.baseline_temp) * 180) // ~180 heating days

  return {
    fips: county.fips,
    avg_temp_2024: county.baseline_temp,
    cdd_2024,
    hdd_2024,
    population_2024: population,
    households_2024: households,
    avg_home_sqft: 2000 + Math.random() * 500 // 2000-2500 sqft
  }
}

// Generate all projections
const allProjections: ClimateProjection[] = []

for (const county of sampleCounties) {
  const baseline = generateBaseline(county)
  const latitude = getCountyLatitude(county.state)

  for (const year of projectionYears) {
    for (const scenario of scenarios) {
      const projection = generateClimateProjection(baseline, year, scenario, latitude)

      allProjections.push({
        fips: county.fips,
        county_name: county.name,
        state: county.state,
        ...projection
      })
    }
  }
}

// Save to file
const outputPath = path.join(__dirname, '../data/energy_futures/climate/climate_projections_2025_2055.json')
fs.writeFileSync(outputPath, JSON.stringify(allProjections, null, 2))

console.log(`✓ Generated ${allProjections.length} climate projections`)
console.log(`✓ Counties: ${sampleCounties.length}`)
console.log(`✓ Years: ${projectionYears.length} (2025-2055)`)
console.log(`✓ Scenarios: RCP 4.5, RCP 8.5`)
console.log(`✓ Saved to: ${outputPath}`)

// Show sample
console.log('\nSample projection (Santa Clara, 2055, RCP 8.5):')
const sample = allProjections.find(p =>
  p.fips === '06085' && p.year === 2055 && p.scenario === 'RCP85'
)
console.log(JSON.stringify(sample, null, 2))

// Calculate summary statistics
const rcp85_2055 = allProjections.filter(p => p.year === 2055 && p.scenario === 'RCP85')
const avgCoolingIncrease = rcp85_2055.reduce((sum, p) => sum + p.cooling_increase_pct, 0) / rcp85_2055.length

console.log(`\nSummary (2055, RCP 8.5):`)
console.log(`Average cooling demand increase: +${avgCoolingIncrease.toFixed(1)}%`)
