'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scoreCrops } from '@/services/cropSuitabilityScorer';

const CropRecommendationSchema = z.object({
  name: z.string().describe("Common name of the crop"),
  emoji: z.string().describe("A single relevant emoji for the crop"),
  reason: z.string().describe("Agronomic reason for recommendation based on weather")
});

const SeasonalAdvisorySchema = z.object({
  seasonName: z.string().describe("Name of the season (e.g., Winter/Rabi)"),
  months: z.string().describe("Month range (e.g., Jan-Mar)"),
  recommendedCrops: z.array(CropRecommendationSchema).describe("3-4 crops that thrive in this season"),
  avoidCrops: z.array(CropRecommendationSchema).describe("1-2 crops to avoid during this window"),
  soilTip: z.string().describe("One-line advisory for soil health management"),
  confidenceScore: z.number().min(0).max(100).describe("AI confidence in the prediction"),
  agronomicBasis: z.string().describe("One-line citation of ICAR or agro-climatic logic")
});

const AiOutputSchema = z.array(SeasonalAdvisorySchema).length(4);

const CropPredictionInputSchema = z.object({
  state: z.string(),
  primaryCrop: z.string(),
  weatherData: z.array(z.any())
});

export type CropPredictionInput = z.infer<typeof CropPredictionInputSchema>;

function generateHeuristicFallback(input: CropPredictionInput): z.infer<typeof AiOutputSchema> {
  const seasons = ["Winter / Rabi", "Summer / Pre-Monsoon", "Monsoon / Kharif", "Post-Monsoon / Harvest"];
  const months = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];

  return input.weatherData.map((weather: any, idx: number) => {
    const scored = scoreCrops(weather);
    const top3 = scored.slice(0, 3);
    const bottom1 = scored.slice(-1)[0];

    return {
      seasonName: seasons[idx],
      months: months[idx],
      recommendedCrops: top3.map(c => ({ 
        name: c.cropName, 
        emoji: c.emoji, 
        reason: "Locally computed based on real-time weather tolerance (Heuristic Fallback)." 
      })),
      avoidCrops: [{ 
        name: bottom1.cropName, 
        emoji: bottom1.emoji, 
        reason: "Calculated high climate risk for this period." 
      }],
      soilTip: "Maintain organic mulch and monitor soil moisture levels regularly.",
      confidenceScore: 85,
      agronomicBasis: "Computed using ICAR-based deterministic scoring engine (AI Failover Mode)."
    };
  }) as z.infer<typeof AiOutputSchema>;
}

export const cropPredictionFlow = ai.defineFlow(
  {
    name: 'cropPredictionFlow',
    inputSchema: CropPredictionInputSchema,
    outputSchema: z.object({
      predictions: AiOutputSchema,
      weatherData: z.array(z.any())
    }),
  },
  async (input) => {
    const promptText = `
      Expert agronomist trained on ICAR guidelines for ${input.state}.
      Weather forecast: ${JSON.stringify(input.weatherData, null, 2)}
      Return JSON only.
    `;

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: promptText,
        output: { schema: AiOutputSchema }
      });
      return { predictions: response.output!, weatherData: input.weatherData };
    } catch (error) {
      // Automatic Resiliency Failover to local heuristic engine
      return { predictions: generateHeuristicFallback(input), weatherData: input.weatherData };
    }
  }
);

export async function predictCrops(input: CropPredictionInput) {
  return cropPredictionFlow(input);
}
