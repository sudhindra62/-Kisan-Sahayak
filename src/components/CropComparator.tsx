'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Info, HelpCircle, Star, Award, ShieldAlert, TrendingUp } from 'lucide-react';
import { compareCrops, getComparisonInsight, type CropComparisonResult, type ComparisonDimension, type SeasonWeather } from '@/services/cropComparatorService';

interface CropComparatorProps {
  cropNames: string[];
  weatherData: SeasonWeather | null;
  stateName: string;
  season: string;
  isLoading: boolean;
}

const ShimmerSkeleton = () => (
  <div className="grid grid-cols-3 gap-6 animate-pulse">
    {[0, 1, 2].map(i => (
      <div key={i} className="space-y-6">
        <div className="h-32 bg-white/5 rounded-2xl" />
        {[0, 1, 2, 3, 4].map(j => (
          <div key={j} className="h-8 bg-white/5 rounded-full" />
        ))}
      </div>
    ))}
  </div>
);

export default function CropComparator({ 
  cropNames, 
  weatherData, 
  stateName, 
  season, 
  isLoading 
}: CropComparatorProps) {
  const [results, setResults] = useState<CropComparisonResult[]>([]);
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [selectedCropIndex, setSelectedCropIndex] = useState<number | null>(null);
  const [animTrigger, setAnimTrigger] = useState(false);

  useEffect(() => {
    if (weatherData && cropNames.length >= 1) {
      // Deduplicate and take top 3 to prevent React key collisions and redundant columns
      const uniqueCrops = Array.from(new Set(cropNames)).slice(0, 3);
      const comparisonResults = compareCrops(uniqueCrops, weatherData, stateName);
      setResults(comparisonResults);
      setAnimTrigger(false);
      setTimeout(() => setAnimTrigger(true), 100);
    }
  }, [cropNames, weatherData, stateName]);

  const insight = useMemo(() => getComparisonInsight(results), [results]);

  if (isLoading) return <div className="glass-panel p-8 rounded-2xl"><ShimmerSkeleton /></div>;
  if (!weatherData || results.length === 0) return null;

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 text-white font-body">
      <header className="mb-10">
        <h2 className="text-3xl font-headline font-bold flex items-center gap-4 mb-2">
          <Award className="h-8 w-8 text-amber-400" />
          Crop Head-to-Head Comparator
        </h2>
        <p className="text-white/40 text-sm">5-dimension analysis using live weather + official CACP & ICAR market data</p>
        
        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
          {["📡 Open-Meteo Weather", "📋 CACP MSP 2024-25", "🌱 ICAR Soil Atlas", "⚠️ ICAR Risk Profiles"].map(pill => (
            <span key={pill} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/40 uppercase whitespace-nowrap">
              {pill}
            </span>
          ))}
        </div>
      </header>

      {/* COLUMN HEADERS */}
      <div className={`grid gap-6 mb-12 items-end`} style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
        {results.map((crop, idx) => {
          const isSelected = selectedCropIndex === idx;
          const circum = 2 * Math.PI * 25;
          const offset = circum - (crop.overallScore / 100) * circum;

          return (
            <div 
              key={`${crop.cropName}-${idx}`} 
              onClick={() => setSelectedCropIndex(isSelected ? null : idx)}
              className={`relative p-6 rounded-2xl bg-white/5 border transition-all cursor-pointer ${isSelected ? 'border-amber-400/50 scale-[1.03] bg-amber-400/5' : 'border-white/5'}`}
            >
              <div className={`absolute -top-3 -right-2 px-3 py-1 rounded-lg text-[11px] font-bold shadow-lg ${crop.rank === 1 ? 'bg-[#f9a825] text-black' : crop.rank === 2 ? 'bg-[#b0bec5] text-black' : 'bg-[#a1887f] text-white'}`}>
                {crop.rank === 1 ? '🥇 #1' : crop.rank === 2 ? '🥈 #2' : '🥉 #3'}
              </div>

              <div className="text-center space-y-4">
                <div className="text-4xl">{crop.emoji}</div>
                <h4 className="font-bold text-sm truncate">{crop.cropName}</h4>

                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="25" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                    <circle 
                      cx="32" cy="32" r="25" fill="transparent" stroke="currentColor" strokeWidth="4" 
                      strokeDasharray={circum} 
                      style={{ 
                        strokeDashoffset: animTrigger ? offset : circum, 
                        transition: 'stroke-dashoffset 1.2s ease-out',
                        color: crop.overallScore >= 80 ? '#4caf50' : crop.overallScore >= 60 ? '#8bc34a' : '#ffc107'
                      }} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold">{crop.overallScore}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">Grade {crop.overallGrade}</div>
                  <div className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-center" style={{ backgroundColor: crop.badgeColor }}>
                    {crop.badge}
                  </div>
                  <p className="text-[10px] text-white/50 italic leading-tight h-8 line-clamp-2">"{crop.summaryLine}"</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIMENSION ROWS */}
      <div className="space-y-1 mb-10">
        {results[0].dimensions.map((dim, dIdx) => (
          <div key={dim.key} className="group">
            <div 
              onClick={() => setActiveDimension(activeDimension === dim.key ? null : dim.key)}
              className={`grid grid-cols-[1.5fr_3.5fr] gap-4 items-center p-3 rounded-xl transition-colors cursor-pointer hover:bg-white/5 ${activeDimension === dim.key ? 'bg-white/5' : ''}`}
            >
              <div className="text-xs font-medium text-white/70 flex items-center gap-2">
                <span>{dim.emoji}</span> {dim.label}
              </div>

              <div className={`grid gap-6 items-center`} style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
                {results.map((crop, cIdx) => {
                  const d = crop.dimensions[dIdx];
                  const barColor = d.score >= 80 ? '#4caf50' : d.score >= 60 ? '#8bc34a' : d.score >= 40 ? '#ffc107' : '#ef5350';
                  
                  return (
                    <div key={`${crop.cropName}-${cIdx}`} className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-900" 
                          style={{ 
                            width: animTrigger ? `${d.score}%` : '0%', 
                            backgroundColor: barColor,
                            transitionDelay: `${dIdx * 80}ms`
                          }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold min-w-[20px]" style={{ color: barColor }}>{d.score}</span>
                      <span className="text-[8px] font-black px-1 rounded-[2px]" style={{ background: d.score >= 80 ? '#1b5e20' : '#333', color: d.score >= 80 ? '#a5d6a7' : '#999' }}>
                        {d.grade}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAIL PANEL */}
            {activeDimension === dim.key && (
              <div className={`grid gap-6 p-4 mt-1 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-1`} style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
                {results.map((crop, cIdx) => (
                  <div key={`${crop.cropName}-${cIdx}`} className="space-y-1">
                    <div className="text-[10px] font-bold text-amber-400/80 uppercase">{crop.cropName} Analysis</div>
                    <p className="text-[11px] text-white/70 leading-relaxed">{crop.dimensions[dIdx].explanation}</p>
                    <div className="text-[9px] text-white/30 italic">Source: {crop.dimensions[dIdx].sourceTag}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INSIGHT BOX */}
      <div className="bg-amber-400/10 border-l-4 border-amber-400 p-5 rounded-r-xl mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
          <Star className="h-4 w-4" /> AI Comparator Insight
        </div>
        <p className="text-sm text-white/80 leading-relaxed italic">
          {insight}
        </p>
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {results[0].dimensions.map(dim => (
          <div key={dim.key} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full whitespace-nowrap">
            <span className="text-xs">{dim.emoji}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">{dim.label}:</span>
            <span className="text-[9px] text-white/20 italic">{dim.sourceTag}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .glass-panel {
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
