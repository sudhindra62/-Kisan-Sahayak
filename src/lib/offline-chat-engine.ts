'use client';

import type { FarmerProfileInput } from '@/ai/schemas';
import { centralReliefSchemes } from '@/ai/database/central-schemes';

const GREETINGS = ['hello', 'hi', 'hey', 'namaste'];
const DISTRESS_KEYWORDS = ['damage', 'loss', 'flood', 'drought', 'disaster', 'emergency', 'help', 'stress', 'low income', 'rejected', 'loan', 'crop'];

const getGreetingResponse = (): string => {
    return "Hello! I am your KisanSahayak assistant. I have limited functions while offline, but I will do my best to help. For full assistance, please connect to the internet.";
}

const getDistressResponse = (message: string, farmerProfile: FarmerProfileInput): string => {
    const query = message.toLowerCase();
    
    const relevantSchemes = centralReliefSchemes.filter(scheme => {
        const landSize = farmerProfile.landSize;
        if (landSize < scheme.eligibility_land_min || landSize > scheme.eligibility_land_max) {
            return false;
        }
        
        if (scheme.eligible_damage_types.length > 0) {
            const hasDamageMatch = scheme.eligible_damage_types.some(type => query.includes(type.toLowerCase()));
            if (!hasDamageMatch) {
                 // Check for general distress if no specific damage type matches
                return DISTRESS_KEYWORDS.some(k => query.includes(k));
            }
        } else {
             // For schemes without specific damage types (like income support), check general distress keywords
            if (!DISTRESS_KEYWORDS.some(k => query.includes(k))) return false;
        }
        
        return true;
    });

    if (relevantSchemes.length === 0) {
        return "I couldn't find a specific relief scheme for your situation based on my offline data. For a detailed analysis, please connect to the internet. However, you can check the national 'Pradhan Mantri Fasal Bima Yojana (PMFBY)' for crop insurance.";
    }

    relevantSchemes.sort((a, b) => {
        if (a.priority_group.includes('Small') && !b.priority_group.includes('Small')) return -1;
        if (!a.priority_group.includes('Small') && b.priority_group.includes('Small')) return 1;
        return b.base_compensation_amount - a.base_compensation_amount;
    });

    const topSchemes = relevantSchemes.slice(0, 2);

    let response = "I understand you're facing a difficult situation. Based on my offline data, here are a couple of central government schemes that might help:\n\n";

    topSchemes.forEach((scheme, index) => {
        response += `${index + 1}. **${scheme.scheme_name}**: ${scheme.description}\n`;
    });

    response += "\nFor detailed eligibility and to apply, you will need to visit the official government portals, which requires an internet connection.";

    return response;
};

const getFallbackResponse = (): string => {
    return "I have limited knowledge while offline. I can help find emergency relief schemes if you describe your situation (e.g., 'my crop was damaged by flood'). For other questions, please connect to the internet for full AI assistance.";
}

export const getOfflineChatbotResponse = (message: string, farmerProfile: FarmerProfileInput): string => {
    const lowerCaseMessage = message.toLowerCase();

    if (GREETINGS.some(g => lowerCaseMessage.startsWith(g))) {
        return getGreetingResponse();
    }

    if (DISTRESS_KEYWORDS.some(k => lowerCaseMessage.includes(k))) {
        return getDistressResponse(lowerCaseMessage, farmerProfile);
    }
    
    return getFallbackResponse();
}
