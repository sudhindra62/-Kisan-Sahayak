'use client';

import React, { useMemo } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Info, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { estimateProfit, type ProfitEstimation } from '@/services/profitEstimatorService';

interface ProfitEstimatorProps {
  crop: string;
  landArea: number;
  weatherData: any; // SeasonWeather from weatherService
  isLoading: boolean;
}

export default function ProfitEstimator({ crop, landArea, weatherData, isLoading }: ProfitEstimatorProps) {
  const estimation = useMemo(() => {
    if (!weatherData || !crop) return null;
    
    return estimateProfit(crop, landArea, {
      avgRainfall: weatherData.rainfall / 30, // daily avg from seasonal total
      avgHumidity: weatherData.humidity,
      avgTemp: (weatherData.temperature.min + weatherData.temperature.max) / 2
    });
  }, [crop, landArea, weatherData]);

  if (isLoading) {
    return (
      <div className="glass-card-dark p-8 rounded-[24px] border border-white/10 backdrop-blur-xl bg-black/40 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  if (!estimation) {
    return (
      <div className="p-12 border-2 border-dashed border-white/10 rounded-[24px] bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-amber-400/50 mb-4" />
        <p className="text-white/40 font-medium">MSP data not available for "{crop}" yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card-dark p-8 rounded-[24px] border border-white/10 backdrop-blur-xl bg-black/40 text-white font-body">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-headline font-bold flex items-center gap-4 mb-2">
            <Calculator className="h-8 w-8 text-amber-400" />
            Expected Profit Estimator
          </h2>
          <p className="text-white/40 text-sm">Forecast income using MSP + predicted yield + weather</p>
        </div>
        <span className="px-4 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
          Feature 6
        </span>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="stat-pill border-white/10">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <IndianRupee className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">MSP/qtl ({estimation.cropName})</span>
          </div>
          <div className="text-2xl font-bold">₹{estimation.msp.toLocaleString('en-IN')}</div>
        </div>

        <div className="stat-pill border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3 text-amber-400/60 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. yield/acre</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{estimation.predictedYield} qtl</div>
        </div>

        <div className="stat-pill border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3 text-green-400/60 mb-2">
            <IndianRupee className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross/acre</span>
          </div>
          <div className="text-2xl font-bold text-green-400">₹{estimation.grossPerAcre.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* BREAKDOWN TABLE */}
      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 bg-white/5 border-b border-white/5">
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Yield Adjusted for Forecasted Weather</h4>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Base ICAR yield (avg year)</span>
            <span className="font-mono">{estimation.baseYield} qtl/acre</span>
          </div>

          {estimation.adjustments.map((adj, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-white/60">{adj.label}</span>
              <span className={`font-mono font-bold ${adj.type === 'penalty' ? 'text-red-400' : 'text-green-400'}`}>
                {adj.value > 0 ? '+' : ''}{adj.value} qtl
              </span>
            </div>
          ))}

          {estimation.adjustments.length === 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">No major weather deviations detected</span>
              <span className="text-green-400 font-bold">+0 qtl</span>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="font-bold text-white">Predicted yield</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{estimation.predictedYield} qtl/acre</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[10px] text-white/20 italic">
          MSP from official CACP data · Yield from ICAR adjusted by weather deviation
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
           <Info className="h-3.5 w-3.5" /> 
           Total {landArea} Acre Forecast: ₹{estimation.totalGross.toLocaleString('en-IN')}
        </div>
      </div>

      <style jsx>{`
        .stat-pill {
          padding: 20px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
