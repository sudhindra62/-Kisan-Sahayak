'use server';
/**
 * @fileOverview An AI flow to check a farmer's document readiness for applying to government schemes.
 *
 * - checkDocumentReadiness - A function that handles the document readiness check.
 * - DocumentReadinessInput - The input type for the checkDocumentReadiness function.
 * - DocumentReadinessOutput - The return type for the checkDocumentReadiness function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  DocumentReadinessInputSchema,
  DocumentReadinessOutputSchema,
} from '@/ai/schemas';

export type DocumentReadinessInput = z.infer<
  typeof DocumentReadinessInputSchema
>;
export type DocumentReadinessOutput = z.infer<
  typeof DocumentReadinessOutputSchema
>;

export async function checkDocumentReadiness(
  input: DocumentReadinessInput
): Promise<DocumentReadinessOutput> {
  return documentReadinessCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentReadinessPrompt',
  input: { schema: DocumentReadinessInputSchema },
  output: { schema: DocumentReadinessOutputSchema },
  prompt: `You are an expert AI assistant for Indian farmers, specializing in documentation requirements for government schemes.

Your task is to analyze the documents a farmer has against the requirements of the schemes they are eligible for.

**Farmer's Available Documents:**
{{#each userDocuments}}
- {{{this}}}
{{/each}}

**Matched Schemes and their Eligibility Criteria:**
{{#each matchedSchemes}}
---
Scheme Name: {{{this.name}}}
Eligibility: {{{this.eligibilityCriteria}}}
{{/each}}

**Instructions:**
1.  **Identify All Required Documents:** Based on the eligibility criteria of all matched schemes, infer a comprehensive list of all likely required documents. Common documents include 'Aadhaar Card', 'Land Ownership Records (like 7/12 extract or RoR)', 'Income Certificate', 'Voter ID Card', and 'Passport Size Photograph'. Use the scheme details to find specific requirements.
2.  **Identify Missing Documents:** Compare the list of required documents with the farmer's list of available documents. Create a list of all documents that are required but missing.
3.  **Suggest Alternatives:** For the missing documents, suggest common, officially acceptable alternatives. For example, a 'Voter ID Card' or 'Ration Card' can sometimes be used as proof of identity or address. Provide these as helpful tips.
4.  **Determine Readiness Status:** Based on the analysis, provide a clear readiness status.
    - If all key documents are present, the status should be "Ready to Apply".
    - If some non-critical documents are missing, use "Almost Ready".
    - If critical documents (like identity, address, or land records) are missing, use "Missing Key Documents".
5.  **Provide Guidance (within optional_alternatives):** For each alternative suggested, briefly explain how to obtain the missing document (e.g., "Land records can be obtained from the local Tehsil or Taluk office.").

Generate the response in the required structured JSON format. The language must be simple and actionable.
`,
});

const documentReadinessCheckerFlow = ai.defineFlow(
  {
    name: 'documentReadinessCheckerFlow',
    inputSchema: DocumentReadinessInputSchema,
    outputSchema: DocumentReadinessOutputSchema,
  },
  async (input) => {
    if (input.userDocuments.length === 0) {
      return {
        missing_documents: [
          'No documents were selected. Please select the documents you have.',
        ],
        optional_alternatives: [],
        readiness_status: 'Please select documents',
      };
    }
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to check document readiness.');
    }
    return output;
  }
);

    