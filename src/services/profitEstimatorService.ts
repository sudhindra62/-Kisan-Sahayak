/**
 * @fileOverview Yield adjustment and profit estimation logic based on weather deviations.
 */

import { MSP_2024_25, ICAR_BASE_YIELD } from "@/lib/agriculture-data";

export interface YieldAdjustment {
  label: string;
  value: number;
  type: 'penalty' | 'bonus';
}

export interface ProfitEstimation {
  cropName: string;
  msp: number;
  baseYield: number;
  predictedYield: number;
  adjustments: YieldAdjustment[];
  grossPerAcre: number;
  totalGross: number;
}

export function estimateProfit(
  crop: string,
  landArea: number,
  weatherData: {
    avgRainfall: number;
    avgHumidity: number;
    avgTemp: number;
  }
): ProfitEstimation | null {
  // Normalize crop name mapping
  const mspKey = Object.keys(MSP_2024_25).find(k => k.toLowerCase().includes(crop.toLowerCase()));
  if (!mspKey) return null;

  const msp = MSP_2024_25[mspKey];
  const baseYield = ICAR_BASE_YIELD[mspKey] || 10;
  const adjustments: YieldAdjustment[] = [];

  // Rule 1: Excess Rain Penalty (Baseline 5mm/day)
  if (weatherData.avgRainfall > 6) { // > 20% above 5mm
    const penalty = -(baseYield * 0.05);
    adjustments.push({
      label: "Excess rainfall risk penalty",
      value: parseFloat(penalty.toFixed(2)),
      type: 'penalty'
    });
  }

  // Rule 2: High Humidity Penalty
  if (weatherData.avgHumidity > 88) {
    const penalty = -(baseYield * 0.12);
    adjustments.push({
      label: "High humidity pest risk penalty",
      value: parseFloat(penalty.toFixed(2)),
      type: 'penalty'
    });
  }

  // Rule 3: Optimal Temp Bonus
  if (weatherData.avgTemp >= 22 && weatherData.avgTemp <= 30) {
    const bonus = baseYield * 0.05;
    adjustments.push({
      label: "Optimal temperature bonus",
      value: parseFloat(bonus.toFixed(2)),
      type: 'bonus'
    });
  }

  const totalAdjustment = adjustments.reduce((acc, curr) => acc + curr.value, 0);
  const predictedYield = Math.max(1, baseYield + totalAdjustment);
  const grossPerAcre = predictedYield * msp;
  const totalGross = grossPerAcre * landArea;

  return {
    cropName: mspKey,
    msp,
    baseYield,
    predictedYield: parseFloat(predictedYield.toFixed(2)),
    adjustments,
    grossPerAcre: Math.round(grossPerAcre),
    totalGross: Math.round(totalGross)
  };
}
