'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, Globe, Database, Satellite, MapPin, Code, Cpu } from 'lucide-react';
import { ProvenanceBundle, formatCacheAge, sanitizeEndpointUrl } from '@/services/dataProvenanceService';

interface LiveDataProofPanelProps {
  provenanceBundle: ProvenanceBundle | null;
  isLoading: boolean;
}

function syntaxHighlight(json: string): string {
  if (!json) return "";
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|null)/g, function (match) {
    let style = 'color:#a5d6a7'; // string
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        style = 'color:#90caf9'; // key
      }
    } else if (/true|false/.test(match)) {
      style = 'color:#f9a825'; // boolean
    } else if (/null/.test(match)) {
      style = 'color:#ef9a9a'; // null
    } else {
      style = 'color:#ce93d8'; // number
    }
    return '<span style="' + style + '">' + match + '</span>';
  });
}

export default function LiveDataProofPanel({ provenanceBundle, isLoading }: LiveDataProofPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'variables' | 'models' | 'coordinates' | 'raw_json'>('variables');
  const [isJsonCopied, setIsJsonCopied] = useState(false);
  const [jsonViewerExpanded, setJsonViewerExpanded] = useState(false);
  const [cacheAgeLabel, setCacheAgeLabel] = useState('Just now');
  const [highlightedVariable, setHighlightedVariable] = useState<string | null>(null);

  useEffect(() => {
    if (!provenanceBundle) return;
    const interval = setInterval(() => {
      setCacheAgeLabel(formatCacheAge(provenanceBundle.fetchTimestamp));
    }, 60000);
    setCacheAgeLabel(formatCacheAge(provenanceBundle.fetchTimestamp));
    return () => clearInterval(interval);
  }, [provenanceBundle]);

  const handleCopyJson = () => {
    if (!provenanceBundle) return;
    const jsonStr = JSON.stringify(provenanceBundle.rawOpenMeteoResponse, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setIsJsonCopied(true);
      setTimeout(() => setIsJsonCopied(false), 2000);
    });
  };

  if (!provenanceBundle && !isLoading) {
    return (
      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-md opacity-60">
        <div className="p-4 flex items-center justify-between cursor-not-allowed">
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-white/20" />
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Generate forecast to unlock live data provenance</span>
            </div>
            <ChevronDown className="h-4 w-4 text-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className={`proof-panel-wrapper border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 ${isPanelOpen ? 'ring-1 ring-amber-400/20 shadow-2xl' : ''}`}>
      {/* TRIGGER BAR */}
      <div 
        onClick={() => !isLoading && setIsPanelOpen(!isPanelOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse-glow" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">Live Data Proof Panel</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Satellite Source & Model Provenance</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-[9px] font-bold text-green-400">
            UPDATED {cacheAgeLabel.toUpperCase()}
          </div>
          <div className={`transition-transform duration-300 ${isPanelOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      <div 
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isPanelOpen ? '2000px' : '0' }}
      >
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="h-6 w-6 border-2 border-green-500/20 border-top-green-500 rounded-full animate-spin" />
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Querying satellites...</p>
          </div>
        ) : provenanceBundle && (
          <div className="p-6 border-t border-white/10 space-y-8">
            {/* TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'variables', label: 'Variables', icon: <Satellite className="h-3.5 w-3.5" /> },
                { id: 'models', label: 'Models', icon: <Cpu className="h-3.5 w-3.5" /> },
                { id: 'coordinates', label: 'GPS Point', icon: <MapPin className="h-3.5 w-3.5" /> },
                { id: 'raw_json', label: 'Raw JSON', icon: <Code className="h-3.5 w-3.5" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'}`}
                >
                  {tab.icon} {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: VARIABLES */}
            {activeTab === 'variables' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Variable</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">vs History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provenanceBundle.variables.map(v => (
                        <tr 
                          key={v.key}
                          onClick={() => setHighlightedVariable(highlightedVariable === v.key ? null : v.key)}
                          className={`group cursor-pointer border-b border-white/5 transition-colors ${highlightedVariable === v.key ? 'bg-amber-400/5' : 'hover:bg-white/5'}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${v.dataType === 'realtime' ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                              <span className={`text-[8px] font-black ${v.dataType === 'realtime' ? 'text-green-400' : 'text-white/40'}`}>
                                {v.dataType === 'realtime' ? 'LIVE' : 'AVG'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{v.emoji}</span>
                              <span className="text-xs font-bold text-white/90">{v.displayName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-white">{v.valueForActiveSeason}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/60">{v.modelSource}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold ${v.anomalyDirection === 'above' ? 'bg-red-500/10 text-red-400' : v.anomalyDirection === 'below' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                              {v.anomalyDirection === 'above' ? '↑' : v.anomalyDirection === 'below' ? '↓' : '→'} {v.anomalyVsHistorical}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                   <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Audit Metadata</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-[10px] text-white/50">API Endpoint: <span className="font-mono text-amber-400/60">{sanitizeEndpointUrl(provenanceBundle.apiEndpointUsed)}</span></div>
                      <div className="text-[10px] text-white/50 text-right">Data Cycle: <span className="text-green-400/60">Every 6 Hours</span></div>
                   </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MODELS */}
            {activeTab === 'models' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                {provenanceBundle.models.map(model => (
                  <div key={model.modelName} className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase tracking-widest">{model.trustTier}</span>
                      <button onClick={() => window.open(model.officialUrl, '_blank')} className="text-blue-400 hover:text-blue-300 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">{model.modelName}</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed">{model.operator}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-[10px]">
                      <div>
                        <p className="text-white/30 uppercase tracking-tighter mb-1">Update Cycle</p>
                        <p className="text-white/70 font-medium">{model.updateCycle}</p>
                      </div>
                      <div>
                        <p className="text-white/30 uppercase tracking-tighter mb-1">Resolution</p>
                        <p className="text-white/70 font-medium">{model.forecastResolutionKm} km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: COORDINATES */}
            {activeTab === 'coordinates' && (
               <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-400" /> GPS Verification
                    </h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Target State', value: provenanceBundle.coordinates.stateName },
                            { label: 'City Proxy', value: provenanceBundle.coordinates.cityUsed },
                            { label: 'Latitude', value: `${provenanceBundle.coordinates.latitude}°N` },
                            { label: 'Longitude', value: `${provenanceBundle.coordinates.longitude}°E` },
                            { label: 'Elevation', value: `${provenanceBundle.coordinates.elevationM}m ASL` }
                        ].map(row => (
                            <div key={row.label} className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-none">
                                <span className="text-white/40">{row.label}</span>
                                <span className="font-mono text-white font-bold">{row.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                        <p className="text-[10px] text-amber-400/80 leading-relaxed">
                            {provenanceBundle.coordinates.accuracyNote}
                        </p>
                    </div>
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${provenanceBundle.coordinates.latitude},${provenanceBundle.coordinates.longitude}`, '_blank')}
                        className="w-full py-3 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] font-bold text-white transition-all uppercase tracking-widest"
                    >
                        Verify in Maps ↗
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                     <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <Globe className="w-full h-full text-white" />
                     </div>
                     <div className="text-center relative z-10">
                        <div className="text-2xl font-mono font-bold text-white mb-2">
                            {provenanceBundle.coordinates.latitude.toFixed(2)}°N
                        </div>
                        <div className="text-2xl font-mono font-bold text-white mb-6">
                            {provenanceBundle.coordinates.longitude.toFixed(2)}°E
                        </div>
                        <div className="animate-pin-bounce">
                            <MapPin className="h-10 w-10 text-amber-400 fill-amber-400/20" />
                        </div>
                        <p className="mt-4 text-xs font-bold text-white/40 uppercase tracking-widest">
                            {provenanceBundle.coordinates.stateName}
                        </p>
                     </div>
                  </div>
               </div>
            )}

            {/* TAB CONTENT: RAW JSON */}
            {activeTab === 'raw_json' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                        <Database className="h-3.5 w-3.5" /> Direct Open-Meteo API Response
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCopyJson}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${isJsonCopied ? 'border-green-500 text-green-400' : 'border-white/20 text-white hover:bg-white/5'}`}
                        >
                            {isJsonCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {isJsonCopied ? 'COPIED!' : 'COPY JSON'}
                        </button>
                        <button 
                            onClick={() => setJsonViewerExpanded(!jsonViewerExpanded)}
                            className="px-3 py-1.5 rounded-lg border border-white/20 text-white text-[10px] font-bold hover:bg-white/5 transition-all"
                        >
                            {jsonViewerExpanded ? 'COLLAPSE' : 'EXPAND ALL'}
                        </button>
                    </div>
                </div>

                <div 
                    className={`relative rounded-xl bg-black/40 border border-white/10 p-5 font-mono text-[11px] leading-relaxed transition-all ${jsonViewerExpanded ? 'h-auto' : 'max-h-[300px] overflow-hidden'}`}
                >
                    <pre 
                        className="overflow-x-auto whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(provenanceBundle.rawOpenMeteoResponse, null, 2)) }} 
                    />
                    {!jsonViewerExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[9px] font-bold text-white/30 uppercase">Audit End:</span>
                    <span className="text-[9px] font-mono text-white/50 truncate flex-1">{provenanceBundle.apiEndpointUsed}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-pin-bounce {
          animation: pin-bounce 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
