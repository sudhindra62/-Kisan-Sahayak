'use server';
/**
 * @fileOverview A Genkit flow that generates a personalized step-by-step application guide for a government scheme.
 *
 * - generateSchemeApplicationGuide - A function that handles the guide generation process.
 */

import { ai } from '@/ai/genkit';
import {
  type SchemeApplicationGuideInput,
  SchemeApplicationGuideInputSchema,
  type SchemeApplicationGuideOutput,
  SchemeApplicationGuideOutputSchema,
} from '@/ai/schemas';

export async function generateSchemeApplicationGuide(
  input: SchemeApplicationGuideInput
): Promise<SchemeApplicationGuideOutput> {
  return schemeApplicationGuideGeneratorFlow(input);
}


const prompt = ai.definePrompt({
    name: 'schemeApplicationGuidePrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: SchemeApplicationGuideInputSchema },
    output: { schema: SchemeApplicationGuideOutputSchema },
    prompt: `You are an expert AI assistant who creates personalized application guides for Indian government schemes for farmers.

Your task is to generate a detailed, step-by-step application guide for the given scheme, tailored to the specific farmer's profile.

**Farmer's Profile:**
- Land Size: {{{farmerProfile.landSize}}} acres
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}
- Farmer Category: {{{farmerProfile.farmerCategory}}}

**Scheme Details:**
- Name: {{{scheme.name}}}
- Benefits: {{{scheme.benefits}}}
- Eligibility: {{{scheme.eligibilityCriteria}}}
- Official Link: {{{scheme.applicationGuideLink}}}

**Instructions:**
1.  **Analyze the farmer's profile and scheme.** Generate a guide that is highly relevant to the farmer's location (state), income level, land size, and farmer category.
2.  **Documents Required:** List the specific documents the farmer will need. Infer this based on typical government requirements (e.g., Land records, Aadhaar card, bank account details, proof of income). Mention if any documents are state-specific or category-specific (e.g. 'Small and Marginal Farmer Certificate').
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
