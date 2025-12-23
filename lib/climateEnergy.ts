/**
 * Climate Energy Demand Forecasting
 *
 * Calculates energy demand for heating and cooling based on:
 * - Temperature projections (NOAA/IPCC scenarios)
 * - Cooling Degree Days (CDD)
 * - Heating Degree Days (HDD)
 * - Population and building stock
 */

export interface ClimateProjection {
  fips: string
  county_name: string
  state: string
  year: number
  scenario: 'RCP45' | 'RCP85' // Representative Concentration Pathways

  // Temperature metrics (°F)
  avg_temp: number
  summer_peak_temp: number  // Average high in July/August
  winter_low_temp: number   // Average low in January/February

  // Degree days
  cooling_degree_days: number  // Base 65°F
  heating_degree_days: number  // Base 65°F

  // Extreme events
  extreme_heat_days: number    // Days >95°F
  extreme_cold_days: number    // Days <10°F

  // Energy demand (GWh)
  cooling_energy_demand: number
  heating_energy_demand: number
  total_climate_energy: number

  // Comparison to baseline (2024)
  cooling_increase_pct: number
  heating_change_pct: number   // Can be negative if warmer winters
}

export interface BaselineClimate {
  fips: string
  avg_temp_2024: number
  cdd_2024: number
  hdd_2024: number
  population_2024: number
  households_2024: number
  avg_home_sqft: number
}

/**
 * Calculate Cooling Degree Days (CDD)
 * CDD = sum of (daily_avg_temp - 65°F) for all days where temp > 65°F
 */
export function calculateCoolingDegreeDays(
  avgSummerTemp: number,
  daysAbove65: number
): number {
  // Simplified calculation - in reality this would use daily temperature data
  const avgDailyContribution = Math.max(0, avgSummerTemp - 65)
  return avgDailyContribution * daysAbove65
}

/**
 * Calculate Heating Degree Days (HDD)
 * HDD = sum of (65°F - daily_avg_temp) for all days where temp < 65°F
 */
export function calculateHeatingDegreeDays(
  avgWinterTemp: number,
  daysBelow65: number
): number {
  const avgDailyContribution = Math.max(0, 65 - avgWinterTemp)
  return avgDailyContribution * daysBelow65
}

/**
 * Project cooling energy demand
 *
 * Formula: Cooling Energy (kWh) = CDD × Households × Cooling Efficiency Factor
 * Typical US home: ~0.5 kWh per degree-day
 */
export function projectCoolingDemand(
  cdd: number,
  households: number,
  avgHomeSqft: number = 2000
): number {
  // kWh per degree-day per household (varies by home size and efficiency)
  const kwhPerDD = (avgHomeSqft / 2000) * 0.5

  // Total cooling demand in kWh
  const totalKwh = cdd * households * kwhPerDD

  // Convert to GWh
  return totalKwh / 1_000_000
}

/**
 * Project heating energy demand
 *
 * Formula: Heating Energy (kWh) = HDD × Households × Heating Efficiency Factor
 * Typical US home: ~0.3 kWh per degree-day (more efficient than cooling)
 */
export function projectHeatingDemand(
  hdd: number,
  households: number,
  avgHomeSqft: number = 2000
): number {
  const kwhPerDD = (avgHomeSqft / 2000) * 0.3
  const totalKwh = hdd * households * kwhPerDD
  return totalKwh / 1_000_000
}

/**
 * Project temperature change based on IPCC scenarios
 *
 * RCP 4.5: Moderate emissions reduction (~2.4°C / 4.3°F by 2100)
 * RCP 8.5: High emissions "business as usual" (~4.3°C / 7.7°F by 2100)
 */
export function projectTemperature(
  baseline2024: number,
  year: number,
  scenario: 'RCP45' | 'RCP85',
  latitude: number // For regional variation
): number {
  const yearsDelta = year - 2024

  // Annual warming rate (°F per year)
  const warmingRateRCP45 = 0.04  // ~1.2°F per 30 years
  const warmingRateRCP85 = 0.08  // ~2.4°F per 30 years

  const warmingRate = scenario === 'RCP45' ? warmingRateRCP45 : warmingRateRCP85

  // Higher latitudes (northern US) warm faster
  const latitudeMultiplier = latitude > 40 ? 1.5 : 1.0

  const totalWarming = warmingRate * yearsDelta * latitudeMultiplier

  return baseline2024 + totalWarming
}

