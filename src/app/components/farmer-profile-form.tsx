"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import type { FarmerProfileInput } from "@/ai/schemas";
import { IndianRupee, FileUp, Ruler, MapPin, Tractor, Droplets, LayoutGrid, Info, User, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import FileUploader from "./file-uploader";
import { useFirestore, setDocument } from "@/firebase";
import { doc } from "firebase/firestore";

const formSchema = z.object({
  fullName: z.string().min(3, { message: "Full name is required." }),
  aadhaarNumber: z.string().length(12, { message: "Aadhaar number must be exactly 12 digits." }).regex(/^\d+$/, { message: "Aadhaar must contain only digits." }),
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
  identityProofUrl?: string;
  damagedCropImageUrl?: string;
}

type FarmerProfileFormProps = {
  onSubmit: (data: FarmerProfileInput, documents: DocumentsState) => void;
  isLoading: boolean;
  userId: string | undefined;
  isUserLoading: boolean;
};

export default function FarmerProfileForm({ onSubmit, isLoading, userId, isUserLoading }: FarmerProfileFormProps) {
  const [documents, setDocuments] = useState<DocumentsState>({});
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      aadhaarNumber: "",
      landSize: 2,
      location: {
        state: "",
        district: "",
      },
      cropType: "",
      irrigationType: 'Rainfed',
      annualIncome: 50000,
      farmerCategory: 'Small and Marginal',
    },
  });

  const landSizeValue = useWatch({
    control: form.control,
    name: 'landSize'
  });

  useEffect(() => {
      const getCategory = (size: number | undefined) => {
        if (size === undefined || size === null) return 'Small and Marginal';
        if (size < 5) return 'Small and Marginal';
        if (size <= 10) return 'Medium';
        return 'Large';
      }
      form.setValue('farmerCategory', getCategory(landSizeValue));
  }, [landSizeValue, form]);


  const handleUploadComplete = (docType: keyof DocumentsState, url: string) => {
    setDocuments(prev => ({...prev, [docType]: url}));
    
    if (userId && firestore) {
        const docRef = doc(firestore, 'users', userId, 'uploaded_documents', userId);
        setDocument(docRef, {
            [docType]: url,
            id: userId,
            lastUpdate: new Date().toISOString(),
        }, { merge: true });
    }
  }

  const handleFileRemove = (docType: keyof DocumentsState) => {
    setDocuments(prev => {
      const newDocs = {...prev};
      delete newDocs[docType];
      return newDocs;
    });

    if (userId && firestore) {
        const docRef = doc(firestore, 'users', userId, 'uploaded_documents', userId);
        setDocument(docRef, {
            [docType]: null,
        }, { merge: true });
    }
  }

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data, documents);
  }

  const isSubmitDisabled = isLoading || isUserLoading || !userId;

  return (
     <form onSubmit={form.handleSubmit(handleFormSubmit)} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div className="input-group">
                <label>
                  <User className="h-5 w-5 text-[#f59e0b]" />
                  Full Name (As per Aadhaar)
                </label>
                <input type="text" placeholder="e.g., Kishan Mohak" {...form.register("fullName")} />
                {form.formState.errors.fullName && <p className="text-red-400 text-xs mt-2">{form.formState.errors.fullName.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <CreditCard className="h-5 w-5 text-[#f59e0b]" />
                  12-Digit Aadhaar Number
                </label>
                <input type="text" maxLength={12} placeholder="e.g., 1234 5678 9101" {...form.register("aadhaarNumber")} />
                {form.formState.errors.aadhaarNumber && <p className="text-red-400 text-xs mt-2">{form.formState.errors.aadhaarNumber.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <Ruler className="h-5 w-5 text-[#f59e0b]" />
                  Land Area (Acres)
                </label>
                <input type="number" step="0.1" placeholder="2" {...form.register("landSize")} />
                {form.formState.errors.landSize && <p className="text-red-400 text-xs mt-2">{form.formState.errors.landSize.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <IndianRupee className="h-5 w-5 text-[#f59e0b]" />
                  Annual Farm Income
                </label>
                <input type="number" placeholder="50000" {...form.register("annualIncome")} />
                {form.formState.errors.annualIncome && <p className="text-red-400 text-xs mt-2">{form.formState.errors.annualIncome.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <MapPin className="h-5 w-5 text-[#f59e0b]" />
                  State of Residence
                </label>
                <input type="text" placeholder="e.g., Maharashtra" {...form.register("location.state")} />
                {form.formState.errors.location?.state && <p className="text-red-400 text-xs mt-2">{form.formState.errors.location.state.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <LayoutGrid className="h-5 w-5 text-[#f59e0b]" />
                  District
                </label>
                <input type="text" placeholder="e.g., Pune" {...form.register("location.district")} />
                {form.formState.errors.location?.district && <p className="text-red-400 text-xs mt-2">{form.formState.errors.location.district.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <Tractor className="h-5 w-5 text-[#f59e0b]" />
                  Primary Crop
                </label>
                <input type="text" placeholder="e.g., Wheat" {...form.register("cropType")} />
                {form.formState.errors.cropType && <p className="text-red-400 text-xs mt-2">{form.formState.errors.cropType.message}</p>}
            </div>

            <div className="input-group">
                <label>
                  <Droplets className="h-5 w-5 text-[#f59e0b]" />
                  Irrigation System
                </label>
                <select {...form.register("irrigationType")}>
                    <option value="Rainfed">Rainfed (Monsoon)</option>
                    <option value="Well">Well / Tube-well</option>
                    <option value="Canal">Canal System</option>
                    <option value="Other">Other Methods</option>
                </select>
                {form.formState.errors.irrigationType && <p className="text-red-400 text-xs mt-2">{form.formState.errors.irrigationType.message}</p>}
            </div>
        </div>

        <div className="mt-16">
            <h3 className="text-2xl font-bold flex items-center gap-4 mb-8">
                <FileUp className="h-8 w-8 text-[#f59e0b]" />
                Required Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                label="Identity Proof"
                docType="identity_proof"
                onUploadComplete={(url) => handleUploadComplete('identityProofUrl', url)}
                onFileRemove={() => handleFileRemove('identityProofUrl')}
                userId={userId}
                required
              />
              <FileUploader 
                label="Damaged Crop Image"
                docType="damaged_crop_image"
                onUploadComplete={(url) => handleUploadComplete('damagedCropImageUrl', url)}
                onFileRemove={() => handleFileRemove('damagedCropImageUrl')}
                userId={userId}
              />
            </div>
        </div>

        <button className="premium-btn mt-16" type="submit" disabled={isSubmitDisabled}>
          {isLoading ? "Finding Schemes..." : "Analyze & Find Schemes"}
        </button>
    </form>
  );
}
