"use client";

import * as React from "react";
import { type FarmerProfileInput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import { getEligibleSchemes } from "@/app/actions";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
import { useToast } from "@/hooks/use-toast";

type ResultsState = {
  eligibleSchemes: {
    name: string;
    benefits: string;
    eligibilitySummary: string;
    applicationGuideLink?: string | undefined;
  }[];
} | null;

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ResultsState>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: FarmerProfileInput) => {
    setIsLoading(true);
    setResults(null);
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
        <div className="form-container">
            <h1>🚜 Farmer Profile</h1>
            <p style={{textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '600px', margin: '-20px auto 40px auto', lineHeight: '1.6'}}>
                Enter your details below to discover government schemes tailored to your needs and get guidance on how to apply.
            </p>
            <FarmerProfileForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            <SchemeResults results={results} isLoading={isLoading} />
        </div>
    </main>
  );
}
