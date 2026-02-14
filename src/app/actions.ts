"use server";

import {
  analyzeFarmerSchemeEligibility,
  type FarmerProfileInput,
  type SchemeAnalysisOutput,
} from "@/ai/flows/farmer-scheme-eligibility-analyzer";

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
