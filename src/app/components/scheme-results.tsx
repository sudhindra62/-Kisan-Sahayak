"use client";

import { ExternalLink, Info, Leaf, Bot, FileText, BookCheck, Clock, AlertTriangle, Phone, ThumbsUp, ChevronsRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSchemeApplicationGuide } from "@/app/actions";
import type { SchemeApplicationGuideInput, SchemeApplicationGuideOutput } from "@/ai/flows/scheme-application-guide-generator";
import type { FarmerProfileInput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";

type MatchedScheme = {
  name: string;
  benefits: string;
  eligibilityCriteria: string;
  semantic_similarity_score: number;
  relevance_reason: string;
  is_possibly_relevant: boolean;
  applicationGuideLink?: string | undefined;
};

type NearMiss = {
  name: string;
  reason_not_eligible: string;
  improvement_suggestions: string[];
  alternate_scheme_suggestions: string[];
}

type Results = {
  matchedSchemes: MatchedScheme[];
  nearMisses?: NearMiss[];
} | null;

type SchemeResultsProps = {
  results: Results;
  isLoading: boolean;
  farmerProfile: FarmerProfileInput | null;
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


function ApplicationGuideDisplay({ guide }: { guide: SchemeApplicationGuideOutput }) {
    return (
        <div className="guide-container space-y-8 pt-4">
            <div className="guide-section">
                <h5 className="guide-title"><FileText className="mr-3 h-5 w-5" /> Documents Required</h5>
                <ul className="guide-list">
                    {guide.documentsRequired.map((doc, i) => <li key={i}>{doc}</li>)}
                </ul>
            </div>
            <div className="guide-section">
                <h5 className="guide-title"><BookCheck className="mr-3 h-5 w-5" /> Application Steps</h5>
                {guide.applicationSteps.map(step => (
                    <div key={step.step} className="step">
                        <div className="step-header">
                            <span className="step-number">{step.step}</span>
                            <span className="step-title">{step.title}</span>
                            <span className={`step-tag ${step.isOnline ? 'online' : 'offline'}`}>{step.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <p className="step-description">{step.description}</p>
                    </div>
                ))}
            </div>
             <div className="guide-section">
                <h5 className="guide-title"><Clock className="mr-3 h-5 w-5" /> Estimated Timeline</h5>
                <p className="guide-text">{guide.estimatedTimeline}</p>
            </div>
             <div className="guide-section">
                <h5 className="guide-title"><AlertTriangle className="mr-3 h-5 w-5" /> Common Mistakes to Avoid</h5>
                 <ul className="guide-list">
                    {guide.commonMistakes.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
            </div>
            <div className="guide-section">
                <h5 className="guide-title"><Phone className="mr-3 h-5 w-5" /> Contact for Help</h5>
                <p className="guide-text">{guide.contactAuthority}</p>
            </div>
        </div>
    );
}

function NearMissAnalysis({ nearMisses }: { nearMisses: NearMiss[] }) {
    return (
        <div className="mt-16">
            <h2 className="results-title">Opportunities for Improvement</h2>
            <div className="space-y-5">
                {nearMisses.map((miss, index) => (
                    <div className="result-card" key={index} style={{border: '1px solid rgba(245, 197, 66, 0.4)', background: 'linear-gradient(135deg, rgba(70, 50, 10, 0.7), rgba(90, 60, 15, 0.5))'}}>
                        <div className="result-card-header">
                             <h3><AlertTriangle className="mr-3 text-amber-300 h-6 w-6" /> {miss.name}</h3>
                        </div>
                        <div className="result-section">
                          <h4 className="flex items-center"><Info className="mr-2 h-4 w-4" /> Reason for Ineligibility</h4>
                          <p>{miss.reason_not_eligible}</p>
                        </div>

                         <div className="result-section">
                          <h4 className="flex items-center"><ThumbsUp className="mr-2 h-4 w-4" /> Improvement Suggestions</h4>
                            <ul className="guide-list">
                                {miss.improvement_suggestions.map((suggestion: string, i: number) => <li key={i}>{suggestion}</li>)}
                            </ul>
                        </div>

                        {miss.alternate_scheme_suggestions && miss.alternate_scheme_suggestions.length > 0 && (
                            <div className="result-section">
                                <h4 className="flex items-center"><ChevronsRight className="mr-2 h-4 w-4" /> Consider These Alternatives</h4>
                                <ul className="guide-list">
                                    {miss.alternate_scheme_suggestions.map((alt: string, i: number) => <li key={i}>{alt}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SchemeResults({ results, isLoading, farmerProfile }: SchemeResultsProps) {
  const [guideLoading, setGuideLoading] = useState<string | null>(null);
  const [generatedGuides, setGeneratedGuides] = useState<Record<string, SchemeApplicationGuideOutput>>({});
  const { toast } = useToast();

  const handleGenerateGuide = async (scheme: MatchedScheme) => {
      if (!farmerProfile) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Farmer profile is missing. Cannot generate guide.",
          });
          return;
      }

      setGuideLoading(scheme.name);
      try {
          const input: SchemeApplicationGuideInput = {
              farmerProfile,
              scheme: {
                  name: scheme.name,
                  benefits: scheme.benefits,
                  eligibilityCriteria: scheme.eligibilityCriteria,
                  applicationGuideLink: scheme.applicationGuideLink,
              }
          };
          const guide = await getSchemeApplicationGuide(input);
          setGeneratedGuides(prev => ({...prev, [scheme.name]: guide}));
      } catch (error) {
           toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to generate application guide. Please try again.",
          });
      } finally {
          setGuideLoading(null);
      }
  };

  if (isLoading) {
    return (
      <section className="results-container w-full">
        <h2 className="results-title">Analyzing Profile...</h2>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!results) {
    return null;
  }
  
  const hasMatches = results.matchedSchemes.length > 0;
  const hasNearMisses = results.nearMisses && results.nearMisses.length > 0;

  if (!hasMatches && !hasNearMisses) {
    return (
        <section className="results-container w-full">
            <div className="no-results-card">
              <Info className="icon" />
              <h2>No Schemes Found</h2>
              <p>
                Based on the profile provided, we couldn't find any matching government schemes at the moment.
              </p>
            </div>
        </section>
    );
  }

  return (
    <section className="results-container w-full">
      {hasMatches && (
        <>
          <h2 className="results-title">Relevant Schemes Found</h2>
          <div className="space-y-5">
            {results.matchedSchemes.map((scheme, index) => (
              <div className="result-card" key={index}>
                <div className="result-card-header">
                    <h3><Leaf className="mr-3 text-current h-6 w-6" /> {scheme.name}</h3>
                    <span className="score-badge">{scheme.semantic_similarity_score}% Match</span>
                </div>

                {scheme.is_possibly_relevant && (
                  <div className="possible-relevance-badge">
                    <Info className="h-4 w-4 mr-2" />
                    Possibly Relevant – Review Recommended
                  </div>
                )}
                
                <div className="result-section">
                  <h4>Benefits</h4>
                  <p>{scheme.benefits}</p>
                </div>

                <div className="result-section">
                  <h4>Relevance Analysis</h4>
                  <p>{scheme.relevance_reason}</p>
                </div>
                
                <Accordion type="single" collapsible className="w-full mt-5 guide-accordion">
                  <AccordionItem value={scheme.name}>
                      <AccordionTrigger
                          onClick={() => {
                              if (!generatedGuides[scheme.name] && guideLoading !== scheme.name) {
                                  handleGenerateGuide(scheme);
                              }
                          }}
                          disabled={guideLoading === scheme.name}
                          className="guide-accordion-trigger"
                      >
                          {guideLoading === scheme.name ? (
                              <div className="flex items-center text-amber-300">
                                  <span className="loading-spinner-small mr-3"></span>
                                  Generating Your Guide...
                              </div>
                          ) : (
                              <div className="flex items-center">
                                  <Bot className="mr-3 h-5 w-5 text-amber-400" />
                                  AI-Powered Application Guide
                              </div>
                          )}
                      </AccordionTrigger>
                      <AccordionContent className="guide-accordion-content">
                          {generatedGuides[scheme.name] ? (
                              <ApplicationGuideDisplay guide={generatedGuides[scheme.name]} />
                          ) : guideLoading !== scheme.name ? (
                              <div className="p-4 text-center text-slate-400">
                                  Click to generate a personalized step-by-step guide using AI.
                              </div>
                          ) : null}
                      </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {scheme.applicationGuideLink && (
                  <a href={scheme.applicationGuideLink} target="_blank" rel="noopener noreferrer" className="premium-btn mt-6 flex items-center justify-center gap-3 w-auto px-6 py-3 text-base">
                    <ExternalLink className="h-4 w-4" />
                    Official Scheme Portal
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {hasNearMisses && <NearMissAnalysis nearMisses={results.nearMisses!} />}

    </section>
  );
}
