import { FAO_CROP_PROFILES } from '@/lib/agriculture-data';

export interface WaterStressResult {
  cropName: string; emoji: string; waterNeedMm: number; forecastSupplyMm: number; irrigationNeedMm: number; totalSupplyMm: number; deficitMm: number; surplusMm: number; supplyPct: number; status: string; statusLabel: string; statusColor: string; estimatedYieldImpactPct: number; irrigationCostEstimate: number; advice: string;
}

export function computeWaterStress(rain: number, irrig: number, crop: string, land: number): WaterStressResult {
  const p = FAO_CROP_PROFILES[crop] || FAO_CROP_PROFILES['Maize'];
  const need = p.seasonalWaterNeedMm;
  const total = rain + irrig;
  const pct = Math.min(150, (total / need) * 100);
  const def = Math.max(0, need - total);
  
  let s = 'major_deficit', sl = 'Major Deficit', sc = '#b71c1c';
  if (pct >= 110) { s = 'waterlogged'; sl = 'Waterlog Risk'; sc = '#1565C0'; }
  else if (pct >= 90) { s = 'sufficient'; sl = 'Sufficient'; sc = '#2e7d32'; }
  else if (pct >= 70) { s = 'slight_deficit'; sl = 'Slight Deficit'; sc = '#e65100'; }

  return {
    cropName: p.cropName, emoji: p.emoji, waterNeedMm: need, forecastSupplyMm: rain, irrigationNeedMm: Math.max(0, need - rain), totalSupplyMm: total, deficitMm: def, surplusMm: Math.max(0, total - need), supplyPct: Math.round(pct), status: s, statusLabel: sl, statusColor: sc, 
    estimatedYieldImpactPct: parseFloat((Math.max(0, 100-pct) > p.deficitTolerancePct ? (100-pct-p.deficitTolerancePct)*1.8 : 0).toFixed(1)),
    irrigationCostEstimate: Math.round((Math.max(0, need-rain) * p.irrigationCostPerMm * land) / 100) * 100,
    advice: pct >= 90 ? "Adequate rain/irrigation." : `Plan ${def}mm supplemental water.`
  };
}
