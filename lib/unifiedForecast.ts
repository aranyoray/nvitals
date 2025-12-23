/**
 * Unified Energy Forecast Model
 *
 * Integrates all factors:
 * 1. Innovation Index (efficiency gains, renewable adoption)
 * 2. Climate Impact (cooling/heating demand)
 * 3. Migration Patterns (population-driven demand)
 * 4. Disaster Risk (emergency & rebuilding energy)
 */

export interface UnifiedEnergyForecast {
  fips: string
  county_name: string
  state: string
  year: number
  scenario: 'baseline' | 'moderate' | 'high_impact'

  // Base energy
  baseline_energy_2024: number  // GWh

  // Factor contributions (GWh)
  innovation_savings: number     // Negative = energy saved through efficiency
  climate_increase: number       // Additional cooling/heating energy
  migration_change: number       // Energy change from population shifts
  disaster_energy: number        // Expected disaster-related energy

  // Total forecast
  total_energy_2024: number      // Starting point (GWh)
  total_energy_forecast: number  // Projected energy (GWh)
  total_change_pct: number       // % change from 2024

  // Energy mix
  renewable_share_pct: number    // % from renewables
  fossil_share_pct: number       // % from fossil fuels

  // Per capita
  per_capita_kwh: number         // kWh per person per year

  // Breakdown by sector
  residential_gwh: number
  commercial_gwh: number
  industrial_gwh: number

  // Confidence
  forecast_confidence: 'high' | 'medium' | 'low'
}

/**
 * Calculate innovation-driven energy savings
 * Higher innovation = better efficiency & more renewables
 */
export function calculateInnovationSavings(
  baseline_energy: number,
  innovation_index: number,
  years_delta: number
): number {
  // Innovation drives efficiency improvements (0-30% savings by 2055)
  const max_savings_pct = (innovation_index / 100) * 30

  // Savings ramp up over time
  const savings_pct = (years_delta / 31) * max_savings_pct

  // Negative number = energy saved
  return Number((baseline_energy * (savings_pct / 100) * -1).toFixed(2))
}

/**
 * Calculate climate-driven energy increase
 * More extreme temps = more cooling/heating
 */
export function calculateClimateIncrease(
  baseline_energy: number,
  temp_increase: number,
  extreme_heat_days: number
): number {
  // Temperature increase drives cooling demand
  const temp_multiplier = 1 + (temp_increase / 10) * 0.15  // 15% per 10°F increase

  // Extreme heat days add additional demand
  const extreme_multiplier = 1 + (extreme_heat_days / 100) * 0.1

  const total_increase = (baseline_energy * temp_multiplier * extreme_multiplier) - baseline_energy

  return Number(total_increase.toFixed(2))
}

/**
 * Calculate migration-driven energy change
 * Population growth/decline affects demand
 */
export function calculateMigrationChange(
  baseline_energy: number,
  net_migration_rate: number,
  years_delta: number
): number {
  // Compound population change over time
  const annual_rate = net_migration_rate / 100
  const total_pop_change_pct = (Math.pow(1 + annual_rate, years_delta) - 1) * 100

  // Energy scales with population
  const energy_change = baseline_energy * (total_pop_change_pct / 100)

  return Number(energy_change.toFixed(2))
}

/**
 * Calculate renewable energy share
 * Innovation + policy drive renewable adoption
 */
export function calculateRenewableShare(
  innovation_index: number,
  year: number
): number {
  // Base renewable share (2024): ~22% in US
  const base_share = 22

  // Innovation counties adopt renewables faster
  const innovation_boost = (innovation_index / 100) * 40  // Up to +40% for high innovation

  // Time factor (linear growth to 2055)
  const years_delta = year - 2024
  const time_factor = (years_delta / 31) * 0.8  // 80% of potential by 2055

  const future_share = base_share + (innovation_boost * time_factor)

  return Math.min(95, Math.round(future_share))  // Cap at 95%
}

/**
 * Determine forecast confidence
 * Based on data availability and volatility
 */
export function determineForecastConfidence(
  years_delta: number,
  has_disaster_history: boolean
): 'high' | 'medium' | 'low' {
  // Near-term forecasts more reliable
  if (years_delta <= 5) return 'high'
  if (years_delta <= 15) return 'medium'

  // Long-term less certain, especially with disasters
  return has_disaster_history ? 'low' : 'medium'
}

/**
 * Calculate scenario multiplier
 * baseline = moderate assumptions
 * moderate = accelerated climate change
 * high_impact = worst-case scenario
 */
export function getScenarioMultiplier(
  scenario: 'baseline' | 'moderate' | 'high_impact',
  factor: 'innovation' | 'climate' | 'migration' | 'disaster'
): number {
  const multipliers = {
    baseline: {
      innovation: 1.0,
      climate: 1.0,
      migration: 1.0,
      disaster: 1.0
    },
    moderate: {
      innovation: 0.8,    // Less innovation progress
      climate: 1.3,       // More climate impact
      migration: 1.1,     // Slightly more migration
      disaster: 1.4       // More frequent disasters
    },
    high_impact: {
      innovation: 0.6,    // Minimal innovation
      climate: 1.6,       // Severe climate impact
      migration: 1.3,     // Major population shifts
      disaster: 2.0       // Double disaster frequency
    }
  }

  return multipliers[scenario][factor]
}

