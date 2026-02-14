'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { doc } from 'firebase/firestore';
import ChatWindow from '@/app/components/chatbot/ChatWindow';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
        landSize: farmerProfileDoc.landSize,
        location: {
            state: farmerProfileDoc.state,
            district: farmerProfileDoc.district,
        },
        cropType: farmerProfileDoc.cropType,
        irrigationType: farmerProfileDoc.irrigationType,
        annualIncome: farmerProfileDoc.annualIncome,
        farmerCategory: farmerProfileDoc.landSize < 5 ? 'Small and Marginal' : (farmerProfileDoc.landSize <= 10 ? 'Medium' : 'Large'),
    } : null;

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-lg">Loading Your Assistant...</p>
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                 <div className="form-container" style={{maxWidth: '600px'}}>
                    <h2 className="results-title">Authentication Required</h2>
                    <p className="mb-8">Please wait while we set up a secure session for you.</p>
                     <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    if (!farmerProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <div className="form-container" style={{maxWidth: '600px'}}>
                    <h2 className="results-title">Profile Not Found</h2>
                    <p className="mb-8">To use the AI assistant, you first need to create your farmer profile.</p>
                    <Link href="/" className="premium-btn flex items-center justify-center gap-3 w-auto px-8 py-4 text-base">
                        <ArrowLeft className="h-5 w-5" />
                        Go to Home Page
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="flex items-center justify-center min-h-screen py-8">
           <ChatWindow farmerProfile={farmerProfile} userId={user.uid} />
        </div>
    );
};

export default ChatbotPage;
