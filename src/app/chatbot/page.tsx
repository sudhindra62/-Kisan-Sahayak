'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { doc } from 'firebase/firestore';
import ChatWindow from '@/app/components/chatbot/ChatWindow';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FarmerProfileInput } from '@/ai/schemas';

const ChatbotPage = () => {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!isUserLoading && !user) {
            initiateAnonymousSignIn(auth);
        }
    }, [user, isUserLoading, auth]);

    const farmerProfileRef = useMemoFirebase(() =>
        user ? doc(firestore, 'users', user.uid, 'farmer_profile', user.uid) : null
    , [firestore, user]);

    const { data: farmerProfileDoc, isLoading: isProfileLoading } = useDoc<any>(farmerProfileRef);
    
    const farmerProfile: FarmerProfileInput | null = farmerProfileDoc ? {
        fullName: farmerProfileDoc.fullName || "Farmer",
        aadhaarNumber: farmerProfileDoc.aadhaarNumber || "000000000000",
        landSize: Number(farmerProfileDoc.landSize) || 0,
        location: {
            state: farmerProfileDoc.location?.state || farmerProfileDoc.state || "Unknown State",
            district: farmerProfileDoc.location?.district || farmerProfileDoc.district || "Unknown District",
        },
        cropType: farmerProfileDoc.cropType || "General",
        irrigationType: farmerProfileDoc.irrigationType || 'Rainfed',
        annualIncome: Number(farmerProfileDoc.annualIncome) || 0,
        farmerCategory: (Number(farmerProfileDoc.landSize) || 0) < 5 ? 'Small and Marginal' : ((Number(farmerProfileDoc.landSize) || 0) <= 10 ? 'Medium' : 'Large'),
    } : null;

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                <p className="mt-4 text-lg text-white/70">Connecting to Assistant...</p>
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                 <div className="form-container" style={{maxWidth: '600px'}}>
                    <h2 className="results-title">Setting up secure session</h2>
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-400" />
                </div>
            </div>
        )
    }

    if (!farmerProfile && !isProfileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <div className="form-container" style={{maxWidth: '600px'}}>
                    <h2 className="results-title">Profile Required</h2>
                    <p className="mb-8">Please complete your profile on the home page first so the assistant can give you personalized advice.</p>
                    <Link href="/" className="premium-btn flex items-center justify-center gap-3 w-auto px-8 py-4 text-base">
                        <ArrowLeft className="h-5 w-5" />
                        Go to Home Page
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen py-4 md:py-8">
           <ChatWindow farmerProfile={farmerProfile!} userId={user.uid} />
        </div>
    );
};

export default ChatbotPage;
