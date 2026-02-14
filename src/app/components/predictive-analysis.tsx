'use client';

import { TrendingUp, CalendarCheck, BarChart3, Lightbulb } from 'lucide-react';
import type { PredictiveAnalysisOutput } from '@/ai/flows/predictive-scheme-analyzer';

type PredictiveAnalysisProps = {
  predictions: PredictiveAnalysisOutput | null;
  isLoading: boolean;
};

const LoadingSkeleton = () => (
  <div
    className="result-card animate-pulse mt-16"
    style={{
      border: '1px solid rgba(130, 180, 220, 0.4)',
      background:
        'linear-gradient(135deg, rgba(10, 60, 80, 0.7), rgba(20, 70, 90, 0.5))',
    }}
  >
    <div className="h-8 w-1/2 rounded-md bg-white/10 mb-8 mx-auto"></div>
    <div className="space-y-10">
        {[...Array(2)].map((_, i) => (
            <div key={i}>
                <div className="h-6 w-3/4 rounded-md bg-white/10 mb-4"></div>
                <div className="h-5 w-full rounded-md bg-white/10 mb-2"></div>
                <div className="h-5 w-5/6 rounded-md bg-white/10 mb-6"></div>
                <div className="h-5 w-full rounded-md bg-white/10 mb-2"></div>
                <div className="h-5 w-4/6 rounded-md bg-white/10"></div>
            </div>
        ))}
    </div>
  </div>
);

const getProbabilityClass = (probability: 'High' | 'Medium' | 'Low') => {
    switch (probability) {
        case 'High':
            return 'bg-green-400/20 text-green-300 border-green-400/50';
        case 'Medium':
            return 'bg-amber-400/20 text-amber-300 border-amber-400/50';
        case 'Low':
            return 'bg-slate-400/20 text-slate-300 border-slate-400/50';
        default:
            return 'bg-slate-400/20 text-slate-300 border-slate-400/50';
    }
}


export default function PredictiveAnalysis({
  predictions,
  isLoading,
}: PredictiveAnalysisProps) {
  if (isLoading) {
    return (
      <section className="results-container w-full">
        <h2 className="results-title">Forecasting Future Opportunities...</h2>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!predictions || predictions.predictions.length === 0) {
    return null;
  }

  return (
    <section className="results-container w-full mt-16">
      <h2 className="results-title flex items-center justify-center">
        <TrendingUp className="mr-4 h-9 w-9 text-amber-300" />
        Future Outlook & Predictions
      </h2>
      <div
        className="result-card"
        style={{
          border: '1px solid rgba(130, 180, 220, 0.4)',
          background:
            'linear-gradient(135deg, rgba(10, 70, 90, 0.8), rgba(20, 80, 100, 0.6))',
        }}
      >
        {predictions.predictions.map((prediction, index) => (
          <div
            key={index}
            className={`result-section ${
              index < predictions.predictions.length - 1 ? 'border-b border-white/10 pb-8 mb-8' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
                <h4 className="flex items-center text-xl text-cyan-300">
                    <CalendarCheck className="mr-3 h-6 w-6" />
                    {prediction.predicted_scheme_category}
                </h4>
                <span className={`score-badge ${getProbabilityClass(prediction.probability_of_relevance)}`}>
                    {prediction.probability_of_relevance} Probability
                </span>
            </div>
            
            <div className="pl-9 space-y-6">
                <div>
                    <h5 className="guide-title !mb-2 !text-base !text-white/90"><BarChart3 className="mr-3 h-5 w-5" />Reasoning</h5>
                    <p className="guide-text !text-sm">{prediction.reasoning}</p>
                </div>
                 <div>
                    <h5 className="guide-title !mb-2 !text-base !text-white/90"><Lightbulb className="mr-3 h-5 w-5" />Preparation Advice</h5>
                    <p className="guide-text !text-sm">{prediction.preparation_advice}</p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
