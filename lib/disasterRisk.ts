/**
 * Disaster Risk & Extreme Events Modeling
 *
 * Models energy requirements for:
 * - Emergency response (rescue, temporary shelters, hospitals)
 * - Infrastructure rebuilding
 * - Climate-driven disaster probability changes
 */

export type DisasterType = 'hurricane' | 'tornado' | 'flood' | 'wildfire' | 'extreme_heat' | 'winter_storm'

export interface DisasterEvent {
  fips: string
  county_name: string
  state: string
  year: number
  disaster_type: DisasterType

  // Risk metrics
  annual_probability: number      // % chance per year (0-100)
  severity_score: number          // 0-100 (higher = more severe)
  expected_annual_loss: number    // $ millions

  // Energy requirements
  emergency_energy_gwh: number    // Immediate response energy (GWh)
  rebuild_energy_gwh: number      // Infrastructure rebuilding (GWh)
  total_disaster_energy: number   // Total energy impact (GWh)

  // Impact factors
  population_affected: number
  buildings_at_risk: number
  infrastructure_vulnerability: number  // 0-100
}

export interface CountyDisasterProfile {
  fips: string
  county_name: string
  state: string
  year: number

  // Composite risk
  overall_risk_score: number      // 0-100 composite
  risk_category: 'low' | 'moderate' | 'high' | 'very_high'

  // Individual disaster risks
  hurricane_risk: number
  tornado_risk: number
  flood_risk: number
  wildfire_risk: number
  extreme_heat_risk: number
  winter_storm_risk: number

  // Energy impact
  total_annual_disaster_energy: number  // Expected energy need (GWh)
  energy_as_pct_of_baseline: number     // % of normal consumption
}

/**
 * Calculate disaster probability based on historical frequency and climate change
 */
export function calculateDisasterProbability(
  historical_events_per_decade: number,
  climate_multiplier: number = 1.0,  // Increases with warming (1.0-2.0)
  year: number
): number {
  // Base probability from historical data
  const base_annual_probability = (historical_events_per_decade / 10) * 100

  // Climate change increases extreme event frequency over time
  const years_from_2024 = year - 2024
  const climate_increase = 1 + (climate_multiplier - 1) * (years_from_2024 / 30)

  const future_probability = Math.min(100, base_annual_probability * climate_increase)

  return Number(future_probability.toFixed(2))
}

/**
 * Calculate severity score based on typical damage and casualties
 */
export function calculateSeverityScore(
  avg_fatalities: number,
  avg_damage_millions: number,
  geographic_vulnerability: number = 50  // 0-100
): number {
  // Fatality component (0-40 points)
  const fatality_score = Math.min(40, avg_fatalities * 2)

  // Economic damage component (0-40 points)
  const damage_score = Math.min(40, avg_damage_millions / 50)

  // Geographic vulnerability (0-20 points)
  const geo_score = (geographic_vulnerability / 100) * 20

  const total_score = fatality_score + damage_score + geo_score

  return Math.round(Math.min(100, total_score))
}

/**
 * Calculate emergency response energy needs
 * Includes: rescue operations, temporary shelters, emergency hospitals, communications
 */
export function calculateEmergencyEnergy(
  population_affected: number,
  severity_score: number
): number {
  // Base energy per person for emergency response (kWh)
  // Includes: shelter lighting/heating, medical equipment, communications, rescue equipment
  const base_kwh_per_person = 50

  // Severity multiplier (more severe = more intensive operations)
  const severity_multiplier = 1 + (severity_score / 100)

  // Total emergency energy in kWh
  const total_kwh = population_affected * base_kwh_per_person * severity_multiplier

  // Convert to GWh
  return Number((total_kwh / 1_000_000).toFixed(2))
}

/**
 * Calculate rebuilding energy needs
 * Includes: construction equipment, manufacturing materials, debris removal
 */
export function calculateRebuildingEnergy(
  buildings_damaged: number,
  infrastructure_damage_pct: number,  // % of infrastructure damaged
  severity_score: number
): number {
  // Energy per building rebuild (average: 50,000 kWh for residential, 200,000 for commercial)
  const avg_kwh_per_building = 80_000

  // Infrastructure energy (roads, utilities, bridges)
  const infrastructure_kwh = (infrastructure_damage_pct / 100) * 5_000_000

  // Severity affects rebuild complexity
  const severity_multiplier = 1 + (severity_score / 200)

  const total_kwh = (buildings_damaged * avg_kwh_per_building + infrastructure_kwh) * severity_multiplier

  // Convert to GWh
  return Number((total_kwh / 1_000_000).toFixed(2))
}

/**
 * Hurricane risk model
 * Higher for coastal counties, increases with ocean warming
 */