/**
 * Calculate percentage change in cooling demand
 */
export function calculateCoolingIncrease(
  cdd2024: number,
  cddFuture: number
): number {
  if (cdd2024 === 0) return 0
  return ((cddFuture - cdd2024) / cdd2024) * 100
}

/**
 * Generate climate projection for a county
 */
export function generateClimateProjection(
  baseline: BaselineClimate,
  year: number,
  scenario: 'RCP45' | 'RCP85',
  latitude: number
): Omit<ClimateProjection, 'fips' | 'county_name' | 'state'> {
  // Project future average temperature
  const futureAvgTemp = projectTemperature(baseline.avg_temp_2024, year, scenario, latitude)

  // Summer temps increase more than annual average
  const futureSummerPeak = baseline.avg_temp_2024 + (futureAvgTemp - baseline.avg_temp_2024) * 1.3 + 25

  // Winter temps increase but at lower rate
  const futureWinterLow = baseline.avg_temp_2024 + (futureAvgTemp - baseline.avg_temp_2024) * 0.8 - 30

  // Estimate days above/below 65°F
  const daysAbove65 = Math.min(365, 150 + (futureAvgTemp - baseline.avg_temp_2024) * 8)
  const daysBelow65 = 365 - daysAbove65

  // Calculate degree days
  const futureCDD = calculateCoolingDegreeDays(futureSummerPeak - 20, daysAbove65)
  const futureHDD = calculateHeatingDegreeDays(futureWinterLow + 30, daysBelow65)

  // Extreme weather days
  const extremeHeatDays = Math.max(0, (futureSummerPeak - 95) * 2)
  const extremeColdDays = Math.max(0, (10 - futureWinterLow) * 1.5)

  // Project energy demand
  const coolingDemand = projectCoolingDemand(futureCDD, baseline.households_2024, baseline.avg_home_sqft)
  const heatingDemand = projectHeatingDemand(futureHDD, baseline.households_2024, baseline.avg_home_sqft)

  // Calculate percentage changes
  const coolingIncrease = calculateCoolingIncrease(baseline.cdd_2024, futureCDD)
  const heatingChange = ((futureHDD - baseline.hdd_2024) / baseline.hdd_2024) * 100

  return {
    year,
    scenario,
    avg_temp: Number(futureAvgTemp.toFixed(1)),
    summer_peak_temp: Number(futureSummerPeak.toFixed(1)),
    winter_low_temp: Number(futureWinterLow.toFixed(1)),
    cooling_degree_days: Math.round(futureCDD),
    heating_degree_days: Math.round(futureHDD),
    extreme_heat_days: Math.round(extremeHeatDays),
    extreme_cold_days: Math.round(extremeColdDays),
    cooling_energy_demand: Number(coolingDemand.toFixed(2)),
    heating_energy_demand: Number(heatingDemand.toFixed(2)),
    total_climate_energy: Number((coolingDemand + heatingDemand).toFixed(2)),
    cooling_increase_pct: Number(coolingIncrease.toFixed(1)),
    heating_change_pct: Number(heatingChange.toFixed(1))
  }
}

/**
 * Get county latitude (simplified - in production would use actual county centroids)
 */
export function getCountyLatitude(state: string): number {
  const stateLatitudes: Record<string, number> = {
    'FL': 28, 'TX': 31, 'AZ': 34, 'CA': 37, 'GA': 33,
    'NC': 36, 'VA': 37, 'PA': 41, 'NY': 43, 'IL': 40,
    'OH': 40, 'MI': 44, 'WI': 44, 'MN': 46, 'WA': 47,
    'OR': 44, 'CO': 39, 'NE': 41, 'IA': 42, 'SD': 44,
    'MA': 42, 'ME': 45, 'NH': 44, 'VT': 44, 'MT': 47
  }
  return stateLatitudes[state] || 40
}
