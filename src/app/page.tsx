
"use client";

import * as React from "react";
import { type FarmerProfileInput, type SchemeAnalysisOutput } from "@/ai/schemas";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
import DocumentReadinessChecker from "@/app/components/document-readiness-checker";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser, initiateAnonymousSignIn, setDocument } from "@/firebase";
import { doc, Timestamp } from "firebase/firestore";
import { analyzeSchemesOffline } from "@/lib/scheme-engine";

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
  const { toast } = useToast();

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);


  const handleFormSubmit = async (data: FarmerProfileInput, documents: DocumentsState) => {
    setIsLoading(true);
    setResults(null);
    setFarmerProfile(data);

    // --- Save data to Firestore (non-blocking) if online ---
    if (user?.uid && isOnline) {
        const userId = user.uid;
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
        setDocument(farmerProfileRef, farmerProfileForDb, { merge: true });

        const docRef = doc(firestore, 'users', userId, 'uploaded_documents', userId);
        const docData = {
            id: userId,
            landProofUrl: documents.landProofUrl || null,
            incomeCertificateUrl: documents.incomeCertificateUrl || null,
            identityProofUrl: documents.identityProofUrl || null,
            damagedCropImageUrl: documents.damagedCropImageUrl || null,
            uploadTimestamp: Timestamp.fromDate(new Date()),
            verificationStatus: 'Pending',
        };
        setDocument(docRef, docData, { merge: true });
    }
    // --- End Firestore save ---

    // A small timeout can make the transition feel smoother if processing is instant.
    setTimeout(() => {
      try {
        const eligibilityResults = analyzeSchemesOffline(data);
        setResults(eligibilityResults);
      } catch (error) {
        console.error("Error in offline analysis:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to analyze schemes. Please try again.",
        });
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <main>
        <div className="form-container">
            <h1>KisanSahayak</h1>
            <p>
                Enter your details below to discover government schemes tailored to your needs and get guidance on how to apply.
            </p>
            <FarmerProfileForm 
              onSubmit={handleFormSubmit} 
              isLoading={isLoading}
              userId={user?.uid}
              isUserLoading={isUserLoading}
            />
            { (isLoading || results) && <SchemeResults results={results} isLoading={isLoading} farmerProfile={farmerProfile} isOnline={isOnline} />}
            
            { results && (results.eligible_schemes.length > 0) && !isLoading &&
              <DocumentReadinessChecker eligibleSchemes={results.eligible_schemes} />
            }
        </div>
    </main>
  );
}
