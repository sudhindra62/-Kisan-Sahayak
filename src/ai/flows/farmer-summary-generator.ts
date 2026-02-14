'use server';
/**
 * @fileOverview Generates a final summary report for the farmer based on scheme analysis results.
 *
 * - generateFarmerSummary - A function that handles the summary generation.
 */

import { ai } from '@/ai/genkit';
import {
  type FarmerSummaryInput,
  FarmerSummaryInputSchema,
  type FarmerSummaryOutput,
  FarmerSummaryOutputSchema,
} from '@/ai/schemas';

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
- Farmer Category: {{{farmerProfile.farmerCategory}}}
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}

**Scheme Analysis Results:**
- Matched Schemes: {{analysisResults.eligible_schemes.length}}
- Near Misses: {{analysisResults.nearMisses.length}}

**Instructions:**
1.  **Total Schemes Found:** Calculate the total number of schemes in \`analysisResults.eligible_schemes\`.
2.  **Total Estimated Benefit:** Analyze the \`benefits\` field of each scheme in \`analysisResults.eligible_schemes\`. Synthesize this into a compelling summary of the overall potential benefits. Do not just list them; describe the value (e.g., "significant financial protection through crop insurance, easier access to credit for farm improvements, and direct income support to stabilize your finances.").
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
