'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplets, 
  CloudRain, 
  Waves, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  TrendingDown,
  CircleDollarSign,
  Satellite
} from 'lucide-react';
import { computeWaterStress, type WaterStressResult } from '@/services/waterStressService';

interface WaterStressIndicatorProps {
  forecastRainfallMm: number;
  landAreaAcres: number;
  selectedCrops: string[];
  isLoading: boolean;
  season: string;
}

const ShimmerRow = () => (
  <div className="flex items-center gap-4 py-4 animate-pulse">
    <div className="w-[120px] h-6 bg-white/5 rounded-full" />
    <div className="flex-1 h-3.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-white/10 w-2/3 animate-shimmer" />
    </div>
    <div className="w-[90px] h-6 bg-white/5 rounded-full" />
  </div>
);

export default function WaterStressIndicator({ 
  forecastRainfallMm, 
  landAreaAcres, 
  selectedCrops, 
  isLoading,
  season 
} : WaterStressIndicatorProps) {
  const [irrigationInput, setIrrigationInput] = useState(0);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const results = useMemo(() => {
    // Deduplicate input crops to prevent duplicate key errors and redundant UI entries
    const inputCrops = selectedCrops && selectedCrops.length > 0 ? selectedCrops : ['Maize', 'Paddy', 'Soybean', 'Cotton'];
    const uniqueCrops = Array.from(new Set(inputCrops));
    
    return uniqueCrops.map(crop => 
      computeWaterStress(forecastRainfallMm, irrigationInput, crop, landAreaAcres)
    );
  }, [forecastRainfallMm, irrigationInput, selectedCrops, landAreaAcres]);

  const sufficientCount = results.filter(r => r.status === 'sufficient' || r.status === 'waterlogged').length;
  const majorRisk = results.some(r => r.status === 'major_deficit');

  if (!isMounted) return null;

  return (
    <div className="water-stress-card p-8 rounded-[24px] border border-white/10 backdrop-blur-xl bg-black/40 text-white">
      <header className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-4">
            <Droplets className="h-8 w-8 text-blue-400" />
            Water Stress Indicator
          </h2>
          <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Satellite className="h-3 w-3" /> Open-Meteo · FAO-56
          </div>
        </div>
        <p className="text-white/40 text-sm">Rainfall forecast vs FAO-56 seasonal crop water requirements</p>
      </header>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="stat-pill">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <CloudRain className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Forecast Rain</span>
          </div>
          <div className="text-2xl font-bold">{forecastRainfallMm} mm</div>
        </div>
        <div className="stat-pill border-green-500/20">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <Waves className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Your Irrigation</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{irrigationInput} mm</div>
        </div>
        <div className="stat-pill bg-white/5">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Supply</span>
          </div>
          <div className="text-2xl font-bold">{forecastRainfallMm + irrigationInput} mm</div>
        </div>
      </div>

      {/* IRRIGATION SLIDER */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-12">
        <div className="flex items-center justify-between mb-6">
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">
            Set available irrigation (mm/season)
          </label>
          <span className="px-3 py-1 bg-amber-400 text-black text-xs font-bold rounded-lg">{irrigationInput}mm</span>
        </div>
        <input 
          type="range"
          min="0"
          max="400"
          step="10"
          value={irrigationInput}
          onChange={(e) => setIrrigationInput(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <p className="mt-4 text-[10px] text-white/20 italic">
          <Info className="inline h-3 w-3 mr-1" />
          Adjust based on your local borewell, well, or canal system availability for {season}.
        </p>
      </div>

      {/* CROP BARS */}
      <div className="space-y-8 mb-10">
        {isLoading ? (
          [...Array(4)].map((_, i) => <ShimmerRow key={i} />)
        ) : (
          results.map((crop, idx) => {
            const rainWidth = Math.min((crop.forecastSupplyMm / crop.waterNeedMm) * 100, 100);
            const irrigationWidth = Math.min((irrigationInput / crop.waterNeedMm) * 100, 110 - rainWidth);
            const isExpanded = expandedCrop === crop.cropName;

            return (
              <div key={`${crop.cropName}-${idx}`} className="group">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-[120px] shrink-0 text-sm font-bold text-white/90">
                    {crop.emoji} {crop.cropName}
                  </div>
                  
                  <div className="flex-1 relative h-3.5 bg-white/10 rounded-full overflow-visible">
                    {/* RAIN FILL */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-400 rounded-l-full transition-all duration-1000 ease-out"
                      style={{ width: `${rainWidth}%` }}
                    />
                    {/* IRRIGATION FILL */}
                    <div 
                      className="absolute top-0 h-full bg-green-500 transition-all duration-1000 ease-out"
                      style={{ width: `${irrigationWidth}%`, left: `${rainWidth}%` }}
                    />
                    {/* NEED LINE */}
                    <div className="absolute top-[-20px] left-[100%] h-[40px] w-px border-l-2 border-dashed border-white/20">
                      <span className="absolute top-[-15px] left-[-15px] text-[8px] font-bold text-white/30 uppercase">Need</span>
                    </div>
                    {/* OVERFLOW GLOW */}
                    {crop.supplyPct > 110 && (
                       <div className="absolute right-0 top-0 h-full w-4 bg-blue-500/40 blur-sm rounded-r-full" />
                    )}
                  </div>

                  <div 
                    className="w-[110px] py-1 rounded-full text-center text-[10px] font-bold uppercase transition-colors"
                    style={{ background: `${crop.statusColor}20`, color: crop.statusColor }}
                  >
                    {crop.status === 'sufficient' ? '✓ Sufficient' : 
                     crop.status === 'slight_deficit' ? '⚠ Slight Gap' :
                     crop.status === 'major_deficit' ? '✗ Major Risk' : '〰 Waterlog'}
                  </div>
                </div>

                <div className="flex justify-between pl-[136px] pr-[110px] mb-2">
                  <span className="text-[10px] text-white/30 font-medium">Need: {crop.waterNeedMm}mm</span>
                  <span className="text-[10px] font-bold" style={{ color: crop.statusColor }}>{crop.supplyPct}% Supplied</span>
                </div>

                <div className="pl-[136px]">
                  <button 
                    onClick={() => setExpandedCrop(isExpanded ? null : crop.cropName)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? 'Hide Details' : 'Show Analysis'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                          <Droplets className="h-3.5 w-3.5 text-blue-300" />
                          <span className="text-white/60">Irrigation needed:</span>
                          <span className="font-bold text-blue-300">{crop.deficitMm}mm</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <CircleDollarSign className="h-3.5 w-3.5 text-amber-300" />
                          <span className="text-white/60">Estimated cost:</span>
                          <span className="font-bold text-amber-300">₹{crop.irrigationCostEstimate} for {landAreaAcres} acres</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          <span className="text-white/60">Yield risk:</span>
                          <span className="font-bold text-red-400">{crop.estimatedYieldImpactPct}% reduction</span>
                        </div>
                        <p className="text-[10px] text-white/50 italic leading-relaxed">
                          "{crop.advice}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SUMMARY BOX */}
      <div className="pt-8 border-t border-white/10 flex items-center justify-center text-center">
        {majorRisk ? (
          <div className="flex items-center gap-3 text-amber-400 text-sm font-medium">
            <AlertTriangle className="h-5 w-5" />
            Consider switching to crops with lower water needs or ensuring backup irrigation.
          </div>
        ) : sufficientCount === results.length ? (
          <div className="flex items-center gap-3 text-green-400 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5" />
            Good year — all recommended crops are water-secure for this season.
          </div>
        ) : (
          <div className="text-white/40 text-sm font-medium">
            {sufficientCount} of {results.length} crops have sufficient water coverage.
          </div>
        )}
      </div>

      <style jsx>{`
        .water-stress-card {
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .stat-pill {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }
      `}</style>
    </div>
  );
}
