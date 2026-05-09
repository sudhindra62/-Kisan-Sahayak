/**
 * @fileOverview Consolidated Official Agricultural Datasets.
 */

export const MSP_2024_25: Record<string, number> = {
  "Paddy": 2300,
  "Wheat": 2275,
  "Maize": 2090,
  "Jowar (Hybrid)": 3371,
  "Bajra": 2625,
  "Ragi": 4290,
  "Tur (Arhar)": 7550,
  "Moong": 8682,
  "Urad": 7400,
  "Groundnut": 6783,
  "Sunflower": 7280,
  "Soybean": 4892,
  "Sugarcane": 340,
  "Cotton": 7121,
  "Mustard": 5950,
  "Gram": 5440,
};

export const ICAR_BASE_YIELD: Record<string, number> = {
  "Paddy": 32,
  "Wheat": 18,
  "Maize": 14,
  "Soybean": 10,
  "Cotton": 8,
  "Mustard": 7,
  "Groundnut": 10,
  "Gram": 4,
  "Sugarcane": 350,
  "Sunflower": 7,
};

export const ICAR_CROP_PROFILES = [
  { name: 'Paddy', emoji: '🌾', tempRange: { min: 22, max: 35 }, rainRange: { min: 150, max: 300 }, humidityRange: { min: 70, max: 90 }, icarWeight: 1.0 },
  { name: 'Wheat', emoji: '🌾', tempRange: { min: 10, max: 25 }, rainRange: { min: 30, max: 100 }, humidityRange: { min: 40, max: 65 }, icarWeight: 1.0 },
  { name: 'Maize', emoji: '🌽', tempRange: { min: 18, max: 32 }, rainRange: { min: 60, max: 110 }, humidityRange: { min: 50, max: 80 }, icarWeight: 0.9 },
  { name: 'Soybean', emoji: '🫛', tempRange: { min: 20, max: 32 }, rainRange: { min: 80, max: 150 }, humidityRange: { min: 60, max: 85 }, icarWeight: 0.95 },
  { name: 'Cotton', emoji: '☁️', tempRange: { min: 25, max: 40 }, rainRange: { min: 50, max: 100 }, humidityRange: { min: 40, max: 70 }, icarWeight: 0.9 },
  { name: 'Mustard', emoji: '🌼', tempRange: { min: 8, max: 25 }, rainRange: { min: 25, max: 60 }, humidityRange: { min: 30, max: 55 }, icarWeight: 0.85 },
  { name: 'Groundnut', emoji: '🥜', tempRange: { min: 25, max: 35 }, rainRange: { min: 50, max: 125 }, humidityRange: { min: 50, max: 75 }, icarWeight: 0.85 },
  { name: 'Gram', emoji: '🍛', tempRange: { min: 10, max: 25 }, rainRange: { min: 20, max: 60 }, humidityRange: { min: 30, max: 55 }, icarWeight: 0.8 },
  { name: 'Sugarcane', emoji: '🎋', tempRange: { min: 24, max: 38 }, rainRange: { min: 150, max: 250 }, humidityRange: { min: 65, max: 90 }, icarWeight: 0.85 },
  { name: 'Sunflower', emoji: '🌻', tempRange: { min: 20, max: 32 }, rainRange: { min: 40, max: 90 }, humidityRange: { min: 45, max: 70 }, icarWeight: 0.8 },
];

export const SOIL_SCORE_BY_STATE: Record<string, Record<string, number>> = {
  'Bihar': { 'Paddy': 95, 'Wheat': 88, 'Maize': 80, 'Soybean': 72, 'Cotton': 45, 'Mustard': 85, 'Groundnut': 60, 'Gram': 78, 'Sugarcane': 88, 'Sunflower': 70 },
  'Uttar Pradesh': { 'Paddy': 95, 'Wheat': 88, 'Maize': 80, 'Soybean': 72, 'Cotton': 45, 'Mustard': 85, 'Groundnut': 60, 'Gram': 78, 'Sugarcane': 88, 'Sunflower': 70 },
  'Maharashtra': { 'Paddy': 55, 'Wheat': 65, 'Maize': 72, 'Soybean': 88, 'Cotton': 95, 'Mustard': 60, 'Groundnut': 70, 'Gram': 75, 'Sugarcane': 80, 'Sunflower': 75 },
  'Rajasthan': { 'Paddy': 35, 'Wheat': 72, 'Maize': 65, 'Soybean': 60, 'Cotton': 80, 'Mustard': 90, 'Groundnut': 85, 'Gram': 88, 'Sugarcane': 45, 'Sunflower': 78 },
  'Karnataka': { 'Paddy': 70, 'Wheat': 55, 'Maize': 82, 'Soybean': 75, 'Cotton': 80, 'Mustard': 55, 'Groundnut': 92, 'Gram': 65, 'Sugarcane': 85, 'Sunflower': 88 },
};

export const RISK_PROFILES: Record<string, number> = {
  'Paddy': 32, 'Wheat': 23, 'Maize': 32, 'Soybean': 35, 'Cotton': 47,
  'Mustard': 22, 'Groundnut': 32, 'Gram': 27, 'Sugarcane': 25, 'Sunflower': 30
};

export const FAO_CROP_PROFILES: Record<string, any> = {
  'Paddy': { cropName: 'Paddy', emoji: '🌾', seasonalWaterNeedMm: 450, irrigationCostPerMm: 12, deficitTolerancePct: 10 },
  'Soybean': { cropName: 'Soybean', emoji: '🫘', seasonalWaterNeedMm: 310, irrigationCostPerMm: 9, deficitTolerancePct: 15 },
  'Cotton': { cropName: 'Cotton', emoji: '☁️', seasonalWaterNeedMm: 520, irrigationCostPerMm: 14, deficitTolerancePct: 8 },
  'Wheat': { cropName: 'Wheat', emoji: '🌿', seasonalWaterNeedMm: 350, irrigationCostPerMm: 10, deficitTolerancePct: 12 },
  'Maize': { cropName: 'Maize', emoji: '🌽', seasonalWaterNeedMm: 400, irrigationCostPerMm: 11, deficitTolerancePct: 10 },
  'Mustard': { cropName: 'Mustard', emoji: '🌼', seasonalWaterNeedMm: 280, irrigationCostPerMm: 8, deficitTolerancePct: 18 },
  'Groundnut': { cropName: 'Groundnut', emoji: '🥜', seasonalWaterNeedMm: 360, irrigationCostPerMm: 10, deficitTolerancePct: 12 },
  'Gram': { cropName: 'Gram', emoji: '🫛', seasonalWaterNeedMm: 240, irrigationCostPerMm: 7, deficitTolerancePct: 20 },
  'Sugarcane': { cropName: 'Sugarcane', emoji: '🎋', seasonalWaterNeedMm: 680, irrigationCostPerMm: 16, deficitTolerancePct: 5 },
  'Sunflower': { cropName: 'Sunflower', emoji: '🌻', seasonalWaterNeedMm: 330, irrigationCostPerMm: 9, deficitTolerancePct: 15 },
};
