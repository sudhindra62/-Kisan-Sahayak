
'use client';

import type { FarmerProfileInput, SchemeAnalysisOutput, EligibleScheme, NearMiss } from '@/ai/schemas';
import { GovernmentSchemeSchema } from '@/ai/schemas';
import { costOfLivingMultipliers, crops, fallbackScheme, nationalSchemes, schemeTemplates } from '@/ai/database/scheme-data';
import { z } from 'genkit';


// Internal helper to shuffle arrays for realistic data generation
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function generateSchemesForState(state: string): z.infer<typeof GovernmentSchemeSchema>[] {
    const generatedSchemes: z.infer<typeof GovernmentSchemeSchema>[] = [];
    const multiplier = costOfLivingMultipliers[state] || 1.0;

    const shuffledTemplates = shuffleArray([...schemeTemplates]);
    const numStateSchemes = 10 + Math.floor(Math.random() * 5); 

    for (let i = 0; i < numStateSchemes; i++) {
      const template = shuffledTemplates[i];
      if (!template) continue;
      const shuffledCrops = shuffleArray([...crops]);
      const numCropsForScheme = 5 + Math.floor(Math.random() * 5);
      const relevantCrops = shuffledCrops.slice(0, numCropsForScheme);

      const baseSubsidy = template.baseSubsidy;
      const adjustedSubsidy = Math.round(baseSubsidy * multiplier);

      const landSizeCrit = `Eligibility depends on land holding size (Small: 0-2 acres, Medium: 2-5 acres, Large: >5 acres).`;
      const incomeCrit = `Income level is a key factor (e.g., priority for annual income < ₹1,00,000, reduced benefits for > ₹5,00,000).`;
      const cropCrit = `This scheme is applicable for farmers growing crops like ${relevantCrops.slice(0, 3).join(', ')}, and other related crops.`;
      
      const scheme: z.infer<typeof GovernmentSchemeSchema> = {
        name: `${state} ${template.category}`,
        benefits: `${template.benefits}`,
        eligibilityCriteria: `${cropCrit} ${landSizeCrit} ${incomeCrit}`,
        scheme_category: template.category,
        base_subsidy_amount: adjustedSubsidy,
      };
      generatedSchemes.push(scheme);
    }

    nationalSchemes.forEach(s => {
        generatedSchemes.push({
            ...s,
            scheme_category: 'National',
            base_subsidy_amount: s.name.includes('PM-KISAN') ? 6000 : 20000
        });
    });
    
    generatedSchemes.push({
        ...fallbackScheme,
        scheme_category: 'Fallback',
        base_subsidy_amount: 5000
    });

    return generatedSchemes;
}

export function analyzeSchemesOffline(farmerProfile: FarmerProfileInput): SchemeAnalysisOutput {
    const allSchemes = generateSchemesForState(farmerProfile.location.state);
    const eligibleSchemes: EligibleScheme[] = [];

    allSchemes.forEach(scheme => {
        let isEligible = true;
        let explanation = `This scheme is a potential match based on your profile in ${farmerProfile.location.state}.`;

        // Simplified rule-based filtering
        if (farmerProfile.annualIncome > 500000) {
            if (!['Export Promotion Support', 'Machinery Purchase Subsidy', 'Storage Infrastructure Aid'].includes(scheme.scheme_category || '')) {
                isEligible = false;
            }
        }

        if (farmerProfile.cropType.toLowerCase() && scheme.eligibilityCriteria.toLowerCase().includes('crops like')) {
            if (!scheme.eligibilityCriteria.toLowerCase().includes(farmerProfile.cropType.toLowerCase())) {
                // A very basic check. The AI version was semantic.
                isEligible = false;
            }
        }
        
        if (isEligible) {
            let adjustedSubsidy = scheme.base_subsidy_amount || 0;
            if (farmerProfile.farmerCategory === 'Small and Marginal') {
                adjustedSubsidy *= 1.20;
                 explanation = `As a small farmer in ${farmerProfile.location.state}, you get a higher benefit for this scheme.`
            } else if (farmerProfile.farmerCategory === 'Large') {
                adjustedSubsidy *= 0.85;
                explanation = `The subsidy for this scheme is adjusted for your larger land holding.`
            }

            eligibleSchemes.push({
                scheme_name: scheme.name,
                adjusted_subsidy_amount: `₹${Math.round(adjustedSubsidy).toLocaleString('en-IN')}`,
                scheme_category: scheme.scheme_category || 'General',
                benefits: scheme.benefits,
                eligibilityCriteria: scheme.eligibilityCriteria,
                applicationGuideLink: scheme.applicationGuideLink,
                explanation: explanation
            });
        }
    });

    // Sort and limit results
    const sortedSchemes = eligibleSchemes.sort((a,b) => {
        const amountA = Number(a.adjusted_subsidy_amount.replace(/[^0-9.-]+/g,""));
        const amountB = Number(b.adjusted_subsidy_amount.replace(/[^0-9.-]+/g,""));
        return amountB - amountA;
    }).slice(0, 7);


    if (sortedSchemes.length === 0) {
         sortedSchemes.push({
            scheme_name: fallbackScheme.name,
            adjusted_subsidy_amount: '₹5,000',
            scheme_category: 'Fallback',
            benefits: fallbackScheme.benefits,
            eligibilityCriteria: fallbackScheme.eligibilityCriteria,
            explanation: "Because no specific schemes matched your profile, this universal scheme is available as a general support option.",
            applicationGuideLink: undefined
        });
    }

    // Near misses are too complex for offline logic, return empty.
    const nearMisses: NearMiss[] = [];

    return {
        eligible_schemes: sortedSchemes,
        nearMisses,
    };
}

export function checkReadinessOffline(selectedDocs: string[]): DocumentReadinessOutput {
    const requiredForMostSchemes = [
      'Aadhaar Card',
      'Land Ownership Documents (e.g., 7/12 extract, RoR)',
      'Income Certificate',
      'Passport Size Photograph',
    ];
    
    const missingDocs = requiredForMostSchemes.filter(doc => !selectedDocs.includes(doc));
    
    const readinessResults: DocumentReadinessOutput = {
        missing_documents: missingDocs,
        optional_alternatives: missingDocs.length > 0 ? [
            'Ensure all names on documents match exactly.',
            'For land records, visit your local Tehsil or Taluk office.',
            'Income certificates can be obtained from the District Magistrate\'s office or local revenue department.'
        ] : [],
        readiness_status: missingDocs.length === 0 ? 'Ready to Apply' : (missingDocs.length <= 2 ? 'Almost Ready' : 'Missing Key Documents')
    };

    return readinessResults;
}
