'use server';
/**
 * @fileOverview A Genkit flow that summarizes the key benefits and core eligibility
 * requirements of a government scheme for farmers.
 *
 * - summarizeSchemeBenefits - A function that handles the scheme summarization process.
 * - SchemeBenefitSummarizerInput - The input type for the summarizeSchemeBenefits function.
 * - SchemeBenefitSummarizerOutput - The return type for the summarizeSchemeBenefits function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SchemeBenefitSummarizerInputSchema = z.object({
  schemeName: z.string().describe('The name of the government scheme.'),
  schemeDescription: z.string().describe('The full description of the scheme.'),
  eligibilityCriteria: z
    .string()
    .describe('The detailed eligibility criteria for the scheme.'),
});
export type SchemeBenefitSummarizerInput = z.infer<
  typeof SchemeBenefitSummarizerInputSchema
>;

const SchemeBenefitSummarizerOutputSchema = z.object({
  benefitsSummary: z
    .string()
    .describe('A concise summary of the scheme\'s key benefits.'),
  eligibilitySummary: z
    .string()
    .describe('A concise summary of the scheme\'s core eligibility requirements.'),
});
export type SchemeBenefitSummarizerOutput = z.infer<
  typeof SchemeBenefitSummarizerOutputSchema
>;

export async function summarizeSchemeBenefits(
  input: SchemeBenefitSummarizerInput
): Promise<SchemeBenefitSummarizerOutput> {
  return schemeBenefitSummarizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'schemeBenefitSummarizerPrompt',
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
