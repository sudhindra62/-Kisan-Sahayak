import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { config } from 'dotenv';

config();

// Default AI client using the primary GEMINI_API_KEY
export const ai = genkit({
  plugins: [googleAI()],
});

// Specialized AI client for voice services using a separate API key
export const voiceAi = genkit({
    plugins: [googleAI({
        apiKey: process.env.VOICE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    })]
});
