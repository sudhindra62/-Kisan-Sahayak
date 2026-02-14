"use client";

import * as React from "react";
import { type FarmerProfileInput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import { getEligibleSchemes } from "@/app/actions";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
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
  const { toast } = useToast();

  const handleFormSubmit = async (data: FarmerProfileInput) => {
    setIsLoading(true);
    setResults(null);
    setFarmerProfile(data);
    try {
      const eligibilityResults = await getEligibleSchemes(data);
      setResults(eligibilityResults);
    } catch (error) {
      console.error("Error analyzing eligibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze scheme eligibility. Please try again.",
      });
    } finally {
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
        </div>
    </main>
  );
}
