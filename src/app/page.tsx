"use client";

import * as React from "react";
import { type FarmerProfileInput } from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import { getEligibleSchemes } from "@/app/actions";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import Header from "@/app/components/header";
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
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow">
        <section className="text-center mb-8 md:mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-3">
            Unlock Your Farm's Potential
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Enter your details below to discover government schemes tailored to your needs and get guidance on how to apply.
          </p>
        </section>

        <FarmerProfileForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        
        <SchemeResults results={results} isLoading={isLoading} />
      </main>
      <footer className="w-full max-w-4xl mx-auto py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} KisanSahayak. All rights reserved.</p>
      </footer>
    </div>
  );
}
