'use client';

import * as React from "react";
import { type FarmerProfileInput, type SchemeAnalysisOutput } from "@/ai/schemas";
import FarmerProfileForm from "@/app/components/farmer-profile-form";
import SchemeResults from "@/app/components/scheme-results";
import DocumentReadinessChecker from "@/app/components/document-readiness-checker";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser, initiateAnonymousSignIn, setDocument } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
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

  // High-performance form submission
  const handleFormSubmit = async (data: FarmerProfileInput, documents: DocumentsState) => {
    // Start processing immediately - zero latency approach
    setIsLoading(true);
    setFarmerProfile(data);

    // Instant Offline Analysis for immediate feedback
    const eligibilityResults = analyzeSchemesOffline(data);
    setResults(eligibilityResults);
    setIsLoading(false);
    
    // Persist data in background asynchronously (completely non-blocking)
    if (user?.uid && firestore) {
        const userId = user.uid;
        
        // Save farmer profile in background
        const farmerProfileRef = doc(firestore, 'users', userId, 'farmer_profile', userId);
        setDocument(farmerProfileRef, {
            id: userId,
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });

        // NOTE: We do NOT clobber 'uploaded_documents' here because the uploader
        // already wrote them individually with handleUploadComplete.
        // We only save verification status if not already set.
        const docRef = doc(firestore, 'users', userId, 'uploaded_documents', userId);
        setDocument(docRef, {
            id: userId,
            // Only merge fields that aren't the URLs to avoid resetting them
            lastProfileSync: serverTimestamp(),
            verificationStatus: 'Pending',
        }, { merge: true });
    }
  };

  return (
    <main className="min-h-screen pb-20">
        <div className="form-container">
            <h1 className="text-4xl md:text-5xl font-headline tracking-tight">KisanSahayak</h1>
            <p className="mt-4 text-white/80">
                Empowering farmers with AI-driven scheme discovery. Instant, personalized results for your farming journey.
            </p>
            <div className="mt-12 transition-all duration-300">
              <FarmerProfileForm 
                onSubmit={handleFormSubmit} 
                isLoading={isLoading}
                userId={user?.uid}
                isUserLoading={isUserLoading}
              />
            </div>
            
            { (isLoading || results) && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SchemeResults results={results} isLoading={isLoading} farmerProfile={farmerProfile} isOnline={isOnline} />
              </div>
            )}
            
            { results && (results.eligible_schemes.length > 0) && !isLoading &&
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <DocumentReadinessChecker eligibleSchemes={results.eligible_schemes} />
              </div>
            }
        </div>
    </main>
  );
}
