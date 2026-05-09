import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Default AI client using the primary GEMINI_API_KEY
// Next.js automatically loads variables from .env
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// Specialized AI client for voice services using a separate API key
export const voiceAi = genkit({
    plugins: [googleAI({
        apiKey: process.env.VOICE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    })]
});
