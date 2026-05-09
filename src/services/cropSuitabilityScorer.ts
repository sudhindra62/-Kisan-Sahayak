import { ICAR_CROP_PROFILES } from '@/lib/agriculture-data';

export interface SeasonWeather {
  temperature: { min: number; max: number };
  humidity: number;
  rainfall: number;
}

export interface CropScore {
  cropName: string;
  emoji: string;
  score: number;
  breakdown: { tempFit: number; rainFit: number; humidityFit: number; icarWeight: number; };
}

export function scoreCrops(weather: SeasonWeather): CropScore[] {
  const avgTemp = (weather.temperature.min + weather.temperature.max) / 2;
  return ICAR_CROP_PROFILES.map((p) => {
    const tFit = 100 * Math.exp(-0.5 * Math.pow((avgTemp - (p.tempRange.min + p.tempRange.max)/2) / ((p.tempRange.max - p.tempRange.min)/2 || 1), 2));
    let rFit = 100 * Math.exp(-0.5 * Math.pow((weather.rainfall - (p.rainRange.min + p.rainRange.max)/2) / ((p.rainRange.max - p.rainRange.min)/2 || 1), 2));
    if (weather.rainfall > p.rainRange.max * 2) rFit *= 0.6;
    let hFit = 100;
    if (weather.humidity < p.humidityRange.min) hFit = Math.max(0, 100 - (p.humidityRange.min - weather.humidity) * 3);
    else if (weather.humidity > p.humidityRange.max) hFit = Math.max(0, 100 - (weather.humidity - p.humidityRange.max) * 3);
    
    return {
      cropName: p.name, emoji: p.emoji, score: Math.round((tFit * 0.35 + rFit * 0.40 + hFit * 0.25) * p.icarWeight),
      breakdown: { tempFit: Math.round(tFit), rainFit: Math.round(rFit), humidityFit: Math.round(hFit), icarWeight: p.icarWeight }
    };
  }).sort((a, b) => b.score - a.score).slice(0, 7);
}
