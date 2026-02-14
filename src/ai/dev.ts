'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/scheme-benefit-summarizer.ts';
import '@/ai/flows/farmer-scheme-eligibility-analyzer.ts';
import '@/ai/flows/scheme-application-guide-generator.ts';
import '@/ai/flows/farmer-summary-generator.ts';
