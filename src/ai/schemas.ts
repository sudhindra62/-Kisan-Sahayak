import { z } from 'genkit';

// Input Schema for farmer's profile
export const FarmerProfileInputSchema = z.object({
  landSize: z.coerce.number().positive().describe('The size of the farmer\'s land in acres.'),
  location: z.object({
    state: z.string().describe('The state where the farm is located.'),
    district: z.string().describe('The district within the state.'),
  }).describe('The geographical location of the farm.'),
  cropType: z.string().describe('The primary crop type cultivated by the farmer (e.g., "Wheat", "Rice", "Cotton").'),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']).describe('The primary irrigation method used (e.g., "Rainfed", "Well", "Canal").'),
  annualIncome: z.coerce.number().min(0).describe('The farmer\'s annual income in local currency.'),
  farmerCategory: z.enum(['Small and Marginal', 'Medium', 'Large']).describe('The category of the farmer based on landholding size.'),
});
export type FarmerProfileInput = z.infer<typeof FarmerProfileInputSchema>;

// Schema for a single government scheme (internal to the tool/prompt)
export const GovernmentSchemeSchema = z.object({
  name: z.string().describe('The name of the government scheme.'),
  benefits: z.string().describe('A summary of the benefits provided by the scheme.'),
  eligibilityCriteria: z.string().describe('Detailed criteria for eligibility.'),
  applicationGuideLink: z.string().optional().describe('Link to the official application guide or portal.'),
  scheme_category: z.string().optional().describe('The category of the scheme.'),
  base_subsidy_amount: z.number().optional().describe('The base subsidy amount before adjustments.'),
});

export const EligibleSchemeSchema = z.object({
  scheme_name: z.string().describe("The name of the eligible government scheme."),
  adjusted_subsidy_amount: z.string().describe("The estimated subsidy amount adjusted for the farmer's state and other factors, formatted as a currency string (e.g., '₹26,000')."),
  scheme_category: z.string().describe("The category of the scheme (e.g., 'Crop Support Subsidy', 'National', 'Irrigation')."),
  explanation: z.string().describe("A clear, personalized explanation of why the farmer qualifies for this scheme, referencing their profile details."),
  benefits: z.string().describe("A summary of the scheme's benefits."),
  eligibilityCriteria: z.string().describe('The original, detailed criteria for eligibility used for guide generation.'),
  applicationGuideLink: z.string().optional().describe('Link to the official application guide or portal.'),
});
export type EligibleScheme = z.infer<typeof EligibleSchemeSchema>;

// New Schema for Near Misses
export const NearMissSchemeSchema = z.object({
  name: z.string().describe('The name of the scheme the farmer nearly qualifies for.'),
  reason_not_eligible: z.string().describe('A clear explanation of the specific criteria the farmer fails to meet.'),
  improvement_suggestions: z.array(z.string()).describe('Actionable suggestions for what the farmer could change to become eligible in the future (e.g., "Form a Self-Help Group", "Switch to a water-saving irrigation method like Drip").'),
  alternate_scheme_suggestions: z.array(z.string()).describe('A list of other scheme names from the provided list that might be a better fit for the farmer\'s current profile.'),
});
export type NearMiss = z.infer<typeof NearMissSchemeSchema>;


// Output Schema for the analysis
export const SchemeAnalysisOutputSchema = z.object({
  eligible_schemes: z
    .array(EligibleSchemeSchema)
    .describe(
      "A list of government schemes that are semantically relevant to the farmer's profile, sorted by relevance."
    ),
  nearMisses: z.array(NearMissSchemeSchema).describe('A list of schemes where the farmer is close to qualifying, with suggestions for improvement.'),
});
export type SchemeAnalysisOutput = z.infer<typeof SchemeAnalysisOutputSchema>;


// Schemas for Document Readiness Checker
export const DocumentReadinessInputSchema = z.object({
  userDocuments: z.array(z.string()).describe("A list of documents that the farmer has."),
  matchedSchemes: z.array(EligibleSchemeSchema).describe("The schemes the farmer was matched with."),
});
export type DocumentReadinessInput = z.infer<typeof DocumentReadinessInputSchema>;

export const DocumentReadinessOutputSchema = z.object({
  missing_documents: z.array(z.string()).describe("A list of required documents that the farmer is missing."),
  optional_alternatives: z.array(z.string()).describe("Suggestions for alternative documents or guidance on how to obtain the missing ones."),
  readiness_status: z.string().describe("A summary status of the farmer's document readiness (e.g., 'Ready to Apply', 'Missing Key Documents')."),
});
export type DocumentReadinessOutput = z.infer<typeof DocumentReadinessOutputSchema>;


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
export type PredictiveAnalysisOutput = z.infer<typeof PredictiveAnalysisOutputSchema>;


