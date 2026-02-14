'use server';
/**
 * @fileOverview Analyzes a farmer's profile against government schemes to determine eligibility.
 *
 * - analyzeFarmerSchemeEligibility - A function that handles the scheme eligibility analysis process.
 * - FarmerProfileInput - The input type for the analyzeFarmerSchemeEligibility function.
 * - EligibleSchemesOutput - The return type for the analyzeFarmerSchemeEligibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for farmer's profile
const FarmerProfileInputSchema = z.object({
  landSize: z.number().positive().describe('The size of the farmer\'s land in acres.'),
  location: z.object({
    state: z.string().describe('The state where the farm is located.'),
    district: z.string().describe('The district within the state.'),
  }).describe('The geographical location of the farm.'),
  cropType: z.string().describe('The primary crop type cultivated by the farmer (e.g., "Wheat", "Rice", "Cotton").'),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']).describe('The primary irrigation method used (e.g., "Rainfed", "Well", "Canal").'),
  annualIncome: z.number().min(0).describe('The farmer\'s annual income in local currency.'),
});
export type FarmerProfileInput = z.infer<typeof FarmerProfileInputSchema>;

// Schema for a single government scheme (internal to the tool/prompt)
const GovernmentSchemeSchema = z.object({
  name: z.string().describe('The name of the government scheme.'),
  benefits: z.string().describe('A summary of the benefits provided by the scheme.'),
  eligibilityCriteria: z.string().describe('Detailed criteria for eligibility (e.g., "Farmers with less than 2 acres of land in drought-prone areas", "Annual income below X", "Cultivates specific crop").'),
  applicationGuideLink: z.string().optional().describe('Link to the official application guide or portal.'),
});
type GovernmentScheme = z.infer<typeof GovernmentSchemeSchema>; // Not exported, used internally.

// Output Schema for eligible schemes
const EligibleSchemeOutputSchema = z.object({
  name: z.string().describe('The name of the eligible government scheme.'),
  benefits: z.string().describe('A summary of the benefits provided by the scheme.'),
  eligibilitySummary: z.string().describe('A concise summary of why the farmer is eligible for this scheme, based on their profile and the scheme criteria.'),
  applicationGuideLink: z.string().optional().describe('Link to the official application guide or portal.'),
});

const EligibleSchemesOutputSchema = z.object({
  eligibleSchemes: z.array(EligibleSchemeOutputSchema).describe('A list of government schemes for which the farmer is eligible.'),
});
export type EligibleSchemesOutput = z.infer<typeof EligibleSchemesOutputSchema>;

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
  output: { schema: EligibleSchemesOutputSchema },
  tools: [getGovernmentSchemes], // Making the LLM aware of the tool, though it's called in the flow.
  prompt: `You are an expert government scheme eligibility analyzer for farmers. Your task is to evaluate a farmer's profile against a list of available government agricultural schemes and determine which ones they are eligible for.

  Farmer's Profile:
  - Land Size: {{{farmerProfile.landSize}}} acres
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

  Analyze the farmer's profile against the eligibility criteria of each scheme. For each scheme the farmer is eligible for, provide the scheme's name, benefits, a concise summary of *why* they are eligible (referencing their profile details), and the application guide link if available.

  If a farmer is not eligible for any scheme, return an empty array for eligibleSchemes.
  `
});

// Define the Genkit flow
const farmerSchemeEligibilityAnalyzerFlow = ai.defineFlow(
  {
    name: 'farmerSchemeEligibilityAnalyzerFlow',
    inputSchema: FarmerProfileInputSchema,
    outputSchema: EligibleSchemesOutputSchema,
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
): Promise<EligibleSchemesOutput> {
  return farmerSchemeEligibilityAnalyzerFlow(input);
}
