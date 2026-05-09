'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { MapPin, Sprout, Loader2, Sparkles, Satellite, Cpu, Database, ThermometerSun } from 'lucide-react';
import { fetchWeatherWithCache } from '@/services/weatherService';
import { predictCrops } from '@/ai/cropPredictionFlow';
import WaterStressIndicator from '@/components/WaterStressIndicator';
import CropComparator from '@/components/CropComparator';
import LiveDataProofPanel from '@/components/LiveDataProofPanel';
import { buildProvenanceBundle, type ProvenanceBundle } from '@/services/dataProvenanceService';
import { STATE_COORDINATES } from '@/lib/location-data';

const CropScoreChart = dynamic(() => import('@/components/CropScoreChart'), { ssr: false, loading: () => <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-[44px]" /> });

const LoadingSkeletonCard = ({ label, icon: Icon }: { label: string, icon: any }) => (
  <div className="p-10 rounded-[44px] border border-white/5 bg-white/[0.02] flex flex-col h-full min-h-[440px] relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
            <Icon className="h-10 w-10 text-emerald-500/40" />
            <div className="absolute inset-0 h-10 w-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 max-w-[150px] leading-relaxed">
            {label}
        </h4>
    </div>
    <div className="mt-auto flex flex-wrap gap-2.5">
        <div className="h-8 w-24 bg-white/5 rounded-full" />
        <div className="h-8 w-20 bg-white/5 rounded-full" />
    </div>
    <style jsx>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite linear;
      }
    `}</style>
  </div>
);

export default function CropAdvisorPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [advisorData, setAdvisorData] = useState<any>(null);
  const [provenanceBundle, setProvenanceBundle] = useState<ProvenanceBundle | null>(null);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [stateInput, setStateInput] = useState("Maharashtra");
  const [cropInput, setCropInput] = useState("Wheat");

  useEffect(() => { setMounted(true); }, []);

  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'farmer_profile', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  useEffect(() => { if (profile) { setStateInput(profile.location?.state || "Maharashtra"); setCropInput(profile.cropType || "Wheat"); } }, [profile]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const weatherData = await fetchWeatherWithCache(stateInput);
      const coords = STATE_COORDINATES[stateInput] || STATE_COORDINATES['Maharashtra'];
      const [fRes, hRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&timezone=Asia%2FKolkata&forecast_days=16`),
        fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${coords.lat}&longitude=${coords.lon}&models=ERA5&start_date=1990-01-01&end_date=2020-12-31&daily=temperature_2m_max,precipitation_sum`)
      ]);
      setProvenanceBundle(buildProvenanceBundle(await fRes.json(), await hRes.json(), stateInput, new Date().toISOString()));
      const result = await predictCrops({ state: stateInput, primaryCrop: cropInput, weatherData });
      setAdvisorData(result);
      const m = new Date().getMonth();
      setActiveSeasonIndex(m < 3 ? 0 : m < 6 ? 1 : m < 9 ? 2 : 3);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (!mounted) return null;
  return (
    <div className="min-h-screen bg-[#061a14] p-6 md:p-12 relative overflow-hidden font-body">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">🌦️ AI Crop Advisor</h1>
          <p className="text-white/70 text-xl font-medium tracking-tight">Predict seasons. Grow smarter.</p>
        </header>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
          <div className="flex gap-4 p-2.5 rounded-2xl border border-white/10 px-8 backdrop-blur-3xl bg-white/5 shadow-2xl">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <input value={stateInput} onChange={e => setStateInput(e.target.value)} className="bg-transparent text-white w-32 outline-none font-semibold text-sm" />
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-amber-500" />
                <input value={cropInput} onChange={e => setCropInput(e.target.value)} className="bg-transparent text-white w-32 outline-none font-semibold text-sm" />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="premium-btn !w-auto !py-4 !px-16 flex items-center gap-3 active:scale-95">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />} Generate Forecast
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            <>
              <LoadingSkeletonCard label="Querying ECMWF Satellites" icon={Satellite} />
              <LoadingSkeletonCard label="Modeling Soil Moisture" icon={Database} />
              <LoadingSkeletonCard label="Simulating Yield Curves" icon={Cpu} />
              <LoadingSkeletonCard label="Analyzing Thermal Stress" icon={ThermometerSun} />
            </>
          ) : (advisorData?.predictions || []).map((p: any, i: number) => (
            <div 
              key={i} 
              onClick={() => setActiveSeasonIndex(i)} 
              className={`p-10 rounded-[44px] cursor-pointer transition-all border duration-500 flex flex-col h-full min-h-[440px] relative overflow-hidden group ${activeSeasonIndex === i ? 'border-emerald-500 bg-white/5 ring-4 ring-emerald-500/10 scale-[1.02]' : 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-100'}`}
            >
              {activeSeasonIndex === i && (
                  <div className="absolute top-0 right-0 p-6">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  </div>
              )}
              
              <h3 className="text-3xl font-bold text-white mb-2 leading-tight pr-8">{p.seasonName}</h3>
              <p className="text-sm font-semibold text-white/40 mb-10">{p.months}</p>
              
              <div className="flex flex-wrap gap-2.5 mt-auto">
                {p.recommendedCrops.map((c: any) => (
                  <span key={c.name} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-white/90 shadow-sm transition-transform hover:scale-105">
                    {c.name} {c.emoji}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {advisorData && (
          <div className="mt-32 space-y-32">
            <CropScoreChart season={advisorData.predictions[activeSeasonIndex]?.seasonName} weatherData={advisorData.weatherData[activeSeasonIndex]} isLoading={loading} />
            <WaterStressIndicator forecastRainfallMm={advisorData.weatherData[activeSeasonIndex]?.rainfall} landAreaAcres={Number(profile?.landSize) || 2} selectedCrops={(advisorData.predictions[activeSeasonIndex]?.recommendedCrops || []).map((c: any) => c.name)} isLoading={loading} season={advisorData.predictions[activeSeasonIndex]?.seasonName} />
            <CropComparator cropNames={(advisorData.predictions[activeSeasonIndex]?.recommendedCrops || []).slice(0, 3).map((c: any) => c.name)} weatherData={advisorData.weatherData[activeSeasonIndex]} stateName={stateInput} season={advisorData.predictions[activeSeasonIndex]?.seasonName} isLoading={loading} />
            <LiveDataProofPanel provenanceBundle={provenanceBundle} isLoading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
