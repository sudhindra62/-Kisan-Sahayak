"use server";

import {
  analyzeFarmerSchemeEligibility,
  type FarmerProfileInput,
  type SchemeAnalysisOutput,
} from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import {
    generateSchemeApplicationGuide,
    type SchemeApplicationGuideInput,
    type SchemeApplicationGuideOutput,
} from "@/ai/flows/scheme-application-guide-generator";
import {
    generateFarmerSummary,
    type FarmerSummaryInput,
    type FarmerSummaryOutput,
} from "@/ai/flows/farmer-summary-generator";
import {
    checkDocumentReadiness,
    type DocumentReadinessInput,
    type DocumentReadinessOutput,
} from "@/ai/flows/document-readiness-checker";
import {
    predictUpcomingSchemes,
    type PredictiveAnalysisOutput,
} from "@/ai/flows/predictive-scheme-analyzer";
import { getChatbotResponse as getChatbotResponseFlow } from "@/ai/flows/farmer-assistant-chat";
import type { ChatbotInput } from "@/ai/schemas";

export async function getEligibleSchemes(
  data: FarmerProfileInput
): Promise<SchemeAnalysisOutput> {
  try {
    const result = await analyzeFarmerSchemeEligibility(data);
    return result;
  } catch (error) {
    console.error("Error in getEligibleSchemes server action:", error);
    throw new Error("Failed to communicate with the eligibility analysis service.");
  }
}

export async function getSchemeApplicationGuide(
  data: SchemeApplicationGuideInput
): Promise<SchemeApplicationGuideOutput> {
    try {
        const result = await generateSchemeApplicationGuide(data);
        return result;
    } catch (error) {
        console.error("Error in getSchemeApplicationGuide server action:", error);
        throw new Error("Failed to generate the application guide.");
    }
}

export async function getFarmerSummary(
    data: FarmerSummaryInput
): Promise<FarmerSummaryOutput> {
    try {
        const result = await generateFarmerSummary(data);
        return result;
    } catch (error) {
        console.error("Error in getFarmerSummary server action:", error);
        throw new Error("Failed to generate the farmer summary.");
    }
}

export async function getDocumentReadiness(
    data: DocumentReadinessInput
): Promise<DocumentReadinessOutput> {
    try {
        const result = await checkDocumentReadiness(data);
        return result;
    } catch (error) {
        console.error("Error in getDocumentReadiness server action:", error);
        throw new Error("Failed to check document readiness.");
    }
}

export async function getPredictedSchemes(
    data: FarmerProfileInput
): Promise<PredictiveAnalysisOutput> {
    try {
        const result = await predictUpcomingSchemes(data);
        return result;
    } catch (error) {
        console.error("Error in getPredictedSchemes server action:", error);
        throw new Error("Failed to generate scheme predictions.");
    }
}

export async function getChatbotResponse(data: ChatbotInput): Promise<string> {
    try {
        const result = await getChatbotResponseFlow(data);
        return result;
    } catch (error) {
        console.error("Error in getChatbotResponse server action:", error);
        throw new Error("Failed to get response from AI assistant.");
    }
}
