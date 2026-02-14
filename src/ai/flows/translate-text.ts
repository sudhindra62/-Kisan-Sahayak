'use server';
/**
 * @fileOverview An AI flow to translate text into a specified language.
 *
 * - translateText - A function that handles the translation.
 */

import { ai } from '@/ai/genkit';
import {
  type TranslateTextInput,
  TranslateTextInputSchema,
  type TranslateTextOutput,
  TranslateTextOutputSchema,
} from '@/ai/schemas';

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `You are a highly skilled translation engine.
Translate the following text into {{{targetLanguage}}}.
Provide ONLY the translated text as the output, with no additional explanation or preamble.

Text to translate:
"{{{text}}}"
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to translate text.');
    }
    return output;
  }
);
