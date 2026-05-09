'use server';
/**
 * @fileOverview An AI flow to "extract" (simulate deep scanning) data from uploaded PDFs for the subsidy report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  ExtractedDocumentDataSchema,
  FarmerProfileInputSchema,
} from '@/ai/schemas';

const DocumentExtractionInputSchema = z.object({
    farmerProfile: FarmerProfileInputSchema,
    fileNames: z.array(z.string()).describe("List of uploaded file names to simulate scan"),
});

export async function extractDocumentData(input: z.infer<typeof DocumentExtractionInputSchema>) {
  return documentDataExtractorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentDataExtractorPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: DocumentExtractionInputSchema },
  output: { schema: ExtractedDocumentDataSchema },
  prompt: `You are an expert AI document auditor for the Indian Ministry of Agriculture. 
You are performing a "virtual scan" of the following uploaded documents:
{{#each fileNames}}
- {{{this}}}
{{/each}}

Based on these files and the farmer's profile:
State: {{{farmerProfile.location.state}}}
District: {{{farmerProfile.location.district}}}
Land: {{{farmerProfile.landSize}}} acres

Instructions:
1. Generate realistic, unique certificate IDs that look official for the state of {{{farmerProfile.location.state}}}.
2. Identify the likely Issuing Authority (e.g., "Tehsil Office, {{{farmerProfile.location.district}}}").
3. Create a list of 5-8 "Extracted Lines" that look like they were pulled directly from a OCR scan of a government PDF (e.g., "Land Parcel ID: MH-2024-XXXX", "Verified by: Talathi", "Total Holding: {{{farmerProfile.landSize}}}").
4. Ensure the confidence is high (>0.9).

The output must be structured JSON.`,
});

const documentDataExtractorFlow = ai.defineFlow(
  {
    name: 'documentDataExtractorFlow',
    inputSchema: DocumentExtractionInputSchema,
    outputSchema: ExtractedDocumentDataSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to extract document data.');
    }
    return output;
  }
);