// Schema for Central Relief Schemes
export const CentralReliefSchemeSchema = z.object({
    scheme_name: z.string(),
    scheme_type: z.string(),
    eligibility_land_min: z.number(),
    eligibility_land_max: z.number(),
    eligible_crop_types: z.array(z.string()),
    eligible_damage_types: z.array(z.string()),
    applicable_states: z.string(),
    base_compensation_amount: z.number(),
    subsidy_category: z.string(),
    description: z.string(),
    required_documents: z.array(z.string()),
    priority_group: z.string(),
    central_government_scheme: z.boolean(),
});
export type CentralReliefScheme = z.infer<typeof CentralReliefSchemeSchema>;


// Schemas for Chatbot
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatbotInputSchema = z.object({
    farmerProfile: FarmerProfileInputSchema.describe("The farmer's detailed profile."),
    history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
    message: z.string().describe('The latest message from the user.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;


// Schemas for Farmer Summary Generator
export const FarmerSummaryInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  analysisResults: SchemeAnalysisOutputSchema,
});
export type FarmerSummaryInput = z.infer<typeof FarmerSummaryInputSchema>;

export const FarmerSummaryOutputSchema = z.object({
  total_schemes_found: z.number().describe('The total count of directly matched and eligible schemes.'),
  total_estimated_benefit: z.string().describe('A summary of the potential financial benefits from all matched schemes. This should be a descriptive text, not just a number (e.g., "Access to crop insurance, credit facilities, and direct income support.").'),
  immediate_action_steps: z.array(z.string()).describe('A short, prioritized list of 2-3 immediate actions the farmer should take, like applying for the top-matched scheme.'),
  long_term_growth_suggestions: z.array(z.string()).describe('Actionable long-term suggestions for growth, often derived from the "near-miss" analysis (e.g., "Consider forming a Self-Help Group to become eligible for...").'),
  motivational_summary: z.string().describe('A brief, empowering, and motivational closing message for the farmer.'),
});
export type FarmerSummaryOutput = z.infer<typeof FarmerSummaryOutputSchema>;


// Schemas for Scheme Application Guide Generator
export const SchemeApplicationGuideInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  scheme: z.object({
    name: z.string(),
    benefits: z.string(),
    eligibilityCriteria: z.string(),
    applicationGuideLink: z.string().optional(),
  }),
});
export type SchemeApplicationGuideInput = z.infer<typeof SchemeApplicationGuideInputSchema>;

export const SchemeApplicationGuideOutputSchema = z.object({
    schemeName: z.string().describe('The name of the government scheme.'),
    documentsRequired: z.array(z.string()).describe('A list of documents the farmer will likely need to apply.'),
    applicationSteps: z.array(z.object({
        step: z.number(),
        title: z.string(),
        description: z.string(),
        isOnline: z.boolean().describe('Whether this step is for an online or offline process.')
    })).describe('A step-by-step guide for both online and offline application processes.'),
    estimatedTimeline: z.string().describe('An estimated timeline for scheme approval, from application to receiving benefits.'),
    commonMistakes: z.array(z.string()).describe('A list of common mistakes to avoid during the application process.'),
    contactAuthority: z.string().describe('The name and contact details (if available) of the local authority to contact for help.'),
});
export type SchemeApplicationGuideOutput = z.infer<typeof SchemeApplicationGuideOutputSchema>;


// Schemas for Scheme Benefit Summarizer
export const SchemeBenefitSummarizerInputSchema = z.object({
  schemeName: z.string().describe('The name of the government scheme.'),
  schemeDescription: z.string().describe('The full description of the scheme.'),
  eligibilityCriteria: z
    .string()
    .describe('The detailed eligibility criteria for the scheme.'),
});
export type SchemeBenefitSummarizerInput = z.infer<
  typeof SchemeBenefitSummarizerInputSchema
>;

export const SchemeBenefitSummarizerOutputSchema = z.object({
  benefitsSummary: z
    .string()
    .describe('A concise summary of the scheme\'s key benefits.'),
  eligibilitySummary: z
    .string()
    .describe('A concise summary of the scheme\'s core eligibility requirements.'),
});
export type SchemeBenefitSummarizerOutput = z.infer<
  typeof SchemeBenefitSummarizerOutputSchema
>;


// Schemas for Translation
export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z
    .string()
    .describe('The language to translate the text into (e.g., "Hindi", "Kannada").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;
