'use server';
/**
 * @fileOverview An AI flow for a conversational farmer assistant chatbot.
 *
 * - getChatbotResponse - A function that handles the chatbot conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { type ChatbotInput, ChatbotInputSchema } from '@/ai/schemas';


export async function getChatbotResponse(input: ChatbotInput): Promise<string> {
  const response = await farmerAssistantChatFlow(input);
  return response;
}


const prompt = ai.definePrompt({
    name: 'farmerAssistantChatPrompt',
    input: { schema: ChatbotInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert Indian agricultural assistant AI, named 'KisanSahayak'. Your purpose is to help farmers by providing personalized, actionable advice based on their profile. You must respond in simple, easy-to-understand language. Always be supportive and encouraging.

    **CRITICAL INSTRUCTIONS:**
    1.  **Use the Farmer's Profile**: You MUST use the provided farmer profile data to tailor every response.
    2.  **Be Context-Aware**: Use the provided conversation history to understand the context and provide relevant follow-up responses.
    3.  **Prioritize Schemes**: Always prioritize recommending relevant government schemes.
    4.  **Practical Advice**: Focus on practical, actionable farming improvements.
    5.  **Safety First**: Never give advice that could be unsafe or financially risky.
    6.  **Simple Language**: Avoid jargon. Explain things clearly and simply.

    **FARMER'S PROFILE FOR THIS CONVERSATION:**
    - State: {{{farmerProfile.location.state}}}
    - District: {{{farmerProfile.location.district}}}
    - Land Size: {{{farmerProfile.landSize}}} acres (Category: {{{farmerProfile.farmerCategory}}})
    - Main Crop: {{{farmerProfile.cropType}}}
    - Irrigation Method: {{{farmerProfile.irrigationType}}}
    - Annual Income: ₹{{{farmerProfile.annualIncome}}}

    **Based on the profile and the conversation history, provide a helpful response to the user's latest message.**

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
