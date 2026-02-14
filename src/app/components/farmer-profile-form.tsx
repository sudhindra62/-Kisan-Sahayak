"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { FarmerProfileInput } from "@/ai/schemas";
import { IndianRupee, FileUp } from "lucide-react";
import { useState } from "react";
import FileUploader from "./file-uploader";

// Zod schema to match the logic from the AI flow.
const formSchema = z.object({
  landSize: z.coerce.number().positive({ message: "Land size must be a positive number." }),
  location: z.object({
    state: z.string().min(2, { message: "State is required." }),
    district: z.string().min(2, { message: "District is required." }),
  }),
  cropType: z.string().min(2, { message: "Crop type is required." }),
  irrigationType: z.enum(['Rainfed', 'Well', 'Canal', 'Other']),
  annualIncome: z.coerce.number().min(0, { message: "Annual income cannot be negative." }),
  farmerCategory: z.enum(['Small and Marginal', 'Medium', 'Large']),
});

type DocumentsState = {
  landProofUrl?: string;
  incomeCertificateUrl?: string;
  cropProofUrl?: string;
  bankPassbookUrl?: string;
  identityProofUrl?: string;
}

type FarmerProfileFormProps = {
  onSubmit: (data: FarmerProfileInput, documents: DocumentsState) => void;
  isLoading: boolean;
  userId: string | undefined;
  isUserLoading: boolean;
};

export default function FarmerProfileForm({ onSubmit, isLoading, userId, isUserLoading }: FarmerProfileFormProps) {
  const [documents, setDocuments] = useState<DocumentsState>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landSize: undefined,
      location: {
        state: "",
        district: "",
      },
      cropType: "",
      irrigationType: 'Rainfed',
      annualIncome: undefined,
      farmerCategory: 'Small and Marginal',
    },
  });

  const handleUploadComplete = (docType: keyof DocumentsState, url: string) => {
    setDocuments(prev => ({...prev, [docType]: url}));
  }

  const handleFileRemove = (docType: keyof DocumentsState) => {
    setDocuments(prev => {
      const newDocs = {...prev};
      delete newDocs[docType];
      return newDocs;
    });
  }

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data, documents);
  }

  const requiredDocsUploaded = documents.landProofUrl && documents.incomeCertificateUrl && documents.cropProofUrl;
  const isSubmitDisabled = isLoading || isUserLoading || !userId || !requiredDocsUploaded;

  return (
     <form onSubmit={form.handleSubmit(handleFormSubmit)} style={{width: '100%'}}>
        <div className="grid">
            <div className="input-group">
                <label>Land Size (in acres)</label>
                <input type="number" placeholder="e.g., 5" {...form.register("landSize")} />
                {form.formState.errors.landSize && <p className="error-message">{form.formState.errors.landSize.message}</p>}
            </div>

            <div className="input-group">
                <label>Annual Income (in <IndianRupee className="inline h-4 w-4" />)</label>
                <input type="number" placeholder="e.g., 50000" {...form.register("annualIncome")} />
                {form.formState.errors.annualIncome && <p className="error-message">{form.formState.errors.annualIncome.message}</p>}
            </div>

            <div className="input-group">
                <label>State</label>
                <input type="text" placeholder="e.g., Maharashtra" {...form.register("location.state")} />
                {form.formState.errors.location?.state && <p className="error-message">{form.formState.errors.location.state.message}</p>}
            </div>

            <div className="input-group">
                <label>District</label>
                <input type="text" placeholder="e.g., Pune" {...form.register("location.district")} />
                {form.formState.errors.location?.district && <p className="error-message">{form.formState.errors.location.district.message}</p>}
            </div>

            <div className="input-group">
                <label>Primary Crop Type</label>
                <input type="text" placeholder="e.g., Wheat" {...form.register("cropType")} />
                {form.formState.errors.cropType && <p className="error-message">{form.formState.errors.cropType.message}</p>}
            </div>

            <div className="input-group">
                <label>Irrigation Type</label>
                <select {...form.register("irrigationType")}>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Well">Well</option>
                    <option value="Canal">Canal</option>
                    <option value="Other">Other</option>
                </select>
                {form.formState.errors.irrigationType && <p className="error-message">{form.formState.errors.irrigationType.message}</p>}
            </div>

            <div className="input-group">
                <label>Farmer Category</label>
                <select {...form.register("farmerCategory")}>
                    <option value="Small and Marginal">Small and Marginal (&lt; 5 acres)</option>
                    <option value="Medium">Medium (5-10 acres)</option>
                    <option value="Large">Large (&gt; 10 acres)</option>
                </select>
                {form.formState.errors.farmerCategory && <p className="error-message">{form.formState.errors.farmerCategory.message}</p>}
            </div>
        </div>

        <div className="document-upload-section">
            <h3 className="section-title"><FileUp className="mr-3 h-7 w-7 text-amber-300" />Upload Required Documents</h3>
            <div className="uploaders-grid">
              <FileUploader 
                label="Land Ownership Proof"
                docType="land_proof"
                onUploadComplete={(url) => handleUploadComplete('landProofUrl', url)}
                onFileRemove={() => handleFileRemove('landProofUrl')}
                userId={userId}
                required
              />
              <FileUploader 
                label="Income Certificate"
                docType="income_certificate"
                onUploadComplete={(url) => handleUploadComplete('incomeCertificateUrl', url)}
                onFileRemove={() => handleFileRemove('incomeCertificateUrl')}
                userId={userId}
                required
              />
              <FileUploader 
                label="Crop Registration Proof"
                docType="crop_proof"
                onUploadComplete={(url) => handleUploadComplete('cropProofUrl', url)}
                onFileRemove={() => handleFileRemove('cropProofUrl')}
                userId={userId}
                required
              />
              <FileUploader 
                label="Bank Passbook Copy"
                docType="bank_passbook"
                onUploadComplete={(url) => handleUploadComplete('bankPassbookUrl', url)}
                onFileRemove={() => handleFileRemove('bankPassbookUrl')}
                userId={userId}
              />
              <FileUploader 
                label="Identity Proof"
                docType="identity_proof"
                onUploadComplete={(url) => handleUploadComplete('identityProofUrl', url)}
                onFileRemove={() => handleFileRemove('identityProofUrl')}
                userId={userId}
              />
            </div>
        </div>


        <button className="premium-btn" type="submit" disabled={isSubmitDisabled}>
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Analyzing...
            </>
          ) : isUserLoading ? (
            <>
               <span className="loading-spinner"></span>
              Authenticating...
            </>
          )
           : (
            "Find Schemes"
          )}
        </button>
        {isSubmitDisabled && !isLoading && !isUserLoading && (
          <p className="error-message text-center mt-4">Please upload all required documents (Land Proof, Income Certificate, Crop Proof) to continue.</p>
        )}
    </form>
  );
}
