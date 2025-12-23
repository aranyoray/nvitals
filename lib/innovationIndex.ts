/**
 * Innovation Index Calculator for County-Level Analysis
 *
 * Calculates a composite innovation score (0-100) based on:
 * - Patent filings per 1,000 residents
 * - STEM employment percentage
 * - Broadband penetration rate
 * - Manufacturing GDP share
 * - Clean energy adoption rate
 * - Automation/AI adoption index
 */

export interface InnovationMetrics {
  fips: string
  county_name: string
  state: string

  // Innovation inputs (raw metrics)
  patents_per_1000?: number          // Patent filings per 1,000 residents
  stem_employment_pct?: number       // % of workforce in STEM occupations
  broadband_penetration?: number     // % of households with broadband
  manufacturing_gdp_share?: number   // % of county GDP from manufacturing
  clean_energy_adoption?: number     // % of energy from renewables
  automation_index?: number          // 0-100 scale of automation adoption

  // Calculated outputs
  innovation_index?: number          // Final composite score (0-100)
  innovation_percentile?: number     // National percentile ranking
  innovation_category?: string       // Low/Medium/High/Very High
}

export interface EnergyDemandFactors {
  base_energy_2024: number           // Baseline energy consumption (GWh)

  // Climate factors
  cooling_degree_days: number        // Annual cooling degree days
  heating_degree_days: number        // Annual heating degree days

  // Population factors
  population_2024: number
  population_2055: number
  migration_rate: number             // Net migration rate (%)

  // Economic factors
  gdp_per_capita: number
  industrial_growth_rate: number     // Annual % growth

  // Disaster risk
  disaster_risk_score: number        // 0-100 (higher = more risk)
  expected_annual_loss: number       // $ millions
}

/**
 * Calculate Innovation Index for a county
 */
export function calculateInnovationIndex(metrics: InnovationMetrics): number {
  const {
    patents_per_1000 = 0,
    stem_employment_pct = 0,
    broadband_penetration = 0,
    manufacturing_gdp_share = 0,
    clean_energy_adoption = 0,
    automation_index = 0
  } = metrics

  // Normalize each metric to 0-100 scale
  const normalizedPatents = Math.min(100, (patents_per_1000 / 5) * 100) // 5 patents/1000 = top tier
  const normalizedSTEM = Math.min(100, (stem_employment_pct / 15) * 100) // 15% STEM = top tier
  const normalizedBroadband = broadband_penetration // Already 0-100
  const normalizedManufacturing = Math.min(100, (manufacturing_gdp_share / 30) * 100) // 30% = top tier
  const normalizedCleanEnergy = clean_energy_adoption // Already 0-100
  const normalizedAutomation = automation_index // Already 0-100

  // Weighted average
  const innovationIndex = (
    0.25 * normalizedPatents +
    0.20 * normalizedSTEM +
    0.15 * normalizedBroadband +
    0.15 * normalizedManufacturing +
    0.15 * normalizedCleanEnergy +
    0.10 * normalizedAutomation
  )

  return Math.round(innovationIndex * 10) / 10 // Round to 1 decimal place
}

/**
 * Categorize innovation level
 */
export function getInnovationCategory(index: number): string {
  if (index >= 75) return 'Very High'
  if (index >= 50) return 'High'
  if (index >= 25) return 'Medium'
  return 'Low'
}

/**
 * Calculate percentile ranking
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)
  if (index === -1) return 100
  return Math.round((index / sorted.length) * 100)
}

/**
 * Energy multiplier based on innovation level
 * Higher innovation = more efficient energy use + cleaner energy mix
 */
export function getEnergyMultiplier(innovationIndex: number): {
  efficiency: number      // Energy efficiency factor (1.0 = baseline)
  renewable_share: number // Expected renewable energy share by 2055
} {
  // Very High innovation counties use energy more efficiently
  const efficiency = 1.0 - (innovationIndex / 100) * 0.3 // Up to 30% more efficient

  // Higher innovation correlates with renewable adoption
  const renewable_share = Math.min(90, 20 + (innovationIndex / 100) * 70) // 20-90% renewable

  return { efficiency, renewable_share }
}

/**
 * Project energy demand based on multiple factors
 */
export function projectEnergyDemand(
  base: EnergyDemandFactors,
  innovationIndex: number,
  year: number
): {
  total_demand_gwh: number
  residential_gwh: number
  industrial_gwh: number
  commercial_gwh: number
  renewable_gwh: number
  fossil_gwh: number
} {
  const yearsDelta = year - 2024

  // Population growth factor
  const populationGrowth = 1 + (base.migration_rate / 100) * yearsDelta
  const futurePopulation = base.population_2024 * populationGrowth

  // Climate-driven demand increase
  const climateMultiplier = 1 + (
    (base.cooling_degree_days / 1000) * 0.15 +  // More cooling = more energy
    (base.heating_degree_days / 4000) * 0.10    // More heating = more energy
  )

  // Economic growth factor
  const economicGrowth = Math.pow(1 + base.industrial_growth_rate / 100, yearsDelta)

  // Innovation efficiency factor
  const { efficiency, renewable_share } = getEnergyMultiplier(innovationIndex)

  // Base demand projection
  let baseDemand = base.base_energy_2024

  // Apply growth factors
  baseDemand *= (futurePopulation / base.population_2024) // Population effect
  baseDemand *= climateMultiplier                         // Climate effect
  baseDemand *= economicGrowth                            // Economic effect
  baseDemand *= efficiency                                // Innovation efficiency

  // Sector breakdown (typical US distribution)
  const residential = baseDemand * 0.38
  const industrial = baseDemand * 0.32
  const commercial = baseDemand * 0.30

  // Renewable vs. fossil fuel split
  const renewable = baseDemand * (renewable_share / 100)
  const fossil = baseDemand - renewable

  return {
    total_demand_gwh: Math.round(baseDemand),
    residential_gwh: Math.round(residential),
    industrial_gwh: Math.round(industrial),
    commercial_gwh: Math.round(commercial),
    renewable_gwh: Math.round(renewable),
    fossil_gwh: Math.round(fossil)
  }
}
