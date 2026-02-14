'use server';
/**
 * @fileOverview An AI flow to predict upcoming government schemes that may be relevant to a farmer.
 *
 * - predictUpcomingSchemes - A function that handles the prediction analysis.
 * - FarmerProfileInput - The input type for the function.
 * - PredictiveAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  FarmerProfileInputSchema,
  PredictiveAnalysisOutputSchema,
} from '@/ai/schemas';

export type FarmerProfileInput = z.infer<typeof FarmerProfileInputSchema>;
export type PredictiveAnalysisOutput = z.infer<
  typeof PredictiveAnalysisOutputSchema
>;

export async function predictUpcomingSchemes(
  input: FarmerProfileInput
): Promise<PredictiveAnalysisOutput> {
  return predictiveSchemeAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveSchemePrompt',
  input: { schema: FarmerProfileInputSchema },
  output: { schema: PredictiveAnalysisOutputSchema },
  prompt: `You are an expert agricultural policy analyst in India with predictive capabilities. Your task is to forecast potential government schemes that could become relevant to a farmer in the next 6 months.

Analyze the farmer's profile considering the following factors for your prediction:
- **Seasonal Trends:** Consider the current time of year and the upcoming crop seasons (Kharif, Rabi). For example, if it's pre-monsoon, Kharif-related sowing schemes are likely. If it's post-harvest, procurement or storage schemes might be announced.
- **Crop Type:** Certain schemes are tied to specific crops (e.g., subsidies for pulses, insurance for cash crops).
- **State Policies:** The farmer's state is a major factor. States often have their own schemes or run central schemes with specific timing. Your knowledge should include general tendencies of state agricultural departments.
- **Historical Patterns:** Base your predictions on common patterns of government scheme announcements (e.g., drought relief after a poor monsoon, new schemes announced around the budget).

**Farmer's Profile:**
- Land Size: {{{landSize}}} acres
- Location: State - {{{location.state}}}, District - {{{location.district}}}
- Crop Type: {{{cropType}}}
- Irrigation Type: {{{irrigationType}}}
- Annual Income: {{{annualIncome}}}

**Instructions:**
1.  Generate 2-3 high-probability predictions. Do not list existing, always-available schemes like PM-KISAN unless there's a reason to expect a specific, time-bound update (e.g., "a new registration window is likely to open").
2.  For each prediction, provide a \`predicted_scheme_category\`. This should be a general category, not a specific scheme name (e.g., "Kharif Crop Insurance Support", "Drought Relief Package", "Post-Harvest Storage Subsidy").
3.  Estimate the \`probability_of_relevance\` as 'High', 'Medium', or 'Low'.
4.  Provide clear \`reasoning\` for your prediction, connecting it to the farmer's profile and the factors mentioned above.
5.  Offer concise \`preparation_advice\`. This should be practical advice for the farmer (e.g., "Keep an eye on the state agriculture portal around June," "Ensure your land records are updated," "Prepare digital copies of your Aadhaar and bank passbook.").

Generate the response in the required structured JSON format. Focus on predictive insights, not just listing existing schemes.
`,
});

const predictiveSchemeAnalyzerFlow = ai.defineFlow(
  {
    name: 'predictiveSchemeAnalyzerFlow',
    inputSchema: FarmerProfileInputSchema,
    outputSchema: PredictiveAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate scheme predictions.');
    }
    return output;
  }
);
