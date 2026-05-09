'use server';
/**
 * @fileOverview A Genkit flow that summarizes the key benefits and core eligibility
 * requirements of a government scheme for farmers.
 *
 * - summarizeSchemeBenefits - A function that handles the scheme summarization process.
 */

import { ai } from '@/ai/genkit';
import {
  type SchemeBenefitSummarizerInput,
  SchemeBenefitSummarizerInputSchema,
  type SchemeBenefitSummarizerOutput,
  SchemeBenefitSummarizerOutputSchema,
} from '@/ai/schemas';

export async function summarizeSchemeBenefits(
  input: SchemeBenefitSummarizerInput
): Promise<SchemeBenefitSummarizerOutput> {
  return schemeBenefitSummarizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'schemeBenefitSummarizerPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: SchemeBenefitSummarizerInputSchema },
  output: { schema: SchemeBenefitSummarizerOutputSchema },
  prompt: `You are an expert at summarizing government schemes for farmers. Your task is to extract the key benefits and core eligibility requirements from the provided scheme details.

Be concise and focus only on the most important information that a farmer would need to quickly understand the scheme's value and if they qualify.

Scheme Name: {{{schemeName}}}

Scheme Description:
{{{schemeDescription}}}

Eligibility Criteria:
{{{eligibilityCriteria}}}`,
});

const schemeBenefitSummarizerFlow = ai.defineFlow(
  {
    name: 'schemeBenefitSummarizerFlow',
    inputSchema: SchemeBenefitSummarizerInputSchema,
    outputSchema: SchemeBenefitSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
