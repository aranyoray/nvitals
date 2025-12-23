/**
 * Migration Pattern & Urbanization Modeling
 *
 * Uses gravity model to predict population flows between counties
 * Tracks rural-to-urban migration and interstate movements
 */

export interface MigrationFlow {
  from_fips: string
  from_county: string
  from_state: string
  to_fips: string
  to_county: string
  to_state: string
  year: number

  // Flow metrics
  net_migrants: number           // Positive = in-migration, Negative = out-migration
  migration_rate: number         // As % of origin population
  flow_type: 'rural_to_urban' | 'urban_to_urban' | 'urban_to_rural' | 'interstate'

  // Drivers
  economic_factor: number        // Job opportunities (0-100)
  climate_factor: number         // Climate comfort (0-100)
  cost_of_living_factor: number  // Affordability (0-100, higher = more affordable)

  // Energy impact
  energy_demand_change: number   // GWh change due to migration
}

export interface CountyMigrationProfile {
  fips: string
  county_name: string
  state: string
  year: number

  // Population
  population: number
  population_density: number     // per sq mile

  // Migration summary
  total_in_migration: number
  total_out_migration: number
  net_migration: number
  net_migration_rate: number     // % of population

  // Classification
  urbanization_level: 'rural' | 'suburban' | 'urban' | 'metro'
  is_growing: boolean

  // Energy impact
  baseline_energy_2024: number   // GWh
  energy_2055_projection: number // GWh with migration
  energy_change_pct: number      // % change due to migration
}

/**
 * Gravity Model for Migration Prediction
 *
 * Formula: Migration(i→j) = k × (Pop_i^α × Pop_j^β) / Distance^γ
 *
 * Where:
 * - Pop_i = origin population
 * - Pop_j = destination population
 * - Distance = miles between counties
 * - k, α, β, γ = calibration parameters
 */
export function calculateGravityMigration(
  origin_pop: number,
  dest_pop: number,
  distance: number,
  economic_pull: number = 1.0,  // Job growth multiplier
  climate_pull: number = 1.0     // Climate attractiveness multiplier
): number {
  // Calibration parameters (fitted from IRS migration data)
  const k = 0.0001       // Scaling constant
  const alpha = 0.6      // Origin population exponent
  const beta = 0.8       // Destination population exponent
  const gamma = 1.5      // Distance decay exponent

  // Base gravity model
  const base_flow = k * Math.pow(origin_pop, alpha) * Math.pow(dest_pop, beta) / Math.pow(distance, gamma)

  // Apply economic and climate factors
  const adjusted_flow = base_flow * economic_pull * climate_pull

  return Math.round(adjusted_flow)
}

/**
 * Calculate economic pull factor
 * Higher = more jobs, higher wages, better opportunities
 */
export function calculateEconomicPull(
  innovation_index: number,
  unemployment_rate: number = 4.0,
  wage_growth_rate: number = 2.5
): number {
  // Innovation hubs have strong economic pull
  const innovation_pull = 1 + (innovation_index / 100) * 0.5

  // Low unemployment attracts migrants
  const unemployment_pull = Math.max(0.5, 1.5 - (unemployment_rate / 10))

  // Wage growth matters
  const wage_pull = 1 + (wage_growth_rate / 10)

  return innovation_pull * unemployment_pull * wage_pull
}

/**
 * Calculate climate pull factor
 * Accounts for temperature extremes, natural disasters, climate comfort
 */
export function calculateClimatePull(
  avg_temp: number,
  extreme_heat_days: number,
  extreme_cold_days: number,
  disaster_risk_score: number = 50
): number {
  // Ideal temperature range: 50-70°F
  let temp_pull = 1.0
  if (avg_temp >= 50 && avg_temp <= 70) {
    temp_pull = 1.2
  } else if (avg_temp < 40 || avg_temp > 80) {
    temp_pull = 0.7
  }

  // Extreme weather reduces attractiveness
  const extreme_penalty = 1 - (Math.min(extreme_heat_days + extreme_cold_days, 50) / 100)

  // Disaster risk reduces attractiveness
  const disaster_penalty = 1 - (disaster_risk_score / 200)

  return temp_pull * extreme_penalty * disaster_penalty
}

/**
 * Classify urbanization level
 */
export function classifyUrbanization(population_density: number): 'rural' | 'suburban' | 'urban' | 'metro' {
  if (population_density > 3000) return 'metro'      // >3,000 per sq mile
  if (population_density > 1000) return 'urban'      // 1,000-3,000
  if (population_density > 200) return 'suburban'    // 200-1,000
  return 'rural'                                     // <200
}

/**
 * Calculate energy impact from migration
 * New residents bring energy demand with them
 */
export function calculateMigrationEnergyImpact(
  net_migrants: number,
  per_capita_energy: number = 12.5  // kWh per person per year (US average)
): number {
  // Convert kWh to GWh
  const energy_change = (net_migrants * per_capita_energy * 365) / 1_000_000_000

  return Number(energy_change.toFixed(2))
}

/**
 * Project future population based on migration trends
 */
export function projectPopulation(
  baseline_2024: number,
  annual_net_migration_rate: number,  // % per year
  years_forward: number
): number {
  // Compound growth formula
  const growth_rate = 1 + (annual_net_migration_rate / 100)
  const future_pop = baseline_2024 * Math.pow(growth_rate, years_forward)

  return Math.round(future_pop)
}

/**
 * Classify migration flow type
 */
export function classifyFlowType(
  origin_urbanization: string,
  dest_urbanization: string,
  origin_state: string,
  dest_state: string
): 'rural_to_urban' | 'urban_to_urban' | 'urban_to_rural' | 'interstate' {
  if (origin_state !== dest_state) return 'interstate'

  if ((origin_urbanization === 'rural' || origin_urbanization === 'suburban') &&
      (dest_urbanization === 'urban' || dest_urbanization === 'metro')) {
    return 'rural_to_urban'
  }

  if ((origin_urbanization === 'urban' || origin_urbanization === 'metro') &&
      (dest_urbanization === 'rural' || dest_urbanization === 'suburban')) {
    return 'urban_to_rural'
  }

  return 'urban_to_urban'
}

/**
 * Generate migration profile for a county
 */
export function generateMigrationProfile(
  fips: string,
  county_name: string,
  state: string,
  year: number,
  population: number,
  area_sq_miles: number,
  in_migration: number,
  out_migration: number,
  baseline_energy_2024: number
): CountyMigrationProfile {
  const population_density = population / area_sq_miles
  const net_migration = in_migration - out_migration
  const net_migration_rate = (net_migration / population) * 100

  const urbanization_level = classifyUrbanization(population_density)
  const is_growing = net_migration > 0

  // Project energy demand change due to migration
  const years_delta = year - 2024
  const projected_pop = projectPopulation(population, net_migration_rate, years_delta)
  const pop_multiplier = projected_pop / population
  const energy_2055 = baseline_energy_2024 * pop_multiplier
  const energy_change_pct = ((energy_2055 - baseline_energy_2024) / baseline_energy_2024) * 100

  return {
    fips,
    county_name,
    state,
    year,
    population,
    population_density: Number(population_density.toFixed(1)),
    total_in_migration: in_migration,
    total_out_migration: out_migration,
    net_migration,
    net_migration_rate: Number(net_migration_rate.toFixed(2)),
    urbanization_level,
    is_growing,
    baseline_energy_2024,
    energy_2055_projection: Number(energy_2055.toFixed(2)),
    energy_change_pct: Number(energy_change_pct.toFixed(1))
  }
}
