'use server';
/**
 * @fileOverview An AI flow for a conversational farmer assistant chatbot.
 *
 * - getChatbotResponse - A function that handles the chatbot conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  type ChatbotInput,
  ChatbotInputSchema,
  FarmerProfileInputSchema,
  CentralReliefSchemeSchema,
} from '@/ai/schemas';
import { centralReliefSchemes } from '@/ai/database/central-schemes';

export async function getChatbotResponse(input: ChatbotInput): Promise<string> {
  const response = await farmerAssistantChatFlow(input);
  return response;
}

const findCentralReliefScheme = ai.defineTool(
  {
    name: 'findCentralReliefScheme',
    description:
      'Finds relevant central government relief schemes for a farmer facing distress like crop damage or financial hardship.',
    inputSchema: z.object({
      farmerProfile: FarmerProfileInputSchema,
      userQuery: z.string().describe("The user's message indicating distress."),
    }),
    outputSchema: z.array(CentralReliefSchemeSchema),
  },
  async ({ farmerProfile, userQuery }) => {
    const query = userQuery.toLowerCase();
    const distressKeywords = [
      'damage',
      'loss',
      'flood',
      'drought',
      'disaster',
      'emergency',
      'help',
      'stress',
      'low income',
      'rejected',
    ];

    const isDistressQuery = distressKeywords.some((keyword) =>
      query.includes(keyword)
    );
    if (!isDistressQuery) {
      return [];
    }

    const relevantSchemes = centralReliefSchemes.filter((scheme) => {
      // Land size check
      const landSize = farmerProfile.landSize;
      if (
        landSize < scheme.eligibility_land_min ||
        landSize > scheme.eligibility_land_max
      ) {
        return false;
      }

      // Damage type check (if applicable)
      if (scheme.eligible_damage_types.length > 0) {
        const hasDamageMatch = scheme.eligible_damage_types.some((type) =>
          query.includes(type.toLowerCase())
        );
        if (!hasDamageMatch) return false;
      }

      return true;
    });

    // Sort by priority (e.g., smaller landholders first) and then by amount
    relevantSchemes.sort((a, b) => {
      if (a.eligibility_land_max < b.eligibility_land_max) return -1;
      if (a.eligibility_land_max > b.eligibility_land_max) return 1;
      return b.base_compensation_amount - a.base_compensation_amount;
    });

    return relevantSchemes.slice(0, 2); // Return top 2 matches
  }
);

const prompt = ai.definePrompt({
  name: 'farmerAssistantChatPrompt',
  model: 'googleai/gemini-2.5-flash',
  tools: [findCentralReliefScheme],
  input: { schema: ChatbotInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert Indian agricultural assistant AI, named 'KisanSahayak'. Your purpose is to help farmers by providing personalized, actionable advice based on their profile. You must respond in simple, easy-to-understand language. Always be supportive and encouraging.

    **CRITICAL INSTRUCTIONS:**
    1.  **Use the Farmer's Profile**: You MUST use the provided farmer profile data to tailor every response.
    2.  **Be Context-Aware**: Use the provided conversation history to understand the context and provide relevant follow-up responses.
    3.  **Prioritize Schemes**: Always prioritize recommending relevant government schemes.
    4.  **Handle Distress Situations**: If the user's message indicates crop damage (e.g., from flood, drought, pests), financial distress, application rejection, or asks for emergency help, you MUST use the \`findCentralReliefScheme\` tool to find a suitable national relief program. Based on the tool's output, suggest 1-2 of the most relevant schemes and provide a clear, supportive explanation. Do not overwhelm the farmer.
    5.  **Practical Advice**: Focus on practical, actionable farming improvements.
    6.  **Safety First**: Never give advice that could be unsafe or financially risky.
    7.  **Simple Language**: Avoid jargon. Explain things clearly and simply.

    **FARMER'S PROFILE FOR THIS CONVERSATION:**
    - State: {{{farmerProfile.location.state}}}
    - District: {{{farmerProfile.location.district}}}
    - Land Size: {{{farmerProfile.landSize}}} acres (Category: {{{farmerProfile.farmerCategory}}})
    - Main Crop: {{{farmerProfile.cropType}}}
    - Irrigation Method: {{{farmerProfile.irrigationType}}}
    - Annual Income: ₹{{{farmerProfile.annualIncome}}}

    **Based on the profile, the conversation history, and any tool outputs, provide a helpful response to the user's latest message.**

    **User's Message:**
    "{{{message}}}"
    `,
});

const farmerAssistantChatFlow = ai.defineFlow(
  {
    name: 'farmerAssistantChatFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.text;
  }
);
