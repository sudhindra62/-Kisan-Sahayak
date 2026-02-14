'use server';
/**
 * @fileOverview Analyzes a farmer's profile against a programmatically generated database of government schemes to determine eligibility.
 *
 * - analyzeFarmerSchemeEligibility - A function that handles the scheme eligibility analysis process.
 * - FarmerProfileInput - The input type for the analyzeFarmerSchemeEligibility function.
 * - SchemeAnalysisOutput - The return type for the analyzeFarmerSchemeEligibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FarmerProfileInputSchema, GovernmentSchemeSchema, SchemeAnalysisOutputSchema } from '@/ai/schemas';
import { costOfLivingMultipliers, crops, fallbackScheme, nationalSchemes, schemeTemplates } from '@/ai/database/scheme-data';

// Input Schema for farmer's profile
export type FarmerProfileInput = z.infer<typeof FarmerProfileInputSchema>;
// Output Schema for the analysis
export type SchemeAnalysisOutput = z.infer<typeof SchemeAnalysisOutputSchema>;

// Internal helper to shuffle arrays for realistic data generation
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}


// Define the tool to dynamically generate government schemes for a given state.
const getGovernmentSchemes = ai.defineTool(
  {
    name: 'getGovernmentSchemes',
    description: 'Generates a realistic, programmatically created list of government agricultural schemes for a specific state, including national and fallback schemes.',
    inputSchema: z.object({
      state: z.string().describe("The farmer's state, used to generate state-specific schemes."),
    }),
    outputSchema: z.array(GovernmentSchemeSchema),
  },
  async ({ state }) => {
    const generatedSchemes: z.infer<typeof GovernmentSchemeSchema>[] = [];
    const multiplier = costOfLivingMultipliers[state] || 1.0;

    // 1. Generate state-specific schemes
    const shuffledTemplates = shuffleArray([...schemeTemplates]);
    // Each state gets at least 10 schemes, up to 14
    const numStateSchemes = 10 + Math.floor(Math.random() * 5); 

    for (let i = 0; i < numStateSchemes; i++) {
      const template = shuffledTemplates[i];
      const shuffledCrops = shuffleArray([...crops]);
      // Each scheme applies to 5-9 crops
      const numCropsForScheme = 5 + Math.floor(Math.random() * 5);
      const relevantCrops = shuffledCrops.slice(0, numCropsForScheme);

      const baseSubsidy = template.baseSubsidy;
      const adjustedSubsidy = Math.round(baseSubsidy * multiplier);

      // Create dynamic eligibility criteria text for the AI to parse
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

    // 2. Add all national schemes to the list
    nationalSchemes.forEach(s => {
        generatedSchemes.push({
            ...s,
            scheme_category: 'National',
            base_subsidy_amount: s.name.includes('PM-KISAN') ? 6000 : 20000 // estimate
        });
    });
    
    // 3. Add the ultimate fallback scheme
    generatedSchemes.push({
        ...fallbackScheme,
        scheme_category: 'Fallback',
        base_subsidy_amount: 5000
    });

    return generatedSchemes;
  }
);

// Define the prompt that uses the dynamically generated schemes and the farmer's profile
const farmerSchemeEligibilityPrompt = ai.definePrompt({
  name: 'farmerSchemeEligibilityPrompt',
  input: {
    schema: z.object({
      farmerProfile: FarmerProfileInputSchema,
      schemes: z.array(GovernmentSchemeSchema),
    }),
  },
  output: { schema: SchemeAnalysisOutputSchema },
  prompt: `You are a hyper-intelligent AI assistant for Indian agriculture, with deep expertise in government schemes. Your task is to act as the complete backend logic for finding and tailoring schemes for a farmer. You MUST follow all rules precisely.

**Farmer's Profile:**
- Land Size: {{{farmerProfile.landSize}}} acres
- Farmer Category: {{{farmerProfile.farmerCategory}}}
- Location: State - {{{farmerProfile.location.state}}}, District - {{{farmerProfile.location.district}}}
- Crop Type: {{{farmerProfile.cropType}}}
- Irrigation Type: {{{farmerProfile.irrigationType}}}
- Annual Income: {{{farmerProfile.annualIncome}}}

**Available Government Schemes for {{{farmerProfile.location.state}}}:**
{{#each schemes}}
---
- Scheme Name: {{{this.name}}}
- Category: {{{this.scheme_category}}}
- Base Subsidy: {{{this.base_subsidy_amount}}}
- Benefits: {{{this.benefits}}}
- Eligibility Rules: {{{this.eligibilityCriteria}}}
- Official Link: {{{this.applicationGuideLink}}}
{{/each}}

**RULEBOOK: You MUST follow these steps in order.**

**STEP 1: Filter by Core Eligibility**
- **Income Filtering:**
  - If income > ₹5,00,000, the farmer is ONLY eligible for schemes in categories like 'Export Promotion Support', 'Machinery Purchase Subsidy', and 'Storage Infrastructure Aid'. Discard all other schemes for this farmer.
  - Schemes in the 'Small Land Holding Bonus Scheme' or 'Women Farmer Support Scheme' categories are generally for income < ₹2,50,000.
- **Semantic Crop Matching:** Analyze the farmer's \`cropType\`. Match it against the \`Eligibility Rules\` of each scheme. Use semantic understanding (e.g., 'paddy' is 'rice', 'groundnut' is a type of 'oilseed'). Handle spelling mistakes. A scheme is a potential match if the farmer's crop is mentioned, implied, or belongs to a category of crops mentioned.

**STEP 2: Calculate Eligibility Score & Adjusted Subsidy**
For each potentially matched scheme from STEP 1, calculate the following:

- **Land Size Adjustment (on Base Subsidy):**
  - Small Farmer (0-2 acres): Increase base subsidy by 20%. They get higher priority.
  - Medium Farmer (2-5 acres): Use standard base subsidy.
  - Large Farmer (5+ acres): Decrease base subsidy by 15%.
- **Final Adjusted Subsidy:** This is the \`base_subsidy_amount\` after applying the Land Size Adjustment. Format it as a currency string '₹X,XXX'.
- **Eligibility Score (0-100):**
  - Start with a base score of 60 for any match from STEP 1.
  - **Crop relevance:** +20 for a direct, exact crop match. +10 for a strong semantic match.
  - **Income priority:** +10 if income is < ₹1,00,000 and the scheme is a support/subsidy type.
  - **Land size priority:** +10 if the farmer's category is 'Small and Marginal' and the scheme is a 'Small Land Holding Bonus Scheme' or similar.
  - **Irrigation Bonus:** +20 for 'Rainfed' farmers for schemes like 'Rainfed Farming Support' or 'Irrigation Equipment Subsidy'. +10 for 'Well' or 'Canal' farmers for 'High Yield Crop Incentive' schemes.
  - Cap the total score at 100.

**STEP 3: Rank and Select Top Schemes**
- Discard any scheme with a final \`eligibility_score\` below 55.
- Rank the remaining schemes from highest score to lowest.
- Select the top 5-7 schemes to present to the user.

**STEP 4: Handle "No Match" Scenario (CRITICAL)**
- **If, after all filtering, the list of eligible schemes is empty, you MUST NOT return an empty array.**
- **First Fallback:** Find the most relevant *National Scheme* from the provided list (PM-KISAN, PMFBY, KCC). Pick the one that best fits the farmer's general profile.
- **Second Fallback:** If even national schemes seem irrelevant, return the "Universal Farmer Development Scheme".
- When using a fallback, generate a single entry. Set \`eligibility_score\` to 50, calculate a basic \`adjusted_subsidy_amount\`, and write an \`explanation\` that clearly states this is a generally available scheme because no specific matches were found.

**STEP 5: Generate Final Output Structure**
For each of the final selected schemes (including fallbacks), create an object with:
- \`scheme_name\`: The scheme's name.
- \`adjusted_subsidy_amount\`: The final calculated and formatted subsidy.
- \`eligibility_score\`: The final score (0-100).
- \`scheme_category\`: The scheme's category.
- \`benefits\`: The original benefits text.
- \`eligibilityCriteria\`: The original eligibility criteria text.
- \`applicationGuideLink\`: The original link, if it exists.
- \`explanation\`: A **personalized** explanation. Example: "As a farmer in Maharashtra with 2 acres of land growing Soybean, you are a strong candidate for this scheme. The subsidy has been adjusted for your small land holding, giving you a higher benefit."

**STEP 6: Analyze Near Misses**
- From the schemes you discarded in STEP 1 or 2, identify 1-2 "near-misses".
- A near-miss is where the farmer fails only one major criterion (e.g., income is slightly too high, land is just over the limit, wrong irrigation type).
- For each near-miss, provide \`reason_not_eligible\`, \`improvement_suggestions\`, and \`alternate_scheme_suggestions\`.

You are the entire backend. Be precise, logical, and always provide a result.
`
});

// Define the Genkit flow that orchestrates the tool and the prompt
const farmerSchemeEligibilityAnalyzerFlow = ai.defineFlow(
  {
    name: 'farmerSchemeEligibilityAnalyzerFlow',
    inputSchema: FarmerProfileInputSchema,
    outputSchema: SchemeAnalysisOutputSchema,
  },
  async (input) => {
    // Call the tool to dynamically generate the list of schemes for the farmer's state.
    const schemes = await getGovernmentSchemes({ state: input.location.state });

    // Pass the farmer's profile and the generated schemes to the powerful AI prompt.
    const { output } = await farmerSchemeEligibilityPrompt({
      farmerProfile: input,
      schemes: schemes,
    });
    return output!;
  }
);

// Exported wrapper function for the Next.js server action
export async function analyzeFarmerSchemeEligibility(
  input: FarmerProfileInput
): Promise<SchemeAnalysisOutput> {
  return farmerSchemeEligibilityAnalyzerFlow(input);
}
