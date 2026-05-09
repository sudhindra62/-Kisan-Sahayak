
'use server';
/**
 * @fileOverview An AI flow to convert text into speech.
 *
 * - textToSpeech - A function that handles the TTS conversion.
 */

import { ai, voiceAi } from '@/ai/genkit';
import {
  type TextToSpeechInput,
  TextToSpeechInputSchema,
  type TextToSpeechOutput,
  TextToSpeechOutputSchema,
} from '@/ai/schemas';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

function formatTtsError(error: any): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Log the full technical error on the server for debugging purposes.
    console.error(`[TTS Flow Error]: ${errorMessage}`);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        return 'The voice service is currently experiencing high demand. Please try again in a moment.';
    }
    if (errorMessage.toLowerCase().includes('api key')) {
        return 'The API key for the voice service is missing or invalid. Please check your server configuration.';
    }
    if (errorMessage.includes('No audio media was returned')) {
        return 'The AI service did not return any audio. This may be a temporary issue.';
    }
    if (errorMessage.includes('Input text cannot be empty')) {
        return 'Cannot generate audio from an empty message.';
    }

    // A generic, but still informative, fallback for other types of errors.
    return 'An unexpected error occurred while generating audio. Please try again later.';
}


export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input): Promise<TextToSpeechOutput> => {
    try {
      if (!process.env.VOICE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        throw new Error(
          'API key not configured on the server.'
        );
      }

      if (!input.text) {
        throw new Error('Input text cannot be empty.');
      }

      const { media } = await voiceAi.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: input.text,
      });

      if (!media || !media.url) {
        throw new Error('No audio media was returned from the TTS service.');
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavBase64 = await toWav(audioBuffer);

      return {
        audioData: 'data:audio/wav;base64,' + wavBase64,
      };
    } catch (e) {
      const userFriendlyError = formatTtsError(e);
      return { audioData: '', error: userFriendlyError };
    }
  }
);
