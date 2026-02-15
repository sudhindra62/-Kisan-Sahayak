
"use server";

import {
  analyzeFarmerSchemeEligibility,
} from "@/ai/flows/farmer-scheme-eligibility-analyzer";
import {
    generateSchemeApplicationGuide,
} from "@/ai/flows/scheme-application-guide-generator";
import {
    generateFarmerSummary,
} from "@/ai/flows/farmer-summary-generator";
import {
    checkDocumentReadiness,
} from "@/ai/flows/document-readiness-checker";
import {
    predictUpcomingSchemes,
} from "@/ai/flows/predictive-scheme-analyzer";
import { getChatbotResponse as getChatbotResponseFlow } from "@/ai/flows/farmer-assistant-chat";
import {
    translateText as translateTextFlow,
} from "@/ai/flows/translate-text";
import {
    textToSpeech as textToSpeechFlow,
} from "@/ai/flows/text-to-speech";

import type {
    FarmerProfileInput,
    SchemeAnalysisOutput,
    SchemeApplicationGuideInput,
    SchemeApplicationGuideOutput,
    FarmerSummaryInput,
    FarmerSummaryOutput,
    DocumentReadinessInput,
    DocumentReadinessOutput,
    PredictiveAnalysisOutput,
    ChatbotInput,
    TranslateTextInput,
    TranslateTextOutput,
    TextToSpeechInput,
    TextToSpeechOutput,
} from "@/ai/schemas";


export async function getEligibleSchemes(
  data: FarmerProfileInput
): Promise<SchemeAnalysisOutput> {
  try {
    const result = await analyzeFarmerSchemeEligibility(data);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in getEligibleSchemes server action:", error);
    throw new Error(`Failed to communicate with the eligibility analysis service. Reason: ${errorMessage}`);
  }
}

export async function getSchemeApplicationGuide(
  data: SchemeApplicationGuideInput
): Promise<SchemeApplicationGuideOutput> {
    try {
        const result = await generateSchemeApplicationGuide(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in getSchemeApplicationGuide server action:", error);
        throw new Error(`Failed to generate the application guide. Reason: ${errorMessage}`);
    }
}

export async function getFarmerSummary(
    data: FarmerSummaryInput
): Promise<FarmerSummaryOutput> {
    try {
        const result = await generateFarmerSummary(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in getFarmerSummary server action:", error);
        throw new Error(`Failed to generate the farmer summary. Reason: ${errorMessage}`);
    }
}

export async function getDocumentReadiness(
    data: DocumentReadinessInput
): Promise<DocumentReadinessOutput> {
    try {
        const result = await checkDocumentReadiness(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in getDocumentReadiness server action:", error);
        throw new Error(`Failed to check document readiness. Reason: ${errorMessage}`);
    }
}

export async function getPredictedSchemes(
    data: FarmerProfileInput
): Promise<PredictiveAnalysisOutput> {
    try {
        const result = await predictUpcomingSchemes(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in getPredictedSchemes server action:", error);
        throw new Error(`Failed to generate scheme predictions. Reason: ${errorMessage}`);
    }
}

export async function getChatbotResponse(data: ChatbotInput): Promise<string> {
    try {
        const result = await getChatbotResponseFlow(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in getChatbotResponse server action:", error);
        throw new Error(`Failed to get response from AI assistant. Reason: ${errorMessage}`);
    }
}

export async function translateText(data: TranslateTextInput): Promise<TranslateTextOutput> {
    try {
        const result = await translateTextFlow(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error in translateText server action:", error);
        throw new Error(`Failed to translate text. Reason: ${errorMessage}`);
    }
}

export async function textToSpeech(data: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        const result = await textToSpeechFlow(data);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Log the full error on the server for debugging
        console.error("Error in textToSpeech server action:", error);
        // Return a payload with the error message for the client to handle
        return { audioData: '', error: errorMessage };
    }
}
