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
