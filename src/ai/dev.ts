'use server';
/**
 * @fileOverview Entry point for Genkit dev UI. 
 * Next.js automatically loads variables from .env
 */

import '@/ai/flows/scheme-benefit-summarizer.ts';
import '@/ai/flows/farmer-scheme-eligibility-analyzer.ts';
import '@/ai/flows/scheme-application-guide-generator.ts';
import '@/ai/flows/farmer-summary-generator.ts';
import '@/ai/flows/document-readiness-checker.ts';
import '@/ai/flows/predictive-scheme-analyzer.ts';
import '@/ai/flows/farmer-assistant-chat.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/document-data-extractor.ts';
import '@/ai/flows/crop-advisor-flow.ts';
import '@/ai/database/central-schemes.ts';
