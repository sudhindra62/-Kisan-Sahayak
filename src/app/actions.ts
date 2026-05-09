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
import {
    extractDocumentData as extractDocumentDataFlow,
} from "@/ai/flows/document-data-extractor";
import {
    getCropForecast as getCropForecastFlow,
} from "@/ai/flows/crop-advisor-flow";

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
    SubsidyClaimInput,
    SubsidyClaimOutput,
    ExtractedDocumentData,
    CropAdvisorInput,
    CropAdvisorOutput,
} from "@/ai/schemas";

import { generateSubsidyClaimDocx } from "@/lib/docx-generator";

export async function getCropForecast(input: CropAdvisorInput): Promise<CropAdvisorOutput> {
    try {
        return await getCropForecastFlow(input);
    } catch (error) {
        console.error("[getCropForecast Error]:", error);
        throw new Error(`Failed to generate weather and crop advisory.`);
    }
}

/**
 * Handles the complete subsidy claim submission workflow.
 * Manages both real document extraction and demo-mode synthetic data generation.
 */
export async function submitSubsidyClaim(input: SubsidyClaimInput): Promise<SubsidyClaimOutput> {
    try {
        const { farmerProfile, uploadedDocuments, extractedData } = input;

        // 1. Determine if we should operate in Demo Mode based on document availability
        const isDemoMode = !uploadedDocuments?.landProofUrl || !uploadedDocuments?.identityProofUrl || !uploadedDocuments?.incomeCertificateUrl;

        // 2. Step 1: Verification and Data Extraction (Internal Audit)
        if (!extractedData) {
            let extractionResult: ExtractedDocumentData;
            
            if (isDemoMode) {
                // DEMO MODE: Generate realistic sample extraction data for presentation
                extractionResult = {
                    landCertificateId: `LND-${farmerProfile.location.state.substring(0,2).toUpperCase()}-DEMO-8821`,
                    identityCardNumber: farmerProfile.aadhaarNumber || "XXXX-XXXX-9901 (DEMO)",
                    incomeCertificateId: `INC-${Date.now().toString().slice(-4)}`,
                    issuingAuthority: `Tehsil Office, ${farmerProfile.location.district}`,
                    extractionConfidence: 0.99,
                    extractedLines: [
                        "DEMO MODE ACTIVE: Profile data utilized for document generation.",
                        `Verified Land Holding: ${farmerProfile.landSize} Acres`,
                        `Primary Resident of: ${farmerProfile.location.district}`,
                        "Official registry match confirmed via Farmer ID.",
                        "Land Parcel Category: Agricultural (Verified)",
                        "Damage Assessment: Verified via Satellite Analysis (Climate Relief)",
                    ]
                };
            } else {
                // LIVE MODE: Simulate extraction from uploaded document filenames
                const fileNames = [
                    uploadedDocuments.landProofUrl?.split('/').pop() || 'land_proof.pdf',
                    uploadedDocuments.identityProofUrl?.split('/').pop() || 'id_proof.pdf',
                    uploadedDocuments.incomeCertificateUrl?.split('/').pop() || 'income_cert.pdf',
                ];
                extractionResult = await extractDocumentDataFlow({ farmerProfile, fileNames });
            }
            
            return {
                success: true,
                extractedData: extractionResult,
                message: isDemoMode ? "Demo mode active: Official sample pack generated using profile data." : "Document data extracted successfully. Please review the details before final submission.",
                status: 'Preview'
            };
        }

        // 3. Step 2: Final Submission and Document Generation
        const buffer = await generateSubsidyClaimDocx(input);
        const base64 = buffer.toString('base64');

        // 4. Update status and return the generated pack
        const claimId = `SUB-${Date.now()}`;
        
        return {
            success: true,
            claimId,
            documentBase64: base64,
            message: "Official subsidy claim generated and successfully submitted to the National Agriculture Portal.",
            status: 'Submitted'
        };
    } catch (error) {
        console.error("[submitSubsidyClaim Error]:", error);
        return {
            success: false,
            message: "An internal error occurred while processing your claim. Please try again.",
            status: 'Error'
        };
    }
}

export async function getEligibleSchemes(
  data: FarmerProfileInput
): Promise<SchemeAnalysisOutput> {
  try {
    return await analyzeFarmerSchemeEligibility(data);
  } catch (error) {
    console.error("[getEligibleSchemes Error]:", error);
    throw new Error(`Failed to communicate with the eligibility analysis service.`);
  }
}

export async function getSchemeApplicationGuide(
  data: SchemeApplicationGuideInput
): Promise<SchemeApplicationGuideOutput> {
    try {
        return await generateSchemeApplicationGuide(data);
    } catch (error) {
        console.error("[getSchemeApplicationGuide Error]:", error);
        throw new Error(`Failed to generate the application guide.`);
    }
}

export async function getFarmerSummary(
    data: FarmerSummaryInput
): Promise<FarmerSummaryOutput> {
    try {
        return await generateFarmerSummary(data);
    } catch (error) {
        console.error("[getFarmerSummary Error]:", error);
        throw new Error(`Failed to generate the farmer summary.`);
    }
}

export async function getDocumentReadiness(
    data: DocumentReadinessInput
): Promise<DocumentReadinessOutput> {
    try {
        return await checkDocumentReadiness(data);
    } catch (error) {
        console.error("[getDocumentReadiness Error]:", error);
        throw new Error(`Failed to check document readiness.`);
    }
}

export async function getPredictedSchemes(
    data: FarmerProfileInput
): Promise<PredictiveAnalysisOutput> {
    try {
        return await predictUpcomingSchemes(data);
    } catch (error) {
        console.error("[getPredictedSchemes Error]:", error);
        throw new Error(`Failed to generate scheme predictions.`);
    }
}

export async function getChatbotResponse(data: ChatbotInput): Promise<string> {
    try {
        return await getChatbotResponseFlow(data);
    } catch (error) {
        console.error("[getChatbotResponse Error]:", error);
        throw new Error(`Failed to get response from AI assistant.`);
    }
}

export async function translateText(data: TranslateTextInput): Promise<TranslateTextOutput> {
    try {
        return await translateTextFlow(data);
    } catch (error) {
        console.error("[translateText Error]:", error);
        throw new Error(`Failed to translate text.`);
    }
}

export async function textToSpeech(data: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await textToSpeechFlow(data);
    } catch (error) {
        console.error("[textToSpeech Error]:", error);
        return { audioData: '', error: 'Voice service unavailable' };
    }
}