export function calculateHurricaneRisk(
  is_coastal: boolean,
  latitude: number,
  year: number
): number {
  if (!is_coastal) return 0

  // Atlantic/Gulf coast between 25°N and 40°N most at risk
  let base_risk = 0
  if (latitude >= 25 && latitude <= 40) {
    base_risk = 40
  } else if (latitude > 40 && latitude <= 45) {
    base_risk = 15  // Lower risk but increasing
  }

  // Ocean warming increases hurricane intensity and frequency
  const years_delta = year - 2024
  const climate_multiplier = 1 + (years_delta / 30) * 0.5  // 50% increase by 2055

  return Math.round(Math.min(100, base_risk * climate_multiplier))
}

/**
 * Tornado risk model
 * Higher in tornado alley (Great Plains, Midwest)
 */
export function calculateTornadoRisk(
  state: string,
  year: number
): number {
  // Tornado alley and Dixie alley states
  const high_risk_states = ['OK', 'KS', 'NE', 'TX', 'AR', 'MS', 'AL', 'TN']
  const moderate_risk_states = ['MO', 'IL', 'IN', 'OH', 'IA', 'LA']

  let base_risk = 0
  if (high_risk_states.includes(state)) {
    base_risk = 60
  } else if (moderate_risk_states.includes(state)) {
    base_risk = 30
  } else {
    base_risk = 5
  }

  // Climate change increases severe weather
  const years_delta = year - 2024
  const climate_multiplier = 1 + (years_delta / 30) * 0.3  // 30% increase

  return Math.round(Math.min(100, base_risk * climate_multiplier))
}

/**
 * Flood risk model
 * Higher near rivers, coastal areas, and with increased precipitation
 */
export function calculateFloodRisk(
  near_major_river: boolean,
  is_coastal: boolean,
  elevation_low: boolean,
  year: number
): number {
  let base_risk = 20  // Everyone has some flood risk

  if (near_major_river) base_risk += 25
  if (is_coastal) base_risk += 20
  if (elevation_low) base_risk += 15

  // Climate change increases extreme precipitation
  const years_delta = year - 2024
  const climate_multiplier = 1 + (years_delta / 30) * 0.4  // 40% increase

  return Math.round(Math.min(100, base_risk * climate_multiplier))
}

/**
 * Wildfire risk model
 * Higher in Western states, increases with heat and drought
 */
export function calculateWildfireRisk(
  state: string,
  avg_temp: number,
  year: number
): number {
  // High wildfire risk states
  const high_risk_states = ['CA', 'OR', 'WA', 'ID', 'MT', 'WY', 'CO', 'AZ', 'NM']
  const moderate_risk_states = ['NV', 'UT', 'TX', 'OK']

  let base_risk = 0
  if (high_risk_states.includes(state)) {
    base_risk = 50
  } else if (moderate_risk_states.includes(state)) {
    base_risk = 25
  } else {
    base_risk = 5
  }

  // Temperature increases wildfire risk
  if (avg_temp > 60) {
    base_risk += (avg_temp - 60) * 0.5
  }

  // Climate change dramatically increases wildfire frequency
  const years_delta = year - 2024
  const climate_multiplier = 1 + (years_delta / 30) * 0.6  // 60% increase

  return Math.round(Math.min(100, base_risk * climate_multiplier))
}

/**
 * Extreme heat risk model
 * Increases significantly with climate change
 */
export function calculateExtremeHeatRisk(
  avg_temp: number,
  extreme_heat_days: number,
  year: number
): number {
  let base_risk = 0

  // Base risk from average temperature
  if (avg_temp > 75) base_risk = 40
  else if (avg_temp > 65) base_risk = 20
  else base_risk = 5

  // Extreme heat days amplify risk
  base_risk += Math.min(30, extreme_heat_days * 0.5)

  // Climate change rapidly increases heat extremes
  const years_delta = year - 2024
  const climate_multiplier = 1 + (years_delta / 30) * 0.7  // 70% increase

  return Math.round(Math.min(100, base_risk * climate_multiplier))
}

/**
 * Calculate composite overall disaster risk score
 */
export function calculateOverallRiskScore(
  hurricane: number,
  tornado: number,
  flood: number,
  wildfire: number,
  extreme_heat: number,
  winter_storm: number
): number {
  // Weighted average (some disasters more impactful)
  const weighted_score = (
    hurricane * 0.25 +
    tornado * 0.20 +
    flood * 0.20 +
    wildfire * 0.15 +
    extreme_heat * 0.15 +
    winter_storm * 0.05
  )

  return Math.round(weighted_score)
}

/**
 * Categorize risk level
 */
export function categorizeRisk(score: number): 'low' | 'moderate' | 'high' | 'very_high' {
  if (score >= 70) return 'very_high'
  if (score >= 50) return 'high'
  if (score >= 30) return 'moderate'
  return 'low'
}
