export const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const crops = [
  'Rice', 'Wheat', 'Maize', 'Bajra', 'Jowar', 'Barley', 'Sugarcane', 'Cotton', 'Soybean', 'Groundnut',
  'Mustard', 'Sunflower', 'Pulses', 'Tur', 'Chana', 'Tea', 'Coffee', 'Rubber', 'Coconut', 'Banana',
  'Mango', 'Onion', 'Potato', 'Tomato', 'Chili', 'Millets'
];

export const costOfLivingMultipliers: { [key: string]: number } = {
  // High Cost (1.30)
  'Maharashtra': 1.30, 'Karnataka': 1.30, 'Tamil Nadu': 1.30, 'Telangana': 1.30, 'Goa': 1.30,
  // Upper-Middle (1.15)
  'Gujarat': 1.15, 'Kerala': 1.15, 'Punjab': 1.15, 'Haryana': 1.15, 'West Bengal': 1.15, 'Andhra Pradesh': 1.15,
  // Middle (1.00)
  'Rajasthan': 1.00, 'Madhya Pradesh': 1.00, 'Uttar Pradesh': 1.00, 'Odisha': 1.00, 'Assam': 1.00, 'Chhattisgarh': 1.00, 'Uttarakhand': 1.00, 'Himachal Pradesh': 1.00,
  // Lower (0.85)
  'Bihar': 0.85, 'Jharkhand': 0.85, 'Tripura': 0.85, 'Manipur': 0.85, 'Meghalaya': 0.85, 'Mizoram': 0.85, 'Nagaland': 0.85, 'Arunachal Pradesh': 0.85, 'Sikkim': 0.85
};

export const schemeTemplates = [
  { category: 'Crop Support Subsidy', baseSubsidy: 15000, benefits: 'Provides direct financial support to farmers for crop cultivation, reducing the overall cost and financial burden.' },
  { category: 'Irrigation Equipment Subsidy', baseSubsidy: 50000, benefits: 'Offers subsidies on the purchase of modern irrigation equipment like drip systems, sprinklers, and pumps to improve water efficiency.' },
  { category: 'Organic Farming Incentive', baseSubsidy: 25000, benefits: 'Promotes organic farming by providing financial incentives for using organic inputs and certification, leading to higher-value produce.' },
  { category: 'Seed Distribution Scheme', baseSubsidy: 10000, benefits: 'Ensures availability of high-quality, certified seeds at subsidized rates to improve crop yield and resilience.' },
  { category: 'Machinery Purchase Subsidy', baseSubsidy: 100000, benefits: 'Helps farmers purchase essential agricultural machinery like tractors and harvesters at a reduced cost, promoting mechanization.' },
  { category: 'Solar Pump Scheme', baseSubsidy: 120000, benefits: 'Provides significant subsidies for installing solar-powered water pumps, reducing dependency on electricity and diesel.' },
  { category: 'Crop Insurance Scheme', baseSubsidy: 20000, benefits: 'Offers insurance coverage against crop failure due to natural calamities, pests, and diseases, ensuring financial stability.' },
  { category: 'Export Promotion Support', baseSubsidy: 75000, benefits: 'Provides support for farmers and FPOs to meet international quality standards and access global markets.' },
  { category: 'Storage Infrastructure Aid', baseSubsidy: 150000, benefits: 'Financial aid for constructing warehouses and cold storage units to reduce post-harvest losses and improve price realization.' },
  { category: 'Women Farmer Support Scheme', baseSubsidy: 30000, benefits: 'Special financial assistance and training programs exclusively for women farmers to empower them in agriculture.' },
  { category: 'Small Land Holding Bonus Scheme', baseSubsidy: 12000, benefits: 'Provides an additional bonus to small and marginal farmers to improve their income and livelihood security.' },
  { category: 'Rainfed Farming Support', baseSubsidy: 18000, benefits: 'Support for farmers in rainfed areas through water conservation techniques and drought-resistant crop varieties.' },
  { category: 'Fertilizer Assistance Program', baseSubsidy: 8000, benefits: 'Provides fertilizers and micro-nutrients at subsidized rates to ensure balanced soil nutrition.' },
  { category: 'Youth Agri-Entrepreneur Scheme', baseSubsidy: 200000, benefits: 'Encourages youth to take up agriculture as a business by providing financial support and mentorship for innovative agri-projects.' },
  { category: 'High Yield Crop Incentive', baseSubsidy: 22000, benefits: 'Incentivizes the cultivation of high-yield crop varieties to boost overall farm productivity and income.' }
];

export const nationalSchemes = [
    {
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        benefits: 'Provides insurance coverage and financial support to farmers in case of crop failure due to natural calamities, pests & diseases.',
        eligibilityCriteria: 'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas are eligible. Compulsory for loanee farmers availing Crop Loan/KCC account for notified crops. Voluntary for non-loanee farmers.',
        applicationGuideLink: 'https://pmfby.gov.in/'
    },
    {
        name: 'Kisan Credit Card (KCC) Scheme',
        benefits: 'Provides adequate and timely credit support from the banking system to the farmers for their cultivation needs.',
        eligibilityCriteria: 'Farmers, individual/joint cultivators, tenant farmers, oral lessees & sharecroppers, SHGs/JLG of farmers are eligible. Minimum age 18 years, maximum 75 years.',
        applicationGuideLink: 'https://www.nabard.org/content.aspx?id=599'
    },
    {
        name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
        benefits: 'Provides income support of ₹6,000 per year to all eligible farmer families across the country.',
        eligibilityCriteria: 'All landholding farmer families, subject to certain exclusion criteria related to income and profession.',
        applicationGuideLink: 'https://pmkisan.gov.in/'
    }
];

export const fallbackScheme = {
    name: 'Universal Farmer Development Scheme',
    benefits: 'A universal support scheme providing basic financial aid and access to resources for all farmers to ensure baseline agricultural development and welfare.',
    eligibilityCriteria: 'All farmers residing in India are eligible to apply.',
};
