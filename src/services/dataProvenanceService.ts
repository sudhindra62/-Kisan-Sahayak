import { STATE_COORDINATES } from '@/lib/location-data';

export interface WeatherVariable {
  key: string;
  displayName: string;
  unit: string;
  emoji: string;
  modelSource: string;
  updateFrequency: string;
  forecastHorizon: string;
  dataType: 'realtime' | 'historical';
  lastUpdatedISO: string;
  valueForActiveSeason: string;
  valueRaw: number | null;
  anomalyVsHistorical: string;
  anomalyDirection: 'above' | 'below' | 'normal';
}

export interface GPSCoordinateInfo {
  stateName: string;
  cityUsed: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  coordinateSource: string;
  accuracyNote: string;
}

export interface ModelMetadata {
  modelName: string;
  operator: string;
  operatorCountry: string;
  updateCycle: string;
  forecastResolutionKm: number;
  trustTier: 'World-class' | 'National' | 'Regional';
  usedFor: string[];
  officialUrl: string;
}

export interface ProvenanceBundle {
  variables: WeatherVariable[];
  coordinates: GPSCoordinateInfo;
  models: ModelMetadata[];
  rawOpenMeteoResponse: object;
  fetchTimestamp: string;
  cacheAgeMinutes: number;
  apiEndpointUsed: string;
  nextRefreshISO: string;
}

const WEATHER_MODELS: ModelMetadata[] = [
  { modelName: "IFS", operator: "ECMWF", operatorCountry: "EU/UK", updateCycle: "6h", forecastResolutionKm: 9, trustTier: "World-class", usedFor: ["temp", "wind"], officialUrl: "https://ecmwf.int" },
  { modelName: "GFS", operator: "NOAA", operatorCountry: "USA", updateCycle: "6h", forecastResolutionKm: 13, trustTier: "World-class", usedFor: ["rain"], officialUrl: "https://noaa.gov" },
  { modelName: "IMD-Blend", operator: "IMD", operatorCountry: "India", updateCycle: "6h", forecastResolutionKm: 12, trustTier: "National", usedFor: ["hum"], officialUrl: "https://mausam.imd.gov.in" },
  { modelName: "ERA5", operator: "ECMWF", operatorCountry: "EU", updateCycle: "Static", forecastResolutionKm: 31, trustTier: "World-class", usedFor: ["hist"], officialUrl: "https://copernicus.eu" }
];

const VARIABLE_METADATA: Record<string, any> = {
  "temperature_2m_max": { displayName: "Max Temperature", unit: "°C", emoji: "🌡️", modelSource: "ECMWF IFS", dataType: "realtime" },
  "temperature_2m_min": { displayName: "Min Temperature", unit: "°C", emoji: "❄️", modelSource: "ECMWF IFS", dataType: "realtime" },
  "precipitation_sum": { displayName: "Total Rainfall", unit: "mm", emoji: "🌧️", modelSource: "NOAA GFS", dataType: "realtime" },
  "relative_humidity_2m_max": { displayName: "Max Humidity", unit: "%", emoji: "💧", modelSource: "IMD Blend", dataType: "realtime" },
  "historical_temperature_avg": { displayName: "Hist Temp Avg", unit: "°C", emoji: "📊", modelSource: "ERA5", dataType: "historical" },
  "historical_precipitation_avg": { displayName: "Hist Rain Avg", unit: "mm", emoji: "📊", modelSource: "ERA5", dataType: "historical" }
};

function computeAnomaly(f: number, h: number) {
  if (!h) return { text: "N/A", direction: "normal" as const };
  const d = ((f - h) / h) * 100;
  if (Math.abs(d) < 5) return { text: "Normal", direction: "normal" as const };
  return { text: `${d > 0 ? '+' : ''}${Math.round(d)}% vs avg`, direction: d > 0 ? "above" as const : "below" as const };
}

export function buildProvenanceBundle(res: any, hist: any, state: string, ts: string): ProvenanceBundle {
  const c = STATE_COORDINATES[state] || { lat: 0, lon: 0, city: "Unknown" };
  const vars: WeatherVariable[] = Object.keys(VARIABLE_METADATA).map(k => {
    const m = VARIABLE_METADATA[k];
    let vRaw = m.dataType === 'realtime' ? res?.daily?.[k]?.[0] : hist?.monthly_data?.[k.includes('temp') ? 'temperature_2m_max' : 'precipitation_sum']?.[new Date().getMonth()];
    const anom = m.dataType === 'realtime' ? computeAnomaly(vRaw, hist?.monthly_data?.[k.includes('temp') ? 'temperature_2m_max' : 'precipitation_sum']?.[new Date().getMonth()]) : { text: "-", direction: "normal" as const };
    return { key: k, ...m, lastUpdatedISO: ts, valueForActiveSeason: `${vRaw}${m.unit}`, valueRaw: vRaw, anomalyVsHistorical: anom.text, anomalyDirection: anom.direction, updateFrequency: "6h", forecastHorizon: "16d" };
  });

  return {
    variables: vars, coordinates: { stateName: state, cityUsed: c.city, latitude: res?.latitude || c.lat, longitude: res?.longitude || c.lon, elevationM: res?.elevation || 0, coordinateSource: "KS Lookup", accuracyNote: "District accuracy" },
    models: WEATHER_MODELS, rawOpenMeteoResponse: res, fetchTimestamp: ts, cacheAgeMinutes: 0, apiEndpointUsed: "https://api.open-meteo.com", nextRefreshISO: ts
  };
}

export function formatCacheAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? "Just now" : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`;
}

export function sanitizeEndpointUrl(u: string) { return u.split('?')[0] + "?lat=...&lon=..."; }
