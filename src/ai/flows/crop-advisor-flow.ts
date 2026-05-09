'use server';
/**
 * @fileOverview An AI flow to predict seasonal weather and provide crop advisory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CropAdvisorInputSchema, CropAdvisorOutputSchema } from '@/ai/schemas';

export async function getCropForecast(input: z.infer<typeof CropAdvisorInputSchema>) {
  return cropAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cropAdvisorPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: CropAdvisorInputSchema },
  output: { schema: CropAdvisorOutputSchema },
  prompt: `You are an expert agricultural climate scientist specializing in Indian farming cycles. 
Provide a detailed 12-month seasonal forecast for a farmer in the state of {{{state}}} who primarily grows {{{primaryCrop}}}.

Instructions:
1. Divide the year into four distinct seasons:
   - Jan-Mar (Winter/Rabi)
   - Apr-Jun (Pre-Monsoon/Summer)
   - Jul-Sep (Monsoon/Kharif)
   - Oct-Dec (Post-Monsoon/Harvest)

2. For each season, predict realistic weather conditions based on historical patterns in {{{state}}}.
3. Recommend 3-4 crops with emojis (e.g., "Wheat 🌾") that thrive in that specific season and state.
4. Suggest 1-2 crops to avoid during that time.
5. Provide a one-line soil health tip (e.g., "Increase organic mulch to retain winter moisture").
6. Ensure each season has a confidence score between 75-95.
7. Assign an appropriate icon (snowflake, sun, cloud-rain, or leaf) for each season.

The output must be a valid JSON object matching the requested schema.`,
});

const cropAdvisorFlow = ai.defineFlow(
  {
    name: 'cropAdvisorFlow',
    inputSchema: CropAdvisorInputSchema,
    outputSchema: CropAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate crop forecast.');
    }
    return output;
  }
);
