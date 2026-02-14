"use client";

import { ExternalLink, Info, Leaf } from "lucide-react";

type Results = {
  eligibleSchemes: {
    name: string;
    benefits: string;
    eligibilitySummary: string;
    applicationGuideLink?: string | undefined;
  }[];
} | null;

type SchemeResultsProps = {
  results: Results;
  isLoading: boolean;
};

const LoadingSkeleton = () => (
  <div className="space-y-5 w-full">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="result-card animate-pulse" style={{ background: 'rgba(255, 255, 255, 0.03)'}}>
        <div className="h-6 w-3/4 rounded-md bg-white/10 mb-6"></div>
        <div className="h-4 w-1/4 rounded-md bg-white/10 mb-2"></div>
        <div className="h-4 w-full rounded-md bg-white/10 mb-1"></div>
        <div className="h-4 w-5/6 rounded-md bg-white/10 mb-4"></div>
        <div className="h-4 w-1/4 rounded-md bg-white/10 mb-2"></div>
        <div className="h-4 w-full rounded-md bg-white/10 mb-1"></div>
        <div className="h-4 w-5/6 rounded-md bg-white/10"></div>
      </div>
    ))}
  </div>
);

export default function SchemeResults({ results, isLoading }: SchemeResultsProps) {
  if (isLoading) {
    return (
      <section className="results-container w-full">
        <h2 className="results-title">Checking Eligibility...</h2>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <section className="results-container w-full">
      {results.eligibleSchemes.length > 0 ? (
        <>
          <h2 className="results-title">Eligible Schemes Found</h2>
          <div className="space-y-5">
            {results.eligibleSchemes.map((scheme, index) => (
              <div className="result-card" key={index}>
                <h3><Leaf className="mr-3 text-current h-6 w-6" /> {scheme.name}</h3>
                
                <div className="result-section">
                  <h4>Benefits</h4>
                  <p>{scheme.benefits}</p>
                </div>

                <div className="result-section">
                  <h4>Why you are eligible</h4>
                  <p>{scheme.eligibilitySummary}</p>
                </div>
                
                {scheme.applicationGuideLink && (
                  <a href={scheme.applicationGuideLink} target="_blank" rel="noopener noreferrer" className="premium-btn">
                    <ExternalLink className="h-4 w-4" />
                    Application Guide
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-results-card">
          <Info className="icon" />
          <h2>No Schemes Found</h2>
          <p>
            Based on the profile provided, we couldn't find any matching government schemes at the moment.
          </p>
        </div>
      )}
    </section>
  );
}
