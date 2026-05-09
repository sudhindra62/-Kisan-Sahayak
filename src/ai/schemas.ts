import { z } from 'zod';

// Input Schema for farmer's profile
export const FarmerProfileInputSchema = z.object({
  fullName: z.string().describe('The full name of the farmer as per government records.'),
  aadhaarNumber: z.string().length(12).describe('The 12-digit Aadhaar number of the farmer.'),
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

// Crop Advisor Schemas
export const CropAdvisorInputSchema = z.object({
  state: z.string().describe("The farmer's state."),
  primaryCrop: z.string().describe("The farmer's current primary crop."),
});
export type CropAdvisorInput = z.infer<typeof CropAdvisorInputSchema>;

export const SeasonForecastSchema = z.object({
  seasonName: z.string().describe("Name of the season (e.g., Winter, Monsoon)."),
  months: z.string().describe("Month range (e.g., Jan-Mar)."),
  tempRange: z.string().describe("Predicted temperature range (e.g., 15°C - 28°C)."),
  humidity: z.string().describe("Predicted humidity level (e.g., 40-50%)."),
  rainfall: z.string().describe("Predicted rainfall (e.g., Low, 10-20mm)."),
  wind: z.string().describe("Wind conditions (e.g., Moderate, 12km/h)."),
  recommendedCrops: z.array(z.string()).describe("List of 3-4 recommended crops with emojis."),
  avoidCrops: z.array(z.string()).describe("1-2 crops to avoid."),
  soilTip: z.string().describe("A one-line advisory tip for soil health."),
  confidenceScore: z.number().min(0).max(100).describe("AI confidence score (0-100)."),
  icon: z.enum(['snowflake', 'sun', 'cloud-rain', 'leaf']).describe("Icon representing the season."),
});

export const CropAdvisorOutputSchema = z.object({
  forecasts: z.array(SeasonForecastSchema).length(4),
});
export type CropAdvisorOutput = z.infer<typeof CropAdvisorOutputSchema>;

// Schema for a single government scheme
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

// Extracted Data from Documents
export const ExtractedDocumentDataSchema = z.object({
    landCertificateId: z.string().describe("Extracted Land Holding ID from PDF"),
    identityCardNumber: z.string().describe("Extracted Aadhaar/ID number from PDF"),
    incomeCertificateId: z.string().describe("Extracted Income Certificate Reference from PDF"),
    issuingAuthority: z.string().describe("The government office that issued these documents"),
    extractionConfidence: z.number().describe("AI confidence level of extraction"),
    extractedLines: z.array(z.string()).describe("A sample of the lines extracted from the files for verification"),
});
export type ExtractedDocumentData = z.infer<typeof ExtractedDocumentDataSchema>;

// Subsidy Claim Schemas
export const SubsidyClaimInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  scheme: EligibleSchemeSchema,
  uploadedDocuments: z.object({
    landProofUrl: z.string().optional(),
    incomeCertificateUrl: z.string().optional(),
    identityProofUrl: z.string().optional(),
  }),
  userId: z.string(),
  extractedData: ExtractedDocumentDataSchema.optional(),
});
export type SubsidyClaimInput = z.infer<typeof SubsidyClaimInputSchema>;

export const SubsidyClaimOutputSchema = z.object({
  success: z.boolean(),
  claimId: z.string().optional(),
  documentBase64: z.string().optional(),
  extractedData: ExtractedDocumentDataSchema.optional(),
  message: z.string(),
  status: z.enum(['Submitted', 'Pending Review', 'Rejected', 'Error', 'Preview']),
});
export type SubsidyClaimOutput = z.infer<typeof SubsidyClaimOutputSchema>;

// Near Miss Schema
export const NearMissSchemeSchema = z.object({
  name: z.string(),
  reason_not_eligible: z.string(),
  improvement_suggestions: z.array(z.string()),
  alternate_scheme_suggestions: z.array(z.string()),
});
export type NearMiss = z.infer<typeof NearMissSchemeSchema>;

// Document Readiness Output Schema
export const DocumentReadinessOutputSchema = z.object({
  missing_documents: z.array(z.string()),
  optional_alternatives: z.array(z.string()),
  readiness_status: z.string(),
});
export type DocumentReadinessOutput = z.infer<typeof DocumentReadinessOutputSchema>;

export const SchemeAnalysisOutputSchema = z.object({
  eligible_schemes: z.array(EligibleSchemeSchema),
  nearMisses: z.array(NearMissSchemeSchema).describe('A list of schemes where the farmer is close to qualifying, with suggestions for improvement.'),
});
export type SchemeAnalysisOutput = z.infer<typeof SchemeAnalysisOutputSchema>;

export const DocumentReadinessInputSchema = z.object({
  userDocuments: z.array(z.string()),
  matchedSchemes: z.array(EligibleSchemeSchema),
});

export const PredictedSchemeSchema = z.object({
  predicted_scheme_category: z.string(),
  probability_of_relevance: z.enum(['High', 'Medium', 'Low']),
  reasoning: z.string(),
  preparation_advice: z.string(),
});

export const PredictiveAnalysisOutputSchema = z.object({
  predictions: z.array(PredictedSchemeSchema),
});
export type PredictiveAnalysisOutput = z.infer<typeof PredictiveAnalysisOutputSchema>;

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

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatbotInputSchema = z.object({
    farmerProfile: FarmerProfileInputSchema,
    history: z.array(ChatMessageSchema),
    message: z.string(),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

export const FarmerSummaryInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  analysisResults: SchemeAnalysisOutputSchema,
});
export const FarmerSummaryOutputSchema = z.object({
  total_schemes_found: z.number(),
  total_estimated_benefit: z.string(),
  immediate_action_steps: z.array(z.string()),
  long_term_growth_suggestions: z.array(z.string()),
  motivational_summary: z.string(),
});

export const SchemeApplicationGuideInputSchema = z.object({
  farmerProfile: FarmerProfileInputSchema,
  scheme: z.object({
    name: z.string(),
    benefits: z.string(),
    eligibilityCriteria: z.string(),
    applicationGuideLink: z.string().optional(),
  }),
});
export const SchemeApplicationGuideOutputSchema = z.object({
    schemeName: z.string(),
    documentsRequired: z.array(z.string()),
    applicationSteps: z.array(z.object({
        step: z.number(),
        title: z.string(),
        description: z.string(),
        isOnline: z.boolean()
    })),
    estimatedTimeline: z.string(),
    commonMistakes: z.array(z.string()),
    contactAuthority: z.string(),
});

export const SchemeBenefitSummarizerInputSchema = z.object({
  schemeName: z.string(),
  schemeDescription: z.string(),
  eligibilityCriteria: z.string(),
});
export const SchemeBenefitSummarizerOutputSchema = z.object({
  benefitsSummary: z.string(),
  eligibilitySummary: z.string(),
});

export const TranslateTextInputSchema = z.object({
  text: z.string(),
  targetLanguage: z.string(),
});
export const TranslateTextOutputSchema = z.object({
  translatedText: z.string(),
});

export const TextToSpeechInputSchema = z.object({
  text: z.string(),
});
export const TextToSpeechOutputSchema = z.object({
  audioData: z.string(),
  error: z.string().optional(),
});
