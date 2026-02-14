"use client";

import { Award, TrendingUp, DollarSign, Sparkles, Target } from "lucide-react";
import type { FarmerSummaryOutput } from "@/ai/flows/farmer-summary-generator";

type SummaryReportProps = {
    summary: FarmerSummaryOutput | null;
    isLoading: boolean;
};

const LoadingSkeleton = () => (
    <div className="result-card animate-pulse mt-16" style={{border: '1px solid rgba(130, 220, 180, 0.4)', background: 'linear-gradient(135deg, rgba(10, 70, 50, 0.7), rgba(20, 90, 70, 0.5))'}}>
        <div className="h-8 w-1/2 rounded-md bg-white/10 mb-8 mx-auto"></div>
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <div className="h-6 w-3/4 rounded-md bg-white/10 mb-4"></div>
                <div className="h-5 w-full rounded-md bg-white/10 mb-2"></div>
                <div className="h-5 w-5/6 rounded-md bg-white/10"></div>
            </div>
             <div>
                <div className="h-6 w-3/4 rounded-md bg-white/10 mb-4"></div>
                <div className="h-5 w-full rounded-md bg-white/10 mb-2"></div>
                <div className="h-5 w-5/6 rounded-md bg-white/10"></div>
            </div>
        </div>
        <div className="h-6 w-1/3 rounded-md bg-white/10 mt-10 mb-4"></div>
        <div className="h-5 w-full rounded-md bg-white/10 mb-2"></div>
        <div className="h-5 w-5/6 rounded-md bg-white/10"></div>
    </div>
);


export default function SummaryReport({ summary, isLoading }: SummaryReportProps) {
    if (isLoading) {
        return (
             <section className="results-container w-full">
                <h2 className="results-title">Generating Your Growth Plan...</h2>
                <LoadingSkeleton />
             </section>
        )
    }

    if (!summary) {
        return null;
    }

    return (
        <section className="results-container w-full mt-16">
            <h2 className="results-title flex items-center justify-center"><Award className="mr-4 h-9 w-9 text-amber-300" /> Your Personalized Growth Plan</h2>
            <div className="result-card" style={{border: '1px solid rgba(130, 220, 180, 0.4)', background: 'linear-gradient(135deg, rgba(10, 80, 60, 0.8), rgba(20, 100, 80, 0.6))'}}>
                
                <div className="result-section text-center mb-12">
                     <h4 className="flex items-center justify-center text-xl mb-4"><Sparkles className="mr-3 h-6 w-6 text-amber-300" /> Motivational Summary</h4>
                     <p className="text-lg text-slate-200 leading-relaxed max-w-3xl mx-auto">{summary.motivational_summary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                    <div className="summary-item">
                        <DollarSign className="summary-icon" />
                        <div>
                            <h5 className="summary-title">Total Estimated Benefits</h5>
                            <p className="summary-text">{summary.total_estimated_benefit}</p>
                            <small className="summary-small">({summary.total_schemes_found} schemes found)</small>
                        </div>
                    </div>
                     <div className="summary-item">
                        <Target className="summary-icon" />
                        <div>
                            <h5 className="summary-title">Immediate Action Steps</h5>
                            <ul className="guide-list !pl-0">
                               {summary.immediate_action_steps.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="result-section">
                     <h4 className="flex items-center text-xl mb-4"><TrendingUp className="mr-3 h-6 w-6 text-amber-300" /> Long-Term Growth Suggestions</h4>
                     <ul className="guide-list">
                        {summary.long_term_growth_suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                     </ul>
                </div>
            </div>
        </section>
    );
}
