"use client";

import * as React from "react";
import { type FarmerProfileInput, type SchemeAnalysisOutput } from "@/ai/schemas";
import { type FarmerSummaryOutput } from "@/ai/flows/farmer-summary-generator";
import { getEligibleSchemes, getFarmerSummary, getPredictedSchemes } from "@/app/actions";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
import SummaryReport from "@/app/components/summary-report";
import DocumentReadinessChecker from "@/app/components/document-readiness-checker";
import { useToast } from "@/hooks/use-toast";
import type { PredictiveAnalysisOutput } from "@/ai/flows/predictive-scheme-analyzer";
import PredictiveAnalysis from "@/app/components/predictive-analysis";
import { useAuth, useFirestore, useUser, initiateAnonymousSignIn, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

type DocumentsState = {
  landProofUrl?: string;
  incomeCertificateUrl?: string;
  identityProofUrl?: string;
  damagedCropImageUrl?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SchemeAnalysisOutput | null>(null);
  const [farmerProfile, setFarmerProfile] = React.useState<FarmerProfileInput | null>(null);
  const [summary, setSummary] = React.useState<FarmerSummaryOutput | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const [predictions, setPredictions] = React.useState<PredictiveAnalysisOutput | null>(null);
  const [isPredictionsLoading, setIsPredictionsLoading] = React.useState(false);
  const { toast } = useToast();

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);


  const handleFormSubmit = async (data: FarmerProfileInput, documents: DocumentsState) => {
    // Set all loading states to true immediately to show all skeletons
    setIsLoading(true);
    setIsSummaryLoading(true);
    setIsPredictionsLoading(true);
    setResults(null);
    setSummary(null);
    setPredictions(null);
    setFarmerProfile(data);

    if (!user?.uid) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Could not authenticate user. Please try again.',
        });
        setIsLoading(false);
        setIsSummaryLoading(false);
        setIsPredictionsLoading(false);
        return;
    }
    const userId = user.uid;

    // --- Save data to Firestore (non-blocking) ---
    const farmerProfileRef = doc(firestore, 'users', userId, 'farmer_profile', userId);
    const farmerProfileForDb = {
        id: userId,
        landSize: data.landSize,
        state: data.location.state,
        district: data.location.district,
        cropType: data.cropType,
        irrigationType: data.irrigationType,
        annualIncome: data.annualIncome,
        documentSetId: userId,
    };
    setDocumentNonBlocking(farmerProfileRef, farmerProfileForDb, { merge: true });

    const docRef = doc(firestore, 'users', userId, 'uploaded_documents', userId);
    const docData = {
        id: userId,
        landProofUrl: documents.landProofUrl || '',
        incomeCertificateUrl: documents.incomeCertificateUrl || '',
        identityProofUrl: documents.identityProofUrl || '',
        damagedCropImageUrl: documents.damagedCropImageUrl || '',
        uploadTimestamp: new Date().toISOString(),
        verificationStatus: 'Pending',
    };
    setDocumentNonBlocking(docRef, docData, { merge: true });
    // --- End Firestore save ---

    // Run predictions and eligibility analysis in parallel
    getPredictedSchemes(data)
        .then(predictionsResult => {
            if (predictionsResult) {
                setPredictions(predictionsResult);
            }
        })
        .catch(err => {
            console.error("Error generating predictions:", err);
            toast({
                variant: "destructive",
                title: "Warning",
                description: "Could not generate future scheme predictions.",
            });
            setPredictions(null); // Set to null to hide component on error
        })
        .finally(() => {
            setIsPredictionsLoading(false);
        });

    getEligibleSchemes(data)
        .then(eligibilityResults => {
            setResults(eligibilityResults);
            setIsLoading(false); // Eligibility results are back

            // Now, if we have results, fetch the summary
            if (eligibilityResults && (eligibilityResults.eligible_schemes.length > 0 || (eligibilityResults.nearMisses && eligibilityResults.nearMisses.length > 0))) {
                getFarmerSummary({
                    farmerProfile: data,
                    analysisResults: eligibilityResults,
                })
                .then(summaryResult => {
                    if (summaryResult) {
                        setSummary(summaryResult);
                    }
                })
                .catch(err => {
                    console.error("Error generating summary:", err);
                    toast({
                        variant: "destructive",
                        title: "Warning",
                        description: "Could not generate the final summary report.",
                    });
                    setSummary(null); // Set to null to hide component on error
                })
                .finally(() => {
                    setIsSummaryLoading(false);
                });
            } else {
                // If no eligible schemes, we don't need a summary.
                setIsSummaryLoading(false);
                setSummary(null);
            }
        })
        .catch(error => {
            console.error("Error analyzing eligibility:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to analyze scheme eligibility. Please try again.",
            });
            // Stop all loading states on critical failure
            setIsLoading(false);
            setIsSummaryLoading(false);
            setIsPredictionsLoading(false); // Also stop predictions loading
            setResults(null);
            setSummary(null);
            setPredictions(null);
        });
        
    // We don't await the promises here. The UI will update reactively as each one completes.
  };

  return (
    <main>
        <div className="center-blend"></div>
        <div className="center-glow"></div>
        <div className="form-container">
            <h1>KisanSahayak AI</h1>
            <p>
                Enter your details below to discover government schemes tailored to your needs and get guidance on how to apply.
            </p>
            <FarmerProfileForm 
              onSubmit={handleFormSubmit} 
              isLoading={isLoading || isSummaryLoading || isPredictionsLoading}
              userId={user?.uid}
              isUserLoading={isUserLoading}
            />
            { (isLoading || results) && <SchemeResults results={results} isLoading={isLoading} farmerProfile={farmerProfile} />}
            
            { results && (results.eligible_schemes.length > 0 || (results.nearMisses && results.nearMisses.length > 0)) && !isLoading &&
              <DocumentReadinessChecker eligibleSchemes={results.eligible_schemes} />
            }

            { (isSummaryLoading || summary) && <SummaryReport summary={summary} isLoading={isSummaryLoading} /> }

            { (isPredictionsLoading || predictions) && <PredictiveAnalysis predictions={predictions} isLoading={isPredictionsLoading} /> }
        </div>
    </main>
  );
}
