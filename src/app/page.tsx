"use client";

import * as React from "react";
import { type FarmerProfileInput, type SchemeAnalysisOutput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import { type FarmerSummaryOutput } from "@/ai/flows/farmer-summary-generator";
import { getEligibleSchemes, getFarmerSummary } from "@/app/actions";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
import SummaryReport from "@/app/components/summary-report";
import { useToast } from "@/hooks/use-toast";

type ResultsState = {
    matchedSchemes: {
        name: string;
        benefits: string;
        eligibilityCriteria: string;
        semantic_similarity_score: number;
        relevance_reason: string;
        is_possibly_relevant: boolean;
        applicationGuideLink?: string | undefined;
    }[];
    nearMisses?: {
        name: string;
        reason_not_eligible: string;
        improvement_suggestions: string[];
        alternate_scheme_suggestions: string[];
    }[];
} | null;


export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ResultsState>(null);
  const [farmerProfile, setFarmerProfile] = React.useState<FarmerProfileInput | null>(null);
  const [summary, setSummary] = React.useState<FarmerSummaryOutput | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (data: FarmerProfileInput) => {
    setIsLoading(true);
    setResults(null);
    setSummary(null);
    setFarmerProfile(data);
    try {
      const eligibilityResults = await getEligibleSchemes(data);
      setResults(eligibilityResults);
      setIsLoading(false); // Stop main loading indicator

      // Now, generate the summary
      if (eligibilityResults && (eligibilityResults.matchedSchemes.length > 0 || (eligibilityResults.nearMisses && eligibilityResults.nearMisses.length > 0))) {
        setIsSummaryLoading(true);
        try {
            const summaryResult = await getFarmerSummary({
                farmerProfile: data,
                analysisResults: eligibilityResults,
            });
            setSummary(summaryResult);
        } catch (summaryError) {
            console.error("Error generating summary:", summaryError);
            // Optionally show a toast for summary failure, but don't block the main results
            toast({
                variant: "destructive",
                title: "Warning",
                description: "Could not generate the final summary report.",
            });
        } finally {
            setIsSummaryLoading(false);
        }
      }

    } catch (error) {
      console.error("Error analyzing eligibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze scheme eligibility. Please try again.",
      });
      setIsLoading(false);
    } 
  };

  return (
    <main>
        <div className="center-blend"></div>
        <div className="center-glow"></div>
        <div className="form-container">
            <h1>Farmer Profile</h1>
            <p>
                Enter your details below to discover government schemes tailored to your needs and get guidance on how to apply.
            </p>
            <FarmerProfileForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            { (isLoading || results) && <SchemeResults results={results} isLoading={isLoading} farmerProfile={farmerProfile} />}
            { (isSummaryLoading || summary) && <SummaryReport summary={summary} isLoading={isSummaryLoading} /> }
        </div>
    </main>
  );
}
