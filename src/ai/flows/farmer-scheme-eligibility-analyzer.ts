'use server';
/**
 * @fileOverview Analyzes a farmer's profile against government schemes to determine eligibility using semantic search.
 *
 * - analyzeFarmerSchemeEligibility - A function that handles the scheme eligibility analysis process.
 * - FarmerProfileInput - The input type for the analyzeFarmerSchemeEligibility function.
 * - SchemeAnalysisOutput - The return type for the analyzeFarmerSchemeEligibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FarmerProfileInputSchema, GovernmentSchemeSchema, SchemeAnalysisOutputSchema } from '@/ai/schemas';

// Input Schema for farmer's profile
export type FarmerProfileInput = z.infer<typeof FarmerProfileInputSchema>;

// Schema for a single government scheme (internal to the tool/prompt)
type GovernmentScheme = z.infer<typeof GovernmentSchemeSchema>; // Not exported, used internally.

// Output Schema for the analysis
export type SchemeAnalysisOutput = z.infer<typeof SchemeAnalysisOutputSchema>;


// Define the tool to fetch government schemes
const getGovernmentSchemes = ai.defineTool(
  {
    name: 'getGovernmentSchemes',
    description: 'Retrieves a list of all available government agricultural schemes with their detailed eligibility criteria and benefits.',
    inputSchema: z.object({}), // No specific input needed to get all schemes for this use case
    outputSchema: z.array(GovernmentSchemeSchema),
  },
  async () => {
    // This is a placeholder for fetching data from Firestore.
    // In a real application, this would query a Firestore collection.
    // For now, return hardcoded scheme data.
    const schemes: GovernmentScheme[] = [
      {
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        benefits: 'Provides insurance coverage and financial support to farmers in case of crop failure due to natural calamities, pests & diseases.',
        eligibilityCriteria: 'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas are eligible. Compulsory for loanee farmers availing Crop Loan/KCC account for notified crops. Voluntary for non-loanee farmers.',
        applicationGuideLink: 'https://pmfby.gov.in/'
      },
      {
        name: 'Kisan Credit Card (KCC) Scheme',
        benefits: 'Provides adequate and timely credit support from the banking system to the farmers for their cultivation needs.',
        eligibilityCriteria: 'Farmers, individual/joint cultivators, tenant farmers, oral lessees & sharecroppers, SHGs/JLG of farmers are eligible. Minimum age 18 years, maximum 75 years.',
        applicationGuideLink: 'https://www.nabard.org/content.aspx?id=599'
      },
      {
        name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
        benefits: 'Provides income support to all eligible farmer families across the country to supplement their financial needs.',
        eligibilityCriteria: 'All landholding farmer families, subject to certain exclusion criteria. Exclusion criteria include institutional landholders, former and present holders of constitutional posts, former and present Ministers/State Ministers, Members of LokSabha/ RajyaSabha/ State Legislative Assemblies/ State Legislative Councils, Mayors of Municipal Corporations, Chairpersons of District Panchayats, and also those government employees.',
        applicationGuideLink: 'https://pmkisan.gov.in/'
      },
      {
        name: 'Soil Health Card Scheme',
        benefits: 'Provides farmers with a Soil Health Card (SHC) every 2 years, which contains nutrient status of his/her soil with respect to 12 parameters and advises on dosage of fertilizers and also the requisite soil amendments that a farmer should undertake.',
        eligibilityCriteria: 'All farmers with agricultural land are eligible.',
        applicationGuideLink: 'https://www.soilhealth.dac.gov.in/'
      },
      {
        name: 'National Food Security Mission (NFSM)',
        benefits: 'Aims to increase production of rice, wheat, pulses, coarse cereals and commercial crops, through area expansion and productivity enhancement.',
        eligibilityCriteria: 'Farmers cultivating specific crops in identified districts, focused on increasing productivity and resource use efficiency. Eligibility often tied to adoption of recommended practices.',
      }
    ];
    return schemes;
  }
);

// Define the prompt that uses the fetched schemes and farmer profile
const farmerSchemeEligibilityPrompt = ai.definePrompt({
  name: 'farmerSchemeEligibilityPrompt',
  input: {
    schema: z.object({
      farmerProfile: FarmerProfileInputSchema,
      schemes: z.array(GovernmentSchemeSchema),
    }),
  },
  output: { schema: SchemeAnalysisOutputSchema },
  prompt: `You are an advanced AI assistant specializing in semantic analysis for agricultural schemes. Your task is to evaluate a farmer's profile against a list of government schemes using semantic matching to determine relevance.

- **Semantic Search:** Understand synonyms and related concepts (e.g., 'rice' is similar to 'paddy'). Tolerate minor spelling mistakes in the user input. Match schemes even if the wording differs but the meaning is similar.
- **Scoring:** For each scheme, calculate a \`semantic_similarity_score\` from 0 to 100 based on how well the farmer's profile matches the scheme's intent and criteria. A score of 100 is a perfect match. A score below 50 should be discarded.
- **Reasoning:** Provide a clear \`relevance_reason\` for each match. This reason should explain the connection between the farmer's profile (land size, location, crop, income) and the scheme's eligibility criteria.
- **Possible Relevance:** If a scheme's relevance is uncertain or depends on specific criteria not fully covered in the profile (e.g., being part of a specific farmer group, detailed income brackets, exact location definitions like 'drought-prone area'), mark \`is_possibly_relevant\` as true. In the \`relevance_reason\` for such cases, clearly state what the farmer needs to review.
- **Eligibility Criteria**: For each relevant scheme, you MUST include the original 'Eligibility Criteria' text from the provided scheme list in the \`eligibilityCriteria\` field.
- **Near-Miss Analysis:** After identifying matched schemes, analyze the schemes that were *not* a strong match but where the farmer is close to qualifying (e.g., fails only one or two key criteria). These are "near-misses". For each near-miss, populate the \`nearMisses\` array.
- \`reason_not_eligible\`: Clearly state the primary reason(s) for ineligibility.
- \`improvement_suggestions\`: Provide concrete, actionable suggestions for the farmer to meet the criteria in the future.
- \`alternate_scheme_suggestions\`: If applicable, suggest other schemes from the provided list that are a better fit.

Farmer's Profile:
- Land Size: {{{farmerProfile.landSize}}} acres
- Farmer Category: {{{farmerProfile.farmerCategory}}}
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Irrigation Type: {{{farmerProfile.irrigationType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}

Available Government Schemes:
{{#each schemes}}
---
Scheme Name: {{{this.name}}}
Benefits: {{{this.benefits}}}
Eligibility Criteria: {{{this.eligibilityCriteria}}}
Application Guide Link: {{{this.applicationGuideLink}}}
{{/each}}

Analyze the farmer's profile against each scheme. Return a list of all relevant schemes (direct and possible matches), sorted from the highest \`semantic_similarity_score\` to the lowest. Also, identify any "near-miss" schemes and provide suggestions as described. If no schemes are relevant, return empty arrays for both matchedSchemes and nearMisses.`
});

// Define the Genkit flow
const farmerSchemeEligibilityAnalyzerFlow = ai.defineFlow(
  {
    name: 'farmerSchemeEligibilityAnalyzerFlow',
    inputSchema: FarmerProfileInputSchema,
    outputSchema: SchemeAnalysisOutputSchema,
  },
  async (input) => {
    // Call the tool to get the list of government schemes
    const schemes = await getGovernmentSchemes({}); // Pass empty object as input to the tool

    // Pass farmer's profile and schemes to the prompt
    const { output } = await farmerSchemeEligibilityPrompt({
      farmerProfile: input,
      schemes: schemes,
    });
    return output!;
  }
);

// Exported wrapper function
export async function analyzeFarmerSchemeEligibility(
  input: FarmerProfileInput
): Promise<SchemeAnalysisOutput> {
  return farmerSchemeEligibilityAnalyzerFlow(input);
}
