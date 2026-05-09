'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { scoreCrops, type CropScore, type SeasonWeather } from '@/services/cropSuitabilityScorer';
import { Progress } from '@/components/ui/progress';

// Register Chart.js components globally for the client environment
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
}

interface CropScoreChartProps {
  season: string;
  weatherData: SeasonWeather | null;
  isLoading: boolean;
}

const ShimmerSkeleton = () => (
  <div className="space-y-4 w-full">
    {[...Array(7)].map((_, i) => (
      <div 
        key={i} 
        className="h-10 bg-white/5 rounded-xl overflow-hidden relative border border-white/5"
        style={{ width: `${60 + Math.random() * 35}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>
    ))}
  </div>
);

export default function CropScoreChart({ season, weatherData, isLoading }: CropScoreChartProps) {
  const [scores, setScores] = useState<CropScore[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (weatherData) {
      setScores(scoreCrops(weatherData));
    }
  }, [weatherData]);

  if (!mounted || isLoading) {
    return (
      <div className="glass-card-dark p-8 rounded-[32px] border border-white/10 backdrop-blur-xl bg-black/40">
        <ShimmerSkeleton />
      </div>
    );
  }

  if (!weatherData || scores.length === 0) return null;

  const data = {
    labels: scores.map(s => `${s.cropName}`),
    datasets: [
      {
        data: scores.map(s => s.score),
        backgroundColor: scores.map(s => {
          if (s.score >= 80) return '#a3e635'; // Neon Green
          if (s.score >= 60) return '#bef264'; // Light Neon
          if (s.score >= 40) return '#facc15'; // Amber/Yellow
          if (s.score >= 20) return '#fb923c'; // Orange
          return '#f87171'; // Red
        }),
        borderRadius: 6,
        barThickness: 28,
        hoverBackgroundColor: '#ffffff',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const crop = scores[context.dataIndex];
            return `Overall: ${crop.score}% | Temperature: ${crop.breakdown.tempFit}%`;
          }
        }
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10, family: 'monospace' } }
      },
      y: {
        grid: { display: false },
        ticks: { 
          color: '#ffffff', 
          font: { size: 13, weight: '600' as const, family: 'Poppins' },
          padding: 15
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutExpo' as const,
    }
  };

  return (
    <div className="glass-card-premium p-10 rounded-[40px] border border-white/10 backdrop-blur-3xl bg-black/40 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
      
      <div className="h-[450px] mb-12">
        <Bar data={data} options={options} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/10">
        {scores.slice(0, 3).map((s, i) => (
          <div key={i} className="premium-breakdown-card p-6 rounded-[28px] border border-white/5 transition-all hover:scale-[1.02] hover:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <h5 className="text-base font-bold text-white tracking-tight">{s.cropName}</h5>
                </div>
                <span className="text-[10px] font-black font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    ICAR: {s.breakdown.icarWeight}
                </span>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                  <span>Temperature Fit</span>
                  <span className="text-white/80">{s.breakdown.tempFit}%</span>
                </div>
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out" style={{ width: `${s.breakdown.tempFit}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                  <span>Rainfall Fit</span>
                  <span className="text-white/80">{s.breakdown.rainFit}%</span>
                </div>
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000 ease-out" style={{ width: `${s.breakdown.rainFit}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-white/40">
                  <span>Humidity Fit</span>
                  <span className="text-white/80">{s.breakdown.humidityFit}%</span>
                </div>
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] transition-all duration-1000 ease-out" style={{ width: `${s.breakdown.humidityFit}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2">
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
            Proprietary ICAR-Logic × Open-Meteo Neural Engine
          </p>
          <div className="h-1 w-1 rounded-full bg-white/20" />
      </div>

      <style jsx>{`
        .glass-card-premium {
          box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .premium-breakdown-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
