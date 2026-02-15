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
  async (input) => {
    const { media } = await voiceAi.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // A standard, clear voice. Others include 'Algenib', 'Achernar', etc.
            prebuiltVoiceConfig: { voiceName: 'Chara' },
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
  }
);
