'use client';

const CACHE_KEY_PREFIX = 'ks_weather_';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

const STATE_COORDINATES: Record<string, { lat: number; lon: number; city: string }> = {
  'Andhra Pradesh': { lat: 15.8487, lon: 78.4616, city: "Amaravati" },
  'Arunachal Pradesh': { lat: 27.0844, lon: 93.6053, city: "Itanagar" },
  'Assam': { lat: 26.1433, lon: 91.7363, city: "Dispur" },
  'Bihar': { lat: 25.5941, lon: 85.1376, city: "Patna" },
  'Chhattisgarh': { lat: 21.2787, lon: 81.6296, city: "Raipur" },
  'Goa': { lat: 15.4909, lon: 73.8278, city: "Panaji" },
  'Gujarat': { lat: 23.2156, lon: 72.6369, city: "Gandhinagar" },
  'Haryana': { lat: 30.7333, lon: 76.7794, city: "Chandigarh" },
  'Himachal Pradesh': { lat: 31.1048, lon: 77.1734, city: "Shimla" },
  'Jharkhand': { lat: 23.3441, lon: 85.3094, city: "Ranchi" },
  'Karnataka': { lat: 12.9716, lon: 77.5946, city: "Bengaluru" },
  'Kerala': { lat: 8.5241, lon: 76.9366, city: "Thiruvananthapuram" },
  'Madhya Pradesh': { lat: 23.2599, lon: 77.4126, city: "Bhopal" },
  'Maharashtra': { lat: 18.5204, lon: 73.8567, city: "Mumbai" },
  'Manipur': { lat: 24.8170, lon: 93.9368, city: "Imphal" },
  'Meghalaya': { lat: 25.5788, lon: 91.8833, city: "Shillong" },
  'Mizoram': { lat: 23.7271, lon: 92.7176, city: "Aizawl" },
  'Nagaland': { lat: 25.6751, lon: 94.1086, city: "Kohima" },
  'Odisha': { lat: 20.2961, lon: 85.8245, city: "Bhubaneswar" },
  'Punjab': { lat: 30.7333, lon: 76.7794, city: "Chandigarh" },
  'Rajasthan': { lat: 26.9124, lon: 75.7873, city: "Jaipur" },
  'Sikkim': { lat: 27.3314, lon: 88.6138, city: "Gangtok" },
  'Tamil Nadu': { lat: 13.0827, lon: 80.2707, city: "Chennai" },
  'Telangana': { lat: 17.3850, lon: 78.4867, city: "Hyderabad" },
  'Tripura': { lat: 23.8315, lon: 91.2868, city: "Agartala" },
  'Uttar Pradesh': { lat: 26.8467, lon: 80.9462, city: "Lucknow" },
  'Uttarakhand': { lat: 30.3165, lon: 78.0322, city: "Dehradun" },
  'West Bengal': { lat: 22.5726, lon: 88.3639, city: "Kolkata" },
};

export interface WeatherSeasonData {
  season: string;
  months: string;
  temperature: { min: number; max: number };
  humidity: number;
  rainfall: number;
  windCondition: string;
  forecastType: "live_16day" | "historical_avg";
}

function aggregateToSeasons(liveData: any, climateData: any): WeatherSeasonData[] {
  const seasons = [
    { name: 'Winter / Rabi', months: 'Jan-Mar', range: [0, 1, 2] },
    { name: 'Summer / Pre-Monsoon', months: 'Apr-Jun', range: [3, 4, 5] },
    { name: 'Monsoon / Kharif', months: 'Jul-Sep', range: [6, 7, 8] },
    { name: 'Post-Monsoon / Harvest', months: 'Oct-Dec', range: [9, 10, 11] },
  ];

  const now = new Date();
  const currentMonth = now.getMonth();

  return seasons.map((s) => {
    const isLive = s.range.includes(currentMonth) || s.range.includes((currentMonth + 1) % 12);
    const monthIndex = s.range[0];
    const avgMax = climateData?.monthly_data?.temperature_2m_max?.[monthIndex] || 30;
    const avgMin = climateData?.monthly_data?.temperature_2m_min?.[monthIndex] || 18;
    const avgPrecip = climateData?.monthly_data?.precipitation_sum?.[monthIndex] || 50;

    return {
      season: s.name,
      months: s.months,
      temperature: {
        min: Math.round(isLive ? (liveData?.daily?.temperature_2m_min?.[0] || avgMin) : avgMin),
        max: Math.round(isLive ? (liveData?.daily?.temperature_2m_max?.[0] || avgMax) : avgMax),
      },
      humidity: Math.round(climateData?.monthly_data?.relative_humidity_2m_max?.[monthIndex] || 60),
      rainfall: Math.round(isLive ? (liveData?.daily?.precipitation_sum?.[0] || avgPrecip) : avgPrecip),
      windCondition: (liveData?.daily?.windspeed_10m_max?.[0] || 12) > 15 ? 'Strong' : 'Moderate',
      forecastType: isLive ? "live_16day" : "historical_avg",
    };
  });
}

export async function fetchWeatherWithCache(stateName: string): Promise<WeatherSeasonData[]> {
  if (typeof window === 'undefined') return [];
  const cacheKey = `${CACHE_KEY_PREFIX}${stateName.replace(/\s+/g, '_').toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) return parsed.data;
  }

  const coords = STATE_COORDINATES[stateName] || STATE_COORDINATES['Maharashtra'];
  try {
    const [fRes, cRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Asia%2FKolkata&forecast_days=16`),
      fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${coords.lat}&longitude=${coords.lon}&models=ERA5&start_date=1990-12-01&end_date=2020-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`)
    ]);
    const aggregated = aggregateToSeasons(await fRes.json(), await cRes.json());
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: aggregated }));
    return aggregated;
  } catch (error) {
    throw error;
  }
}