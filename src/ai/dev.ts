'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/scheme-benefit-summarizer.ts';
import '@/ai/flows/farmer-scheme-eligibility-analyzer.ts';
import '@/ai/flows/scheme-application-guide-generator.ts';
import '@/ai/flows/farmer-summary-generator.ts';
import '@/ai/flows/document-readiness-checker.ts';
import '@/ai/flows/predictive-scheme-analyzer.ts';
import '@/ai/flows/farmer-assistant-chat.ts';
import '@/ai/database/central-schemes.ts';

    
