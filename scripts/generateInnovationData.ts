/**
 * Generate sample Innovation Index data for US counties
 * This creates realistic mock data for testing the energy futures dashboard
 */

import { InnovationMetrics, calculateInnovationIndex, getInnovationCategory } from '../lib/innovationIndex'
import * as fs from 'fs'
import * as path from 'path'

// Sample counties with varied innovation profiles
const sampleCounties = [
  // High-tech hubs
  { fips: '06085', name: 'Santa Clara', state: 'CA', profile: 'tech_hub' },
  { fips: '06001', name: 'Alameda', state: 'CA', profile: 'tech_hub' },
  { fips: '53033', name: 'King', state: 'WA', profile: 'tech_hub' },
  { fips: '25017', name: 'Middlesex', state: 'MA', profile: 'tech_hub' },

  // Manufacturing centers
  { fips: '26163', name: 'Wayne', state: 'MI', profile: 'manufacturing' },
  { fips: '39035', name: 'Cuyahoga', state: 'OH', profile: 'manufacturing' },
  { fips: '42003', name: 'Allegheny', state: 'PA', profile: 'manufacturing' },

  // Research/University towns
  { fips: '37183', name: 'Wake', state: 'NC', profile: 'research' },
  { fips: '08013', name: 'Boulder', state: 'CO', profile: 'research' },
  { fips: '48453', name: 'Travis', state: 'TX', profile: 'research' },

  // Rural/Agricultural
  { fips: '19001', name: 'Adair', state: 'IA', profile: 'rural' },
  { fips: '31001', name: 'Adams', state: 'NE', profile: 'rural' },
  { fips: '46003', name: 'Aurora', state: 'SD', profile: 'rural' },

  // Energy transition leaders
  { fips: '08031', name: 'Denver', state: 'CO', profile: 'green_energy' },
  { fips: '41051', name: 'Multnomah', state: 'OR', profile: 'green_energy' },
  { fips: '36047', name: 'Kings', state: 'NY', profile: 'urban' },

  // Mixed/Moderate
  { fips: '12086', name: 'Miami-Dade', state: 'FL', profile: 'mixed' },
  { fips: '48201', name: 'Harris', state: 'TX', profile: 'mixed' },
  { fips: '17031', name: 'Cook', state: 'IL', profile: 'mixed' }
]

// Innovation profile templates
const profiles = {
  tech_hub: {
    patents_per_1000: 3.5 + Math.random() * 2,
    stem_employment_pct: 12 + Math.random() * 5,
    broadband_penetration: 85 + Math.random() * 10,
    manufacturing_gdp_share: 8 + Math.random() * 7,
    clean_energy_adoption: 35 + Math.random() * 25,
    automation_index: 70 + Math.random() * 25
  },
  manufacturing: {
    patents_per_1000: 1.2 + Math.random(),
    stem_employment_pct: 6 + Math.random() * 4,
    broadband_penetration: 70 + Math.random() * 15,
    manufacturing_gdp_share: 20 + Math.random() * 15,
    clean_energy_adoption: 15 + Math.random() * 15,
    automation_index: 55 + Math.random() * 20
  },
  research: {
    patents_per_1000: 2.5 + Math.random() * 1.5,
    stem_employment_pct: 15 + Math.random() * 5,
    broadband_penetration: 80 + Math.random() * 12,
    manufacturing_gdp_share: 5 + Math.random() * 5,
    clean_energy_adoption: 40 + Math.random() * 20,
    automation_index: 60 + Math.random() * 20
  },
  rural: {
    patents_per_1000: 0.1 + Math.random() * 0.3,
    stem_employment_pct: 2 + Math.random() * 2,
    broadband_penetration: 45 + Math.random() * 20,
    manufacturing_gdp_share: 3 + Math.random() * 5,
    clean_energy_adoption: 8 + Math.random() * 12,
    automation_index: 25 + Math.random() * 15
  },
  green_energy: {
    patents_per_1000: 1.8 + Math.random(),
    stem_employment_pct: 8 + Math.random() * 4,
    broadband_penetration: 75 + Math.random() * 15,
    manufacturing_gdp_share: 10 + Math.random() * 8,
    clean_energy_adoption: 55 + Math.random() * 30,
    automation_index: 50 + Math.random() * 25
  },
  urban: {
    patents_per_1000: 1.5 + Math.random(),
    stem_employment_pct: 7 + Math.random() * 5,
    broadband_penetration: 75 + Math.random() * 15,
    manufacturing_gdp_share: 6 + Math.random() * 6,
    clean_energy_adoption: 25 + Math.random() * 20,
    automation_index: 45 + Math.random() * 25
  },
  mixed: {
    patents_per_1000: 1.0 + Math.random() * 1.2,
    stem_employment_pct: 6 + Math.random() * 4,
    broadband_penetration: 65 + Math.random() * 20,
    manufacturing_gdp_share: 10 + Math.random() * 10,
    clean_energy_adoption: 20 + Math.random() * 20,
    automation_index: 45 + Math.random() * 25
  }
}

function generateCountyData(county: typeof sampleCounties[0]): InnovationMetrics {
  const profile = profiles[county.profile as keyof typeof profiles]

  const metrics: InnovationMetrics = {
    fips: county.fips,
    county_name: county.name,
    state: county.state,
    ...profile
  }

  const innovation_index = calculateInnovationIndex(metrics)
  const innovation_category = getInnovationCategory(innovation_index)

  return {
    ...metrics,
    innovation_index,
    innovation_category
  }
}

// Generate data
const innovationData = sampleCounties.map(generateCountyData)

// Calculate percentiles
const allScores = innovationData.map(d => d.innovation_index || 0)
innovationData.forEach(county => {
  if (county.innovation_index) {
    const sorted = [...allScores].sort((a, b) => a - b)
    const index = sorted.findIndex(v => v >= county.innovation_index!)
    county.innovation_percentile = Math.round((index / sorted.length) * 100)
  }
})

// Save to file
const outputPath = path.join(__dirname, '../data/energy_futures/innovation/innovation_index_sample.json')
fs.writeFileSync(outputPath, JSON.stringify(innovationData, null, 2))

console.log(`✓ Generated innovation data for ${innovationData.length} counties`)
console.log(`✓ Saved to: ${outputPath}`)
console.log('\nSample data:')
console.log(JSON.stringify(innovationData.slice(0, 3), null, 2))
