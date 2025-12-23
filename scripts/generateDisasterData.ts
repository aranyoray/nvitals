/**
 * Generate sample disaster risk data for US counties
 */

import {
  CountyDisasterProfile,
  DisasterEvent,
  calculateDisasterProbability,
  calculateSeverityScore,
  calculateEmergencyEnergy,
  calculateRebuildingEnergy,
  calculateHurricaneRisk,
  calculateTornadoRisk,
  calculateFloodRisk,
  calculateWildfireRisk,
  calculateExtremeHeatRisk,
  calculateOverallRiskScore,
  categorizeRisk
} from '../lib/disasterRisk'
import * as fs from 'fs'
import * as path from 'path'

// Sample counties with geographic attributes
const counties = [
  // Coastal - hurricane risk
  { fips: '12086', name: 'Miami-Dade', state: 'FL', lat: 25.8, coastal: true, river: false, elevation_low: true, avg_temp: 77 },
  { fips: '48201', name: 'Harris', state: 'TX', lat: 29.8, coastal: true, river: false, elevation_low: true, avg_temp: 69 },
  { fips: '36047', name: 'Kings', state: 'NY', lat: 40.6, coastal: true, river: false, elevation_low: true, avg_temp: 54 },

  // Tornado alley
  { fips: '40109', name: 'Oklahoma', state: 'OK', lat: 35.5, coastal: false, river: false, elevation_low: false, avg_temp: 60 },
  { fips: '20173', name: 'Sedgwick', state: 'KS', lat: 37.7, coastal: false, river: false, elevation_low: false, avg_temp: 56 },
  { fips: '31055', name: 'Douglas', state: 'NE', lat: 41.3, coastal: false, river: true, elevation_low: false, avg_temp: 50 },

  // Wildfire risk (West)
  { fips: '06085', name: 'Santa Clara', state: 'CA', lat: 37.3, coastal: false, river: false, elevation_low: false, avg_temp: 60 },
  { fips: '06001', name: 'Alameda', state: 'CA', lat: 37.7, coastal: true, river: false, elevation_low: false, avg_temp: 58 },
  { fips: '53033', name: 'King', state: 'WA', lat: 47.5, coastal: false, river: false, elevation_low: false, avg_temp: 52 },
  { fips: '08031', name: 'Denver', state: 'CO', lat: 39.7, coastal: false, river: true, elevation_low: false, avg_temp: 51 },

  // Flood risk (rivers)
  { fips: '17031', name: 'Cook', state: 'IL', lat: 41.9, coastal: false, river: true, elevation_low: false, avg_temp: 50 },
  { fips: '29189', name: 'St. Louis', state: 'MO', lat: 38.6, coastal: false, river: true, elevation_low: true, avg_temp: 56 },

  // Mixed/moderate risk
  { fips: '37183', name: 'Wake', state: 'NC', lat: 35.8, coastal: false, river: false, elevation_low: false, avg_temp: 59 },
  { fips: '48453', name: 'Travis', state: 'TX', lat: 30.3, coastal: false, river: true, elevation_low: false, avg_temp: 68 },
  { fips: '26163', name: 'Wayne', state: 'MI', lat: 42.3, coastal: false, river: true, elevation_low: false, avg_temp: 49 },
  { fips: '39035', name: 'Cuyahoga', state: 'OH', lat: 41.5, coastal: false, river: true, elevation_low: false, avg_temp: 50 }
]

const years = [2025, 2030, 2035, 2040, 2045, 2050, 2055]

// Generate county disaster profiles
const countyProfiles: CountyDisasterProfile[] = []

for (const county of counties) {
  for (const year of years) {
    // Calculate individual disaster risks
    const hurricane_risk = calculateHurricaneRisk(county.coastal, county.lat, year)
    const tornado_risk = calculateTornadoRisk(county.state, year)
    const flood_risk = calculateFloodRisk(county.river, county.coastal, county.elevation_low, year)
    const wildfire_risk = calculateWildfireRisk(county.state, county.avg_temp, year)

    // Get extreme heat days from climate data (estimate)
    const extreme_heat_days = county.avg_temp > 70 ? (year - 2024) * 0.5 : 0
    const extreme_heat_risk = calculateExtremeHeatRisk(county.avg_temp, extreme_heat_days, year)

    const winter_storm_risk = county.lat > 40 ? 30 : 10  // Simple model

    // Calculate overall risk
    const overall_risk_score = calculateOverallRiskScore(
      hurricane_risk,
      tornado_risk,
      flood_risk,
      wildfire_risk,
      extreme_heat_risk,
      winter_storm_risk
    )

    const risk_category = categorizeRisk(overall_risk_score)

    // Estimate total annual disaster energy
    // Based on risk score and county size
    const population = county.fips === '17031' ? 5_170_000 :
                      county.fips === '12086' ? 2_700_000 :
                      county.fips === '48201' ? 4_730_000 : 1_000_000

    const total_annual_disaster_energy = (overall_risk_score / 100) * (population / 1_000_000) * 5  // GWh

    const baseline_energy = (population / 1_000_000) * 15  // GWh
    const energy_as_pct_of_baseline = (total_annual_disaster_energy / baseline_energy) * 100

    countyProfiles.push({
      fips: county.fips,
      county_name: county.name,
      state: county.state,
      year,
      overall_risk_score,
      risk_category,
      hurricane_risk,
      tornado_risk,
      flood_risk,
      wildfire_risk,
      extreme_heat_risk,
      winter_storm_risk,
      total_annual_disaster_energy: Number(total_annual_disaster_energy.toFixed(2)),
      energy_as_pct_of_baseline: Number(energy_as_pct_of_baseline.toFixed(1))
    })
  }
}

