'use server';
/**
 * @fileOverview Generates a final summary report for the farmer based on scheme analysis results.
 *
 * - generateFarmerSummary - A function that handles the summary generation.
 * - FarmerSummaryInput - The input type for the generateFarmerSummary function.
 * - FarmerSummaryOutput - The return type for the generateFarmerSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  FarmerProfileInputSchema,
  SchemeAnalysisOutputSchema,
} from '@/ai/schemas';

// Input Schema for the summary generator
const FarmerSummaryInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  analysisResults: SchemeAnalysisOutputSchema,
});
export type FarmerSummaryInput = z.infer<typeof FarmerSummaryInputSchema>;

// Output Schema for the generated summary
const FarmerSummaryOutputSchema = z.object({
  total_schemes_found: z.number().describe('The total count of directly matched and eligible schemes.'),
  total_estimated_benefit: z.string().describe('A summary of the potential financial benefits from all matched schemes. This should be a descriptive text, not just a number (e.g., "Access to crop insurance, credit facilities, and direct income support.").'),
  immediate_action_steps: z.array(z.string()).describe('A short, prioritized list of 2-3 immediate actions the farmer should take, like applying for the top-matched scheme.'),
  long_term_growth_suggestions: z.array(z.string()).describe('Actionable long-term suggestions for growth, often derived from the "near-miss" analysis (e.g., "Consider forming a Self-Help Group to become eligible for...").'),
  motivational_summary: z.string().describe('A brief, empowering, and motivational closing message for the farmer.'),
});
export type FarmerSummaryOutput = z.infer<typeof FarmerSummaryOutputSchema>;

export async function generateFarmerSummary(
  input: FarmerSummaryInput
): Promise<FarmerSummaryOutput> {
  return farmerSummaryGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'farmerSummaryPrompt',
  input: { schema: FarmerSummaryInputSchema },
  output: { schema: FarmerSummaryOutputSchema },
  prompt: `You are an encouraging and insightful AI farm advisor. Your task is to create a final summary report for a farmer based on their profile and the results of a government scheme analysis. The tone must be motivational and empowering.

**Farmer's Profile:**
- Land Size: {{{farmerProfile.landSize}}} acres
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}

**Scheme Analysis Results:**
- Matched Schemes: {{analysisResults.matchedSchemes.length}}
- Near Misses: {{analysisResults.nearMisses.length}}

**Instructions:**
1.  **Total Schemes Found:** Calculate the total number of schemes in \`analysisResults.matchedSchemes\`.
2.  **Total Estimated Benefit:** Analyze the \`benefits\` field of each scheme in \`analysisResults.matchedSchemes\`. Synthesize this into a compelling summary of the overall potential benefits. Do not just list them; describe the value (e.g., "significant financial protection through crop insurance, easier access to credit for farm improvements, and direct income support to stabilize your finances.").
3.  **Immediate Action Steps:** Identify the top 2-3 most impactful or easiest-to-apply-for schemes from the matched list. Create a short, actionable list of next steps. For example: "1. Prioritize applying for PM-KISAN for direct income support. 2. Secure your crops by enrolling in PMFBY before the deadline."
4.  **Long-Term Growth Suggestions:** Review the \`nearMisses\` array in the \`analysisResults\`. Use the \`improvement_suggestions\` to create a forward-looking list of strategic recommendations for the farmer's growth. For example: "Explore forming a Farmer Producer Organization (FPO) to unlock group benefits" or "Consider adopting drip irrigation to qualify for water conservation subsidies." If there are no near misses, provide general growth advice.
5.  **Motivational Summary:** Write a powerful, concise closing statement that inspires confidence and encourages the farmer to take action. It should make them feel positive about their future.

Generate the response in the required structured JSON format.
`,
});

const farmerSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'farmerSummaryGeneratorFlow',
    inputSchema: FarmerSummaryInputSchema,
    outputSchema: FarmerSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate farmer summary.');
    }
    return output;
  }
);
