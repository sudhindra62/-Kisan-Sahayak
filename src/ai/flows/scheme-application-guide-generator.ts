'use server';
/**
 * @fileOverview A Genkit flow that generates a personalized step-by-step application guide for a government scheme.
 *
 * - generateSchemeApplicationGuide - A function that handles the guide generation process.
 * - SchemeApplicationGuideInput - The input type for the generateSchemeApplicationGuide function.
 * - SchemeApplicationGuideOutput - The return type for the generateSchemeApplicationGuide function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for the guide generator
const SchemeApplicationGuideInputSchema = z.object({
  farmerProfile: z.object({
      landSize: z.number(),
      location: z.object({
          state: z.string(),
          district: z.string(),
      }),
      cropType: z.string(),
      irrigationType: z.string(),
      annualIncome: z.number(),
  }),
  scheme: z.object({
    name: z.string(),
    benefits: z.string(),
    eligibilityCriteria: z.string(),
    applicationGuideLink: z.string().optional(),
  }),
});
export type SchemeApplicationGuideInput = z.infer<typeof SchemeApplicationGuideInputSchema>;

// Output Schema for the generated guide
const SchemeApplicationGuideOutputSchema = z.object({
    schemeName: z.string().describe('The name of the government scheme.'),
    documentsRequired: z.array(z.string()).describe('A list of documents the farmer will likely need to apply.'),
    applicationSteps: z.array(z.object({
        step: z.number(),
        title: z.string(),
        description: z.string(),
        isOnline: z.boolean().describe('Whether this step is for an online or offline process.')
    })).describe('A step-by-step guide for both online and offline application processes.'),
    estimatedTimeline: z.string().describe('An estimated timeline for scheme approval, from application to receiving benefits.'),
    commonMistakes: z.array(z.string()).describe('A list of common mistakes to avoid during the application process.'),
    contactAuthority: z.string().describe('The name and contact details (if available) of the local authority to contact for help.'),
});
export type SchemeApplicationGuideOutput = z.infer<typeof SchemeApplicationGuideOutputSchema>;

export async function generateSchemeApplicationGuide(
  input: SchemeApplicationGuideInput
): Promise<SchemeApplicationGuideOutput> {
  return schemeApplicationGuideGeneratorFlow(input);
}


const prompt = ai.definePrompt({
    name: 'schemeApplicationGuidePrompt',
    input: { schema: SchemeApplicationGuideInputSchema },
    output: { schema: SchemeApplicationGuideOutputSchema },
    prompt: `You are an expert AI assistant who creates personalized application guides for Indian government schemes for farmers.

Your task is to generate a detailed, step-by-step application guide for the given scheme, tailored to the specific farmer's profile.

**Farmer's Profile:**
- Land Size: {{{farmerProfile.landSize}}} acres
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}

**Scheme Details:**
- Name: {{{scheme.name}}}
- Benefits: {{{scheme.benefits}}}
- Eligibility: {{{scheme.eligibilityCriteria}}}
- Official Link: {{{scheme.applicationGuideLink}}}

**Instructions:**
1.  **Analyze the farmer's profile and scheme.** Generate a guide that is highly relevant to the farmer's location (state), income level, and land size.
2.  **Documents Required:** List the specific documents the farmer will need. Infer this based on typical government requirements (e.g., Land records, Aadhaar card, bank account details, proof of income). Mention if any documents are state-specific.
3.  **Application Steps:** Provide a clear, step-by-step process.
    - Include *both* online (via official portal) and offline (visiting a local office like Krishi Vigyan Kendra, Common Service Center (CSC), or district agriculture office) application methods if they exist. Mark each step as online or offline.
    - Be specific (e.g., "Visit the official PM-KISAN portal at... and click on 'New Farmer Registration'").
4.  **Estimated Timeline:** Give a realistic estimate for the approval process (e.g., "3-4 weeks for verification and approval").
5.  **Common Mistakes:** List common pitfalls to avoid (e.g., "Incorrectly filled bank details," "Uploading unclear document scans," "Missing the application deadline").
6.  **Contact Authority:** Identify the most relevant local authority for the farmer to contact for assistance (e.g., "Your local District Agriculture Officer or the nearest Common Service Center (CSC)").

Generate the response in the required structured JSON format. Ensure the language is simple and easy for a farmer to understand.
`,
});


const schemeApplicationGuideGeneratorFlow = ai.defineFlow(
  {
    name: 'schemeApplicationGuideGeneratorFlow',
    inputSchema: SchemeApplicationGuideInputSchema,
    outputSchema: SchemeApplicationGuideOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('Failed to generate application guide.');
    }

    return {
        ...output,
        schemeName: input.scheme.name,
    };
  }
);