// Generate specific disaster events (examples)
const disasterEvents: DisasterEvent[] = []

// Hurricane events (coastal counties)
const coastal_counties = counties.filter(c => c.coastal)
for (const county of coastal_counties) {
  for (const year of [2030, 2040, 2050]) {
    const probability = calculateDisasterProbability(3, 1.3, year)  // 3 per decade, increasing
    const severity = calculateSeverityScore(5, 2000, 80)  // High severity

    const population = county.fips === '12086' ? 2_700_000 :
                      county.fips === '48201' ? 4_730_000 : 2_640_000

    const population_affected = Math.round(population * 0.6)  // 60% affected
    const buildings_at_risk = Math.round(population_affected / 2.5)  // ~2.5 people per building

    const emergency_energy = calculateEmergencyEnergy(population_affected, severity)
    const rebuild_energy = calculateRebuildingEnergy(buildings_at_risk * 0.3, 15, severity)  // 30% damaged, 15% infrastructure

    disasterEvents.push({
      fips: county.fips,
      county_name: county.name,
      state: county.state,
      year,
      disaster_type: 'hurricane',
      annual_probability: probability,
      severity_score: severity,
      expected_annual_loss: 2000,
      emergency_energy_gwh: emergency_energy,
      rebuild_energy_gwh: rebuild_energy,
      total_disaster_energy: Number((emergency_energy + rebuild_energy).toFixed(2)),
      population_affected,
      buildings_at_risk,
      infrastructure_vulnerability: 80
    })
  }
}

// Wildfire events (Western states)
const wildfire_counties = counties.filter(c => ['CA', 'WA', 'CO'].includes(c.state))
for (const county of wildfire_counties) {
  for (const year of [2030, 2045, 2055]) {
    const probability = calculateDisasterProbability(2, 1.6, year)  // Rapidly increasing
    const severity = calculateSeverityScore(3, 500, 60)

    const population = county.fips === '06085' ? 1_950_000 : 1_000_000
    const population_affected = Math.round(population * 0.2)  // 20% affected
    const buildings_at_risk = Math.round(population_affected / 2.5)

    const emergency_energy = calculateEmergencyEnergy(population_affected, severity)
    const rebuild_energy = calculateRebuildingEnergy(buildings_at_risk * 0.15, 8, severity)

    disasterEvents.push({
      fips: county.fips,
      county_name: county.name,
      state: county.state,
      year,
      disaster_type: 'wildfire',
      annual_probability: probability,
      severity_score: severity,
      expected_annual_loss: 500,
      emergency_energy_gwh: emergency_energy,
      rebuild_energy_gwh: rebuild_energy,
      total_disaster_energy: Number((emergency_energy + rebuild_energy).toFixed(2)),
      population_affected,
      buildings_at_risk,
      infrastructure_vulnerability: 60
    })
  }
}

// Tornado events (Tornado Alley)
const tornado_counties = counties.filter(c => ['OK', 'KS', 'NE'].includes(c.state))
for (const county of tornado_counties) {
  for (const year of [2035, 2050]) {
    const probability = calculateDisasterProbability(4, 1.3, year)
    const severity = calculateSeverityScore(8, 300, 70)

    const population = 500_000
    const population_affected = Math.round(population * 0.3)
    const buildings_at_risk = Math.round(population_affected / 2.5)

    const emergency_energy = calculateEmergencyEnergy(population_affected, severity)
    const rebuild_energy = calculateRebuildingEnergy(buildings_at_risk * 0.4, 20, severity)

    disasterEvents.push({
      fips: county.fips,
      county_name: county.name,
      state: county.state,
      year,
      disaster_type: 'tornado',
      annual_probability: probability,
      severity_score: severity,
      expected_annual_loss: 300,
      emergency_energy_gwh: emergency_energy,
      rebuild_energy_gwh: rebuild_energy,
      total_disaster_energy: Number((emergency_energy + rebuild_energy).toFixed(2)),
      population_affected,
      buildings_at_risk,
      infrastructure_vulnerability: 70
    })
  }
}

// Save data
const profilesPath = path.join(__dirname, '../data/energy_futures/extreme_events/disaster_risk_profiles.json')
const eventsPath = path.join(__dirname, '../data/energy_futures/extreme_events/disaster_events_2025_2055.json')

fs.writeFileSync(profilesPath, JSON.stringify(countyProfiles, null, 2))
fs.writeFileSync(eventsPath, JSON.stringify(disasterEvents, null, 2))

console.log(`✓ Generated ${countyProfiles.length} county disaster profiles`)
console.log(`✓ Generated ${disasterEvents.length} specific disaster events`)
console.log(`✓ Years: ${years.length} (2025-2055)`)
console.log(`✓ Counties: ${counties.length}`)
console.log(`✓ Saved to:`)
console.log(`  - ${profilesPath}`)
console.log(`  - ${eventsPath}`)

// Show sample
console.log('\nSample disaster profile (Miami-Dade, 2055):')
const sample = countyProfiles.find(p => p.fips === '12086' && p.year === 2055)
console.log(JSON.stringify(sample, null, 2))

// Show statistics
const high_risk_2055 = countyProfiles.filter(p => p.year === 2055 && p.risk_category === 'very_high').length
const total_disaster_energy_2055 = countyProfiles
  .filter(p => p.year === 2055)
  .reduce((sum, p) => sum + p.total_annual_disaster_energy, 0)

console.log(`\nStatistics (2055):`)
console.log(`- Very high risk counties: ${high_risk_2055}`)
console.log(`- Total disaster energy needs: ${total_disaster_energy_2055.toFixed(0)} GWh`)
