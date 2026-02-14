import { z } from 'genkit';

// Input Schema for farmer's profile
export const FarmerProfileInputSchema = z.object({
  landSize: z.number().positive().describe('The size of the farmer\'s land in acres.'),
  location: z.object({
    state: z.string().describe('The state where the farm is located.'),
    district: z.string().describe('The district within the state.'),
  }).describe('The geographical location of the farm.'),
  cropType: z.string().describe('The primary crop type cultivated by the farmer (e.g., "Wheat", "Rice", "Cotton").'),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']).describe('The primary irrigation method used (e.g., "Rainfed", "Well", "Canal").'),
  annualIncome: z.number().min(0).describe('The farmer\'s annual income in local currency.'),
});

// Schema for a single government scheme (internal to the tool/prompt)
export const GovernmentSchemeSchema = z.object({
  name: z.string().describe('The name of the government scheme.'),
  benefits: z.string().describe('A summary of the benefits provided by the scheme.'),
  eligibilityCriteria: z.string().describe('Detailed criteria for eligibility (e.g., "Farmers with less than 2 acres of land in drought-prone areas", "Annual income below X", "Cultivates specific crop").'),
  applicationGuideLink: z.string().optional().describe('Link to the official application guide or portal.'),
});

export const MatchedSchemeSchema = z.object({
  name: z.string().describe('The name of the government scheme.'),
  benefits: z.string().describe('A summary of the benefits provided by the scheme.'),
  eligibilityCriteria: z.string().describe('Detailed criteria for eligibility.'),
  semantic_similarity_score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "A score from 0-100 indicating the semantic relevance of the scheme to the farmer's profile. Higher scores mean better relevance."
    ),
  relevance_reason: z
    .string()
    .describe(
      'A detailed explanation of why the scheme is considered relevant, referencing both the farmer\'s profile and the scheme\'s criteria. If possibly relevant, this should state what needs to be reviewed.'
    ),
  is_possibly_relevant: z
    .boolean()
    .describe(
      'True if the scheme is only possibly relevant and requires the user to review the details.'
    ),
  applicationGuideLink: z
    .string()
    .optional()
    .describe('Link to the official application guide or portal.'),
});

// New Schema for Near Misses
const NearMissSchemeSchema = z.object({
  name: z.string().describe('The name of the scheme the farmer nearly qualifies for.'),
  reason_not_eligible: z.string().describe('A clear explanation of the specific criteria the farmer fails to meet.'),
  improvement_suggestions: z.array(z.string()).describe('Actionable suggestions for what the farmer could change to become eligible in the future (e.g., "Form a Self-Help Group", "Switch to a water-saving irrigation method like Drip").'),
  alternate_scheme_suggestions: z.array(z.string()).describe('A list of other scheme names from the provided list that might be a better fit for the farmer\'s current profile.'),
});

// Output Schema for the analysis
export const SchemeAnalysisOutputSchema = z.object({
  matchedSchemes: z
    .array(MatchedSchemeSchema)
    .describe(
      "A list of government schemes that are semantically relevant to the farmer's profile, sorted by relevance score."
    ),
  nearMisses: z.array(NearMissSchemeSchema).describe('A list of schemes where the farmer is close to qualifying, with suggestions for improvement.'),
});


// Schemas for Document Readiness Checker
export const DocumentReadinessInputSchema = z.object({
  userDocuments: z.array(z.string()).describe("A list of documents that the farmer has."),
  matchedSchemes: z.array(MatchedSchemeSchema).describe("The schemes the farmer was matched with."),
});

export const DocumentReadinessOutputSchema = z.object({
  missing_documents: z.array(z.string()).describe("A list of required documents that the farmer is missing."),
  optional_alternatives: z.array(z.string()).describe("Suggestions for alternative documents or guidance on how to obtain the missing ones."),
  readiness_status: z.string().describe("A summary status of the farmer's document readiness (e.g., 'Ready to Apply', 'Missing Key Documents')."),
});

// Schemas for Predictive Scheme Analyzer
export const PredictedSchemeSchema = z.object({
  predicted_scheme_category: z.string().describe('The category of the predicted upcoming scheme (e.g., "Drought Relief", "Kharif Crop Insurance").'),
  probability_of_relevance: z.enum(['High', 'Medium', 'Low']).describe('The estimated probability that a scheme in this category will become relevant.'),
  reasoning: z.string().describe('A brief explanation for the prediction, citing factors like crop cycle, state policies, or historical trends.'),
  preparation_advice: z.string().describe('Actionable advice for the farmer to prepare for this potential future scheme.'),
});

export const PredictiveAnalysisOutputSchema = z.object({
  predictions: z.array(PredictedSchemeSchema).describe('A list of predicted scheme categories that may become relevant in the next 6 months.'),
});