/**
 * Generate unified energy forecast for a county
 */
export function generateUnifiedForecast(params: {
  fips: string
  county_name: string
  state: string
  year: number
  scenario: 'baseline' | 'moderate' | 'high_impact'

  // Baseline
  baseline_energy_2024: number
  population_2024: number

  // Innovation factor
  innovation_index: number

  // Climate factor
  temp_increase: number
  extreme_heat_days: number

  // Migration factor
  net_migration_rate: number

  // Disaster factor
  disaster_annual_energy: number
  has_disaster_history: boolean
}): UnifiedEnergyForecast {
  const years_delta = params.year - 2024

  // Get scenario multipliers
  const innovation_mult = getScenarioMultiplier(params.scenario, 'innovation')
  const climate_mult = getScenarioMultiplier(params.scenario, 'climate')
  const migration_mult = getScenarioMultiplier(params.scenario, 'migration')
  const disaster_mult = getScenarioMultiplier(params.scenario, 'disaster')

  // Calculate each factor's contribution
  const innovation_savings = calculateInnovationSavings(
    params.baseline_energy_2024,
    params.innovation_index,
    years_delta
  ) * innovation_mult

  const climate_increase = calculateClimateIncrease(
    params.baseline_energy_2024,
    params.temp_increase,
    params.extreme_heat_days
  ) * climate_mult

  const migration_change = calculateMigrationChange(
    params.baseline_energy_2024,
    params.net_migration_rate,
    years_delta
  ) * migration_mult

  const disaster_energy = params.disaster_annual_energy * disaster_mult

  // Total forecast
  const total_energy_forecast = params.baseline_energy_2024 +
                                innovation_savings +
                                climate_increase +
                                migration_change +
                                disaster_energy

  const total_change_pct = ((total_energy_forecast - params.baseline_energy_2024) / params.baseline_energy_2024) * 100

  // Calculate renewable share
  const renewable_share_pct = calculateRenewableShare(params.innovation_index, params.year)
  const fossil_share_pct = 100 - renewable_share_pct

  // Per capita (estimate future population)
  const future_population = params.population_2024 * Math.pow(1 + params.net_migration_rate / 100, years_delta)
  const per_capita_kwh = (total_energy_forecast * 1_000_000) / future_population

  // Sector breakdown (typical US distribution)
  const residential_gwh = total_energy_forecast * 0.38
  const commercial_gwh = total_energy_forecast * 0.30
  const industrial_gwh = total_energy_forecast * 0.32

  // Forecast confidence
  const forecast_confidence = determineForecastConfidence(years_delta, params.has_disaster_history)

  return {
    fips: params.fips,
    county_name: params.county_name,
    state: params.state,
    year: params.year,
    scenario: params.scenario,
    baseline_energy_2024: params.baseline_energy_2024,
    innovation_savings: Number(innovation_savings.toFixed(2)),
    climate_increase: Number(climate_increase.toFixed(2)),
    migration_change: Number(migration_change.toFixed(2)),
    disaster_energy: Number(disaster_energy.toFixed(2)),
    total_energy_2024: params.baseline_energy_2024,
    total_energy_forecast: Number(total_energy_forecast.toFixed(2)),
    total_change_pct: Number(total_change_pct.toFixed(1)),
    renewable_share_pct,
    fossil_share_pct,
    per_capita_kwh: Math.round(per_capita_kwh),
    residential_gwh: Number(residential_gwh.toFixed(2)),
    commercial_gwh: Number(commercial_gwh.toFixed(2)),
    industrial_gwh: Number(industrial_gwh.toFixed(2)),
    forecast_confidence
  }
}

/**
 * Calculate national aggregate forecast
 */
export function aggregateNationalForecast(forecasts: UnifiedEnergyForecast[]): {
  total_energy: number
  total_renewable: number
  total_fossil: number
  avg_innovation_savings: number
  avg_climate_increase: number
  avg_per_capita: number
} {
  const total_energy = forecasts.reduce((sum, f) => sum + f.total_energy_forecast, 0)
  const total_renewable = forecasts.reduce((sum, f) => sum + (f.total_energy_forecast * f.renewable_share_pct / 100), 0)
  const total_fossil = total_energy - total_renewable

  const avg_innovation_savings = forecasts.reduce((sum, f) => sum + f.innovation_savings, 0) / forecasts.length
  const avg_climate_increase = forecasts.reduce((sum, f) => sum + f.climate_increase, 0) / forecasts.length
  const avg_per_capita = forecasts.reduce((sum, f) => sum + f.per_capita_kwh, 0) / forecasts.length

  return {
    total_energy: Number(total_energy.toFixed(0)),
    total_renewable: Number(total_renewable.toFixed(0)),
    total_fossil: Number(total_fossil.toFixed(0)),
    avg_innovation_savings: Number(avg_innovation_savings.toFixed(2)),
    avg_climate_increase: Number(avg_climate_increase.toFixed(2)),
    avg_per_capita: Math.round(avg_per_capita)
  }
}
