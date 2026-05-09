import { MSP_2024_25, SOIL_SCORE_BY_STATE, RISK_PROFILES, ICAR_CROP_PROFILES } from '@/lib/agriculture-data';

export interface ComparisonDimension {
  key: string; label: string; emoji: string; score: number; grade: 'A' | 'B+' | 'B' | 'C' | 'D'; explanation: string; sourceTag: string;
}

export interface CropComparisonResult {
  cropName: string; emoji: string; overallScore: number; overallGrade: 'A' | 'B+' | 'B' | 'C' | 'D'; rank: 1 | 2 | 3; badge: string; badgeColor: string; dimensions: ComparisonDimension[]; summaryLine: string;
}

const getGrade = (s: number): any => s >= 88 ? 'A' : s >= 75 ? 'B+' : s >= 60 ? 'B' : s >= 45 ? 'C' : 'D';

export function compareCrops(names: string[], weather: any, state: string): CropComparisonResult[] {
  if (!weather?.temperature) return [];
  const avgT = (weather.temperature.min + weather.temperature.max) / 2;
  
  const results = names.map(n => {
    const k = Object.keys(MSP_2024_25).find(x => n.toLowerCase().includes(x.toLowerCase())) || 'Maize';
    const p = ICAR_CROP_PROFILES.find(x => x.name === k) || ICAR_CROP_PROFILES[2];
    
    const rFit = 100 * Math.exp(-0.5 * Math.pow((weather.rainfall - (p.rainRange.min + p.rainRange.max)/2) / ((p.rainRange.max - p.rainRange.min)/2 || 1), 2));
    const tFit = 100 * Math.exp(-0.5 * Math.pow((avgT - (p.tempRange.min + p.tempRange.max)/2) / ((p.tempRange.max - p.tempRange.min)/2 || 1), 2));
    const mspS = Math.round((( (MSP_2024_25[k] || 2000) - 340) / (7280 - 340)) * 100);
    const soilS = (SOIL_SCORE_BY_STATE[state] || SOIL_SCORE_BY_STATE['Bihar'])[k] || 70;
    const riskS = Math.round(100 - Math.min(100, (RISK_PROFILES[k] || 30) + (Math.abs(weather.temperature.max - p.tempRange.max) / 5) * 8));

    const score = Math.round(rFit * 0.28 + tFit * 0.27 + mspS * 0.20 + soilS * 0.15 + riskS * 0.10);
    return {
      cropName: n, emoji: p.emoji, overallScore: score, overallGrade: getGrade(score), rank: 1 as any, badge: '', badgeColor: '',
      summaryLine: `${getGrade(rFit)} weather fit, ${getGrade(mspS)} market value.`,
      dimensions: [
        { key: 'rain', label: 'Rainfall', emoji: '🌧️', score: Math.round(rFit), grade: getGrade(rFit), explanation: `Rainfall fit for ${n}.`, sourceTag: "Open-Meteo" },
        { key: 'temp', label: 'Temp', emoji: '🌡️', score: Math.round(tFit), grade: getGrade(tFit), explanation: `Temp fit for ${n}.`, sourceTag: "Open-Meteo" },
        { key: 'msp', label: 'Market', emoji: '💰', score: mspS, grade: getGrade(mspS), explanation: `MSP support.`, sourceTag: "CACP" },
        { key: 'soil', label: 'Soil', emoji: '🌱', score: soilS, grade: getGrade(soilS), explanation: `Soil match.`, sourceTag: "ICAR" },
        { key: 'risk', label: 'Risk', emoji: '⚠️', score: riskS, grade: getGrade(riskS), explanation: `Climate risk.`, sourceTag: "ICAR" }
      ]
    };
  }).sort((a,b) => b.overallScore - a.overallScore);

  return results.map((r, i) => ({ ...r, rank: (i+1) as any, badge: i === 0 ? (r.overallScore >= 75 ? 'Best Choice' : 'Decent Option') : 'Alternative', badgeColor: i === 0 ? '#2e7d32' : '#1565c0' }));
}

export function getComparisonInsight(r: CropComparisonResult[]) {
  if (r.length < 2) return "";
  return `${r[0].cropName} scores highest with ${r[0].overallScore}/100 based on forecast data. ${r[r.length-1].cropName} is least suited due to limiting factors.`;
}
